# Invite Flow Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three bugs in the invite acceptance flow: lost callbackUrl after login, TEMPORARY users accessing all routes, and unnecessary email-entry step when session already has an email claim.

**Architecture:** Three independent changes: (1) move `/invite/accept` into a new `(invite)` route group with no `verifySession()` so `useSession({ required: true })` preserves the callbackUrl naturally; (2) add a TEMPORARY status guard in the `(home)` layout that redirects to a holding page; (3) replace client-side email match/mismatch logic with an auto-submit effect that delegates to the backend.

**Tech Stack:** Next.js 15 App Router, NextAuth 4, React Query 5, TypeScript, IGRP Design System (`@igrp/igrp-framework-react-design-system`), Biome (linter/formatter — run `pnpm lint` to check, `pnpm format` to fix)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| CREATE | `src/app/(invite)/layout.tsx` | Minimal layout for `/invite/accept` — QueryProvider only, no auth gate |
| CREATE | `src/app/(invite)/invite/accept/page.tsx` | Re-export AcceptInvitePage (moved from `(igrp)`) |
| DELETE | `src/app/(igrp)/invite/accept/page.tsx` | Replaced by the file above |
| CREATE | `src/features/users/components/invite/invite-pending-state.tsx` | UI for TEMPORARY users blocked from home routes |
| CREATE | `src/app/(igrp)/invite/pending/page.tsx` | Page that renders InvitePendingState inside InviteCardShell |
| MODIFY | `src/app/(igrp)/(home)/layout.tsx` | Add TEMPORARY guard before rendering IGRPLayout |
| MODIFY | `src/features/users/components/invite/invite-flow-state.ts` | Add `email-auto-submit` step, `bootstrap-ok-has-email` action, update reducer |
| MODIFY | `src/features/users/components/invite/accept-invite-page.tsx` | Update bootstrap effect, add auto-submit effect, add render case |

---

## Task 1: Create (invite) Route Group

**Why:** `/invite/accept` currently sits under the `(igrp)` layout which calls `verifySession()` → `redirect("/login")` with **no callbackUrl**. After login the user lands on `/` not the invite URL. Moving it to a separate group with no `verifySession()` fixes this — `useSession({ required: true })` inside `AcceptInvitePage` handles auth client-side and encodes the full current URL (including `?token=…`) as callbackUrl automatically.

**Files:**
- Create: `src/app/(invite)/layout.tsx`
- Create: `src/app/(invite)/invite/accept/page.tsx`
- Delete: `src/app/(igrp)/invite/accept/page.tsx`

---

- [ ] **Step 1.1: Create the (invite) group layout**

Create `src/app/(invite)/layout.tsx` with this content:

```tsx
import { QueryProvider } from "@/providers/query-provider";

export default function InviteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <QueryProvider>{children}</QueryProvider>;
}
```

No `verifySession()` here. Auth is handled client-side by `useSession({ required: true })` inside `AcceptInvitePage`.

- [ ] **Step 1.2: Create the page re-export**

Create `src/app/(invite)/invite/accept/page.tsx`:

```tsx
export { AcceptInvitePage as default } from "@/features/users/components/invite/accept-invite-page";
```

This is identical to the current `(igrp)/invite/accept/page.tsx`. The URL `/invite/accept` is unchanged — Next.js routes by file path, not group name.

- [ ] **Step 1.3: Delete the old page**

Delete `src/app/(igrp)/invite/accept/page.tsx`. Both files resolve to `/invite/accept`; Next.js will error if both exist.

- [ ] **Step 1.4: Verify build passes**

```bash
pnpm build
```

Expected: build succeeds, no TypeScript or route conflict errors.

- [ ] **Step 1.5: Commit**

```bash
git add src/app/(invite)/layout.tsx src/app/(invite)/invite/accept/page.tsx
git rm src/app/(igrp)/invite/accept/page.tsx
git commit -m "feat(invite): move /invite/accept to (invite) route group to preserve callbackUrl"
```

---

## Task 2: Create /invite/pending Holding Page

