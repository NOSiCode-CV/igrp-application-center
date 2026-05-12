# Invite Flow Improvements Design

**Date:** 2026-05-12
**Branch:** feature/oidc-auth-integration
**Status:** Approved

## Context

When an admin invites a user, the invitee receives a URL like:
`https://demoigrp.nosi.cv/invite/accept?token=<uuid>`

Three problems exist in the current implementation:

1. **Callback URL lost after login** — unauthenticated users who click the invite link get redirected to `/login` without a `callbackUrl`, so after authenticating they land on `/` instead of returning to the invite page.
2. **TEMPORARY users can access all routes** — invited users have `status: TEMPORARY` in the IGRP platform until they accept. Nothing gates them from navigating to protected app routes before accepting.
3. **Email-entry step shown unnecessarily** — when the OIDC session already contains an email claim, the user should not have to type their email. The session email should be auto-submitted to `validateInvitationEmail` and the backend should determine the next step.

---

## Section 1: Route Isolation (fixes Issue 1)

### Root cause

`/invite/accept` lives under the `(igrp)` route group. Its root layout calls `verifySession()` → `redirect("/login")` with no `callbackUrl`. After login, NextAuth has nowhere to redirect back to, so it falls through to `/`.

### Solution

Move `/invite/accept` into a new sibling route group `(invite)`. This group has a minimal layout — `QueryProvider` only, no `verifySession()`. The `AcceptInvitePage` component already uses `useSession({ required: true })`, which is the standard NextAuth pattern for client-protected pages: it calls `signIn()` internally and **automatically encodes the current full URL (including `?token=…`) as `callbackUrl`**, so login always redirects back to the exact invite URL.

The URL `/invite/accept` is unchanged — Next.js routes by file path, not group name.

### File changes

| Action | Path |
|--------|------|
| CREATE | `src/app/(invite)/layout.tsx` — QueryProvider only |
| MOVE   | `src/app/(igrp)/invite/accept/page.tsx` → `src/app/(invite)/invite/accept/page.tsx` |
| DELETE | `src/app/(igrp)/invite/accept/page.tsx` |
| CREATE | `src/app/(igrp)/invite/pending/page.tsx` — "check your email" holding page |

### New directory structure

```
src/app/
  (igrp)/
    layout.tsx              ← verifySession() + QueryProvider (unchanged)
    invite/
      page.tsx              ← redirect to /invite/accept (unchanged)
      pending/
        page.tsx            ← NEW: holding page for TEMPORARY users
      invite-error/
        page.tsx            ← unchanged
  (invite)/                 ← NEW route group
    layout.tsx              ← QueryProvider only, no verifySession
    invite/
      accept/
        page.tsx            ← MOVED from (igrp)/invite/accept/
```

---

## Section 2: TEMPORARY User Guard (fixes Issue 2)

### Root cause

No layer checks the user's platform status. The status is API-only (not present in the JWT); it is read via the `getCurrentUser()` server action.

### Solution

Add a TEMPORARY guard to `(igrp)/(home)/layout.tsx`. This layout wraps every authenticated app page (`/`, `/settings/*`, `/profile`). The guard calls `getCurrentUser()` and redirects TEMPORARY users to `/invite/pending` before the `IGRPLayout` renders.

Routes outside `(home)` — `/invite/*` in `(igrp)` and `/invite/accept` in `(invite)` — are unaffected.

### Guard logic

```ts
// src/app/(igrp)/(home)/layout.tsx  (addition)
const user = await getCurrentUser();
if (user.success && user.data?.status === "TEMPORARY") {
  redirect("/invite/pending");
}
```

### `/invite/pending` page

Simple server component. No layout chrome. Message:
> *"You have a pending invitation. Please check your email for the invitation link to continue."*

### Trade-off

`getCurrentUser()` adds one server-side API call per `(home)` page navigation for **all** authenticated users, not just TEMPORARY ones. Acceptable for now — TEMPORARY is a short-lived state. A session-cached status flag can be added later if latency becomes a concern.

---

## Section 3: Auto-email Submit (fixes Issue 3)