**Why:** TEMPORARY users who navigate directly to `/` (or any home route) will be redirected to `/invite/pending` by the guard added in Task 3. This page tells them to check their email. It must be under `(igrp)` but **outside** `(home)` so the guard in the home layout never triggers on it.

**Files:**
- Create: `src/features/users/components/invite/invite-pending-state.tsx`
- Create: `src/app/(igrp)/invite/pending/page.tsx`

---

- [ ] **Step 2.1: Create the InvitePendingState component**

Create `src/features/users/components/invite/invite-pending-state.tsx`:

```tsx
"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";

export function InvitePendingState() {
  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <IGRPIcon iconName="Mail" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Convite pendente</h2>
        <p className="text-sm text-muted-foreground px-4">
          Você tem um convite pendente. Verifique o seu email para encontrar o
          link de convite e continuar.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2.2: Create the page**

Create `src/app/(igrp)/invite/pending/page.tsx`:

```tsx
import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";
import { InvitePendingState } from "@/features/users/components/invite/invite-pending-state";

export default function InvitePendingPage() {
  return (
    <InviteCardShell>
      <InvitePendingState />
    </InviteCardShell>
  );
}
```

`InviteCardShell` is a client component (`"use client"`) — a server page importing a client component is valid in Next.js App Router.

- [ ] **Step 2.3: Verify build passes**

```bash
pnpm build
```

Expected: build succeeds.

- [ ] **Step 2.4: Commit**

```bash
git add src/features/users/components/invite/invite-pending-state.tsx src/app/(igrp)/invite/pending/page.tsx
git commit -m "feat(invite): add /invite/pending holding page for TEMPORARY users"
```

---

## Task 3: Add TEMPORARY Guard to (home) Layout

**Why:** Users with status `TEMPORARY` in the IGRP platform should not have access to the main app until they accept their invite. The `(home)` layout wraps every authenticated app page (`/`, `/settings/*`, `/profile`). Adding the guard here redirects TEMPORARY users to `/invite/pending` before the heavy `IGRPLayout` even renders. Routes outside `(home)` — including `/invite/pending` and `/invite/accept` — are unaffected.

**Files:**
- Modify: `src/app/(igrp)/(home)/layout.tsx`

---

- [ ] **Step 3.1: Update (home)/layout.tsx**

Replace the full content of `src/app/(igrp)/(home)/layout.tsx` with:

```tsx
import { redirect } from "next/navigation";
import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
import { configLayout } from "@/actions/igrp/layout";
import { getCurrentUser } from "@/actions/user";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser();
  if (user.success && user.data?.status === "TEMPORARY") {
    redirect("/invite/pending");
  }

  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
```

Key design decisions:
- The guard only fires when `user.success` is `true` — if the API is unreachable, the user passes through (fail open). This prevents the guard from breaking the app due to a transient API error.
- The redirect happens before `configLayout()` / `createConfig()` so TEMPORARY users never wait for the full layout config.
- `getCurrentUser()` internally calls `getClientAccess()` which sets up the IGRP API client; it does not depend on the root `(igrp)` layout having called `serverSession()` first.

- [ ] **Step 3.2: Verify build passes**

```bash
pnpm build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3.3: Commit**

```bash
git add src/app/(igrp)/(home)/layout.tsx
git commit -m "feat(invite): block TEMPORARY users from home routes, redirect to /invite/pending"
```

---

## Task 4: Update Invite Flow State Machine

**Why:** The current state machine has `bootstrap-ok-matches` (skip straight to `response`, no OTP) and `bootstrap-ok-mismatch` (hard terminal error). Both are based on client-side email comparison. Replace them with a single `bootstrap-ok-has-email` action that transitions to a new `email-auto-submit` step. The backend (via `validateInvitationEmail`) then determines the outcome. Also extend `email-validated` and `email-error` reducers to accept `email-auto-submit` as a valid source state.

**Files:**
- Modify: `src/features/users/components/invite/invite-flow-state.ts`

---

- [ ] **Step 4.1: Replace the file content**

Replace the full content of `src/features/users/components/invite/invite-flow-state.ts` with:

```ts
export type Step =
  | { kind: "bootstrapping" }
  | { kind: "invalid-invitation" }
  | { kind: "email-mismatch" }
  | { kind: "email-auto-submit"; email: string }
  | { kind: "email-entry"; error?: string }
  | {
      kind: "otp-entry";
      email: string;
      otpError?: string;
      lastSentAt: number;
    }
  | { kind: "response" }
  | { kind: "rejected" };

export type Action =
  | { type: "bootstrap-ok-has-email"; email: string }
  | { type: "bootstrap-ok-no-claim" }
  | { type: "bootstrap-fail" }
  | { type: "email-validated"; email: string }
  | { type: "email-error"; message: string }
  | { type: "otp-validated" }
  | { type: "otp-error"; message: string }
  | { type: "resend-sent" }
  | { type: "change-email" }
  | { type: "rejected" };

export const RESEND_COOLDOWN_MS = 60_000;

export const initialStep: Step = { kind: "bootstrapping" };

export function inviteFlowReducer(state: Step, action: Action): Step {
  switch (action.type) {
    case "bootstrap-ok-no-claim":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-entry" };

    case "bootstrap-ok-has-email":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-auto-submit", email: action.email };

    case "bootstrap-fail":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "invalid-invitation" };

    case "email-validated":
      if (state.kind !== "email-entry" && state.kind !== "email-auto-submit")
        return state;
      return {
        kind: "otp-entry",
        email: action.email,
        lastSentAt: Date.now(),
      };

    case "email-error":
      if (state.kind !== "email-entry" && state.kind !== "email-auto-submit")
        return state;
      return { kind: "email-entry", error: action.message };

    case "otp-validated":
      if (state.kind !== "otp-entry") return state;
      return { kind: "response" };

    case "otp-error":
      if (state.kind !== "otp-entry") return state;
      return {
        kind: "otp-entry",
        email: state.email,
        otpError: action.message,
        lastSentAt: state.lastSentAt,
      };

    case "resend-sent":
      if (state.kind !== "otp-entry") return state;
      return {
        kind: "otp-entry",
        email: state.email,
        lastSentAt: Date.now(),
      };

    case "change-email":
      if (state.kind !== "otp-entry") return state;
      return { kind: "email-entry" };

    case "rejected":
      if (state.kind !== "response") return state;
      return { kind: "rejected" };

    default:
      return state;
  }
}
```

Changes from previous version:
- `bootstrap-ok-matches` and `bootstrap-ok-mismatch` removed from `Action`
- `bootstrap-ok-has-email` added — transitions `bootstrapping` → `email-auto-submit`
- `email-auto-submit` added to `Step`
- `email-validated` and `email-error` now accept `email-auto-submit` as source state
- `email-error` from `email-auto-submit` always lands on `email-entry` (with error message shown) so the user can retry manually if needed

- [ ] **Step 4.2: Verify build passes**

```bash
pnpm build
```

Expected: TypeScript will now flag `accept-invite-page.tsx` for dispatching the removed actions `bootstrap-ok-matches` and `bootstrap-ok-mismatch`. This is expected — Task 5 fixes those.

If the build fails only due to those two dispatch calls in `accept-invite-page.tsx`, proceed to Task 5. If there are other errors, fix them before continuing.

- [ ] **Step 4.3: Commit** (after Task 5 passes build — do NOT commit yet, continue to Task 5)

---

## Task 5: Update AcceptInvitePage

**Why:** Update the bootstrap effect to dispatch the new `bootstrap-ok-has-email` action when a session email is available. Add an `email-auto-submit` effect that fires the `validateInvitationEmail` mutation automatically. Add a render case for the loading state during auto-submit.

**Files:**
- Modify: `src/features/users/components/invite/accept-invite-page.tsx`

---

- [ ] **Step 5.1: Update the bootstrap useEffect**

In `src/features/users/components/invite/accept-invite-page.tsx`, find the block inside the bootstrap `useEffect` that reads:

```ts
    const claimEmail = session?.user?.email;
    if (!claimEmail) {
      dispatch({ type: "bootstrap-ok-no-claim" });
    } else if (claimEmail === invitation.email) {
      dispatch({ type: "bootstrap-ok-matches" });
    } else {
      dispatch({ type: "bootstrap-ok-mismatch" });
    }
```

Replace it with:

```ts
    const claimEmail = session?.user?.email;
    if (!claimEmail) {
      dispatch({ type: "bootstrap-ok-no-claim" });
    } else {
      dispatch({ type: "bootstrap-ok-has-email", email: claimEmail });
    }
```

Also update the `useEffect` dependency array — remove `invitation` (since we no longer compare emails client-side) and keep `session?.user?.email`. The updated dep array:

```ts
  }, [
    step.kind,
    token,
    sessionStatus,
    isLoadingInvitation,
    invitationError,
    invitation,
    session?.user?.email,
  ]);
```

`invitation` can stay in deps (it's fine to keep; it's used in the `invitationError || !invitation` guard above the email block).

- [ ] **Step 5.2: Add the stepEmail derived variable and auto-submit effect**

Directly after the `const [step, dispatch] = useReducer(...)` line, add:

```ts
  const stepEmail = step.kind === "email-auto-submit" ? step.email : null;
```

Then add the auto-submit `useEffect` after all the existing handler functions (after `handleReject`, before the first `if (step.kind === "bootstrapping")` render guard):

```ts
  useEffect(() => {
    if (!stepEmail || !token) return;
    validateEmail.mutate(
      { token, email: stepEmail },
      {
        onSuccess: (result) => {
          if (!result.success) {
            dispatch({
              type: "email-error",
              message: result.error ?? "Erro ao validar email",
            });
            return;
          }
          dispatch({ type: "email-validated", email: stepEmail });
        },
        onError: (err) => {
          dispatch({
            type: "email-error",
            message: (err as Error).message,
          });
        },
      },
    );
  }, [stepEmail, token]);
```

- [ ] **Step 5.3: Add the email-auto-submit render case**

The existing early return for bootstrapping is:

```tsx
  if (step.kind === "bootstrapping") {
    return <AppCenterLoading description="Validando convite..." />;
  }
```

Add an early return for `email-auto-submit` directly after it:

```tsx
  if (step.kind === "email-auto-submit") {
    return <AppCenterLoading description="A validar email..." />;
  }
```

- [ ] **Step 5.4: Verify the complete updated file compiles**

```bash
pnpm build
```

Expected: build succeeds with zero TypeScript errors. The two removed dispatch calls (`bootstrap-ok-matches`, `bootstrap-ok-mismatch`) are now gone and replaced with `bootstrap-ok-has-email`.

- [ ] **Step 5.5: Run the linter and formatter**

```bash
pnpm lint
pnpm format
```

Fix any warnings Biome reports.

- [ ] **Step 5.6: Commit Tasks 4 and 5 together**

```bash
git add src/features/users/components/invite/invite-flow-state.ts src/features/users/components/invite/accept-invite-page.tsx
git commit -m "feat(invite): auto-submit session email to validateInvitationEmail, remove client-side match/mismatch logic"
```

---

## Manual Verification Checklist

Run `pnpm dev` and test these scenarios:

**Scenario A — Unauthenticated user clicks invite link:**
1. Open a private/incognito window (no session)
2. Navigate to `http://localhost:3000/invite/accept?token=<valid-token>`
3. Expected: redirected to login. After logging in, redirected back to `/invite/accept?token=<valid-token>` (not `/`)

**Scenario B — TEMPORARY user navigates to home:**
1. Log in as a user with `status: TEMPORARY` in the IGRP platform
2. Navigate to `http://localhost:3000/`
3. Expected: redirected to `/invite/pending` showing the "check your email" card

**Scenario C — TEMPORARY user uses their invite link:**
1. Same TEMPORARY user navigates to `/invite/accept?token=<their-token>`
2. Expected: skips the email-entry form, shows loading briefly, then goes to OTP step (since session has email)

**Scenario D — Regular user not blocked:**
1. Log in as a user with `status: ACTIVE`
2. Navigate to `/`
3. Expected: home page renders normally, no redirect

**Scenario E — No email in session (edge case):**
1. If a session exists but `session.user.email` is null/undefined
2. Expected: email-entry form is shown (manual entry)