### Root cause

The bootstrap logic performs a client-side email comparison:
- `claimEmail === invitation.email` → skip directly to `response` (bypasses OTP)
- `claimEmail !== invitation.email` → hard `email-mismatch` error
- no `claimEmail` → show `email-entry` form

This means the backend never validates the email when a session email is present, and the user is either blocked or skips verification entirely.

### Solution

When the session has any email claim, auto-submit it to `validateInvitationEmail`. The backend determines the outcome (OTP required, mismatch, invalid token). The client-side match/mismatch logic is removed.

### State machine changes (`invite-flow-state.ts`)

**New step:**
```ts
{ kind: "email-auto-submit"; email: string }
```

**New action:**
```ts
{ type: "bootstrap-ok-has-email"; email: string }
```

**Removed actions:** `bootstrap-ok-matches`, `bootstrap-ok-mismatch`

**Transitions:**

```
bootstrapping
  ──[session has email]──►  bootstrap-ok-has-email  ──►  email-auto-submit
  ──[no email in session]──► bootstrap-ok-no-claim  ──►  email-entry  (manual)
  ──[token/invitation fail]─► bootstrap-fail         ──►  invalid-invitation

email-auto-submit
  ──[API success]────────────────────────────────────►  otp-entry
  ──[email mismatch error from API]──────────────────►  email-mismatch
  ──[invalid/expired token error from API]───────────►  invalid-invitation
  ──[other API error]────────────────────────────────►  email-entry  (error shown, user retries manually)
```

**Reducer changes:**
- `email-validated`: accept source state `email-entry` OR `email-auto-submit`
- `email-error`: accept source state `email-entry` OR `email-auto-submit` → always transitions to `email-entry` (with error message) so the user can retry manually

### Component changes (`accept-invite-page.tsx`)

1. **Bootstrap `useEffect`:** when `claimEmail` is present (regardless of match) → `dispatch({ type: "bootstrap-ok-has-email", email: claimEmail })`
2. **Auto-submit `useEffect`:** fires when `step.kind === "email-auto-submit"` → calls `validateEmail.mutate({ token, email: step.email }, callbacks)`; the callback maps API errors to specific dispatch actions (`email-mismatch`, `invalid-invitation`, or `email-error`)
3. **Render:** `email-auto-submit` → `<AppCenterLoading description="A validar email..." />`

---

## Complete user journey (after all three fixes)

**First-time invitee (not yet logged in):**
1. Clicks invite link `/invite/accept?token=xxx`
2. `(invite)` layout has no `verifySession`; `useSession({ required: true })` fires → redirects to login with `callbackUrl=/invite/accept?token=xxx`
3. User authenticates → NextAuth redirects back to `/invite/accept?token=xxx`
4. Session has email → auto-submit fires → backend sends OTP
5. User enters OTP → proceeds to accept/reject

**TEMPORARY user navigating directly to `/`:**
1. Already authenticated; hits `(home)` layout
2. `getCurrentUser()` returns `status: TEMPORARY`
3. Redirected to `/invite/pending` — "check your email" message

**TEMPORARY user who navigates to their invite link:**
1. Goes to `/invite/accept?token=xxx` (in `(invite)` group — no TEMPORARY guard)
2. Auto-submit fires → OTP → accepts → status becomes ACTIVE
3. Now free to navigate `(home)` routes

---

## Files touched summary

| File | Change |
|------|--------|
| `src/app/(invite)/layout.tsx` | CREATE |
| `src/app/(invite)/invite/accept/page.tsx` | CREATE (moved) |
| `src/app/(igrp)/invite/accept/page.tsx` | DELETE |
| `src/app/(igrp)/invite/pending/page.tsx` | CREATE |
| `src/app/(igrp)/(home)/layout.tsx` | MODIFY — add TEMPORARY guard |
| `src/features/users/components/invite/invite-flow-state.ts` | MODIFY — new step/action, updated reducer |
| `src/features/users/components/invite/accept-invite-page.tsx` | MODIFY — bootstrap + auto-submit effects |
