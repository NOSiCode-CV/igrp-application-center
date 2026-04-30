# Invitation Accept Flow — Design

**Date:** 2026-04-30
**Author:** Fidel da Luz
**Status:** Draft — pending review
**Scope:** Frontend redesign of `/invite/accept` to support the OTP-based email-verification flow, while reusing the visual layout from `Invite.tsx` (downloaded mockup) on top of the IGRP design system.

---

## Goal

Replace the current minimal `/invite/accept` page with a multi-step flow that:

1. Validates the invitation token from the URL.
2. Branches on whether the authenticated user's JWT carries a verified `email` claim.
3. When the claim is missing, walks the user through email entry → OTP verification, calling two newly-exposed backend endpoints (`validateInvitationEmail`, `validateInvitationOtp`).
4. When the claim is present, either shows the invitation response screen (claim matches the invited email) or a terminal "invitation does not correspond to this account" screen (claim mismatches).
5. Lets the user accept (toast + redirect to `/`) or reject (terminal "Convite Rejeitado" screen with "Voltar ao início" link).

The existing route `/invite/accept?token=…` stays — backend invitation emails point to it, changing it would break in-flight invitations.

## Non-goals

- No new design-system components — everything composes from existing IGRP exports.
- No custom theme tokens or forced dark mode — light/dark both supported via tokens.
- No rejection-reason capture (the SDK supports `observation?` on `UserInvitationResponseDTO`; not collected here).
- No localization framework — strings stay PT inline, matching the rest of the app.
- No new state-machine library — a discriminated-union reducer is sufficient.

## Decisions log

| # | Decision | Rationale |
|---|---|---|
| 1 | Refactor `/invite/accept/page.tsx` in place. | Backend invitation emails point to this URL; changing it would break live invitations. |
| 2 | Inline steps inside one card (no `Dialog` overlay). | Matches the source mockup; the response screen has nothing useful to show behind a dialog before OTP passes. |
| 3 | Collapse error states inline; turn `/invite/invite-error` into a thin redirect to `/invite/accept?token=…`. | Single source of truth; old links keep working. |
| 4 | Accept → toast + `router.push("/")`; Reject → terminal inline state with "Voltar ao início". | Accept users want immediate access; reject users benefit from a confirmation moment, no surprise redirect. |
| 5 | "Reenviar código" link on OTP step with ~60s cooldown. | Real users hit late/spam-trapped OTPs; cooldown prevents backend spam. |
| 6 | `invalid-otp` is an inline error on `otp-entry` rather than a separate screen. | One less state, simpler reducer; matches IGRP form patterns. |
| 7 | Step components extracted to `src/features/users/components/invite/`. | Matches existing `src/features/<domain>/components/` convention; keeps the orchestrator small and each step file ~60–120 lines. |

## State machine

The orchestrator drives a discriminated-union state. Initial state is `bootstrapping`; the page derives the next step from `(token, sessionStatus, invitation, jwt-email-claim)`.

```
         [bootstrapping]
                │
   ┌────────────┼─────────────┐
   │            │             │
no token    invitation     invitation OK
or fetch    error
fails           │
   │            ▼
   ▼      [invalid-invitation]      ← terminal
[invalid-                              "Convite inválido"
 invitation]
                │ (invitation OK)
                ▼
        check JWT email claim
                │
   ┌────────────┼────────────────────┐
   │            │                    │
 missing     matches               mismatches
   │            │                    │
   ▼            │                    ▼
[email-entry]   │              [email-mismatch]      ← terminal
   │            │                "Convite não corresponde
   │ submit     │                 a esta conta"
   ▼            │
validateInvitationEmail
   │
   │ ok                        bad email / bad token
   ▼                                  │
[otp-entry]──── resend (60s cooldown) │
   │                                  │
   │ submit                           │
   ▼                                  │
validateInvitationOtp                 │
   │                                  │
   │ ok                  invalid OTP  │
   │                          │       │
   │                          ▼       │
   │                   [otp-entry     │
   │                    + error msg]  │
   │                          │       │
   │ ◄────────────────────────┘       │
   ▼                                  │
[response] ◄──────────────────────────┘
   │
   ├─ accept → respondUserInvitation({accept:true}) → toast + router.push("/")
   └─ reject → respondUserInvitation({accept:false}) → [rejected]   ← terminal
                                                          "Voltar ao início" → router.push("/")
```

### State shape

```ts
type Step =
  | { kind: "bootstrapping" }
  | { kind: "invalid-invitation" }
  | { kind: "email-mismatch" }
  | { kind: "email-entry"; error?: string }
  | { kind: "otp-entry"; email: string; otpError?: string; lastSentAt: number }
  | { kind: "response" }
  | { kind: "rejected" };
```

### Transition rules

- `invalid-invitation` and `email-mismatch` are terminal — only escape is "Voltar ao início".
- `email-entry` → `otp-entry` only on `validateInvitationEmail` success.
- `otp-entry` stays on itself with an inline `otpError` on `validateInvitationOtp` failure (no separate `invalid-otp` state).
- `otp-entry` → `email-entry` via "Alterar email" link (clears OTP token + cooldown).
- "Reenviar código" on `otp-entry` re-calls `validateInvitationEmail` and refreshes `lastSentAt`. Cooldown is derived (`Date.now() < lastSentAt + 60_000`).
- Reducer rejects illegal transitions as no-ops (e.g., `email-validated` from `response`) — keeps the page deterministic.

### Reducer actions

```ts
type Action =
  | { type: "bootstrap-ok-no-claim" }
  | { type: "bootstrap-ok-matches" }
  | { type: "bootstrap-ok-mismatch" }
  | { type: "bootstrap-fail" }
  | { type: "email-validated"; email: string }
  | { type: "email-error"; message: string }
  | { type: "otp-validated" }
  | { type: "otp-error"; message: string }
  | { type: "resend-sent" }
  | { type: "change-email" }
  | { type: "rejected" };
```

## Data flow

### New server actions (`src/actions/user.ts`)

```ts
export async function validateInvitationEmail(
  request: ValidateInvitationEmailRequest,   // { token, email }
): Promise<ActionResult<OtpResponseDTO>>;

export async function validateInvitationOtp(
  request: ValidateInvitationOtpRequest,     // { token, otpCode }
): Promise<ActionResult<OtpResponseDTO>>;
```

Both follow the existing pattern: `getClientAccess()` → `client.users.validate…` → `try/catch` → `extractApiError` → `ActionResult`.

### New react-query hooks (`src/features/users/use-users.ts`)

```ts
export const useValidateInvitationEmail = () =>
  useMutation({ mutationFn: validateInvitationEmail, retry: false });

export const useValidateInvitationOtp = () =>
  useMutation({ mutationFn: validateInvitationOtp, retry: false });
```

Both as mutations (not queries) — they are side-effectful (sends email, marks OTP-validated).

### Existing pieces reused (one tweak)

- `useGetUserInvitationByToken(token)` — runs on mount, drives `bootstrapping` → branches.
  - **Tweak:** the current implementation uses `queryKey: ["user-invitation-by-token"]` without the token, so visiting two different invitation links in one session would show stale data. Change to `queryKey: ["user-invitation-by-token", token]`. Tiny scope-of-the-work fix; isolated to the hook.
- `useRespondUserInvitation()` — used on Accept/Reject in the `response` step.
- `useSession()` — drives the JWT-email-claim branch.
- `<AppCenterLoading />` — for the `bootstrapping` state.

### Per-step data flow

| Step | What it reads | What it does on submit |
|---|---|---|
| bootstrapping | `useSession()`, `useGetUserInvitationByToken(token)` | derives next step |
| email-entry | — | `validateInvitationEmail.mutate({ token, email })` → on success, transition to `otp-entry` with `email` |
| otp-entry | — | `validateInvitationOtp.mutate({ token, otpCode })` → on success, transition to `response`. On failure, set `otpError` |
| otp-entry (resend) | — | re-calls `validateInvitationEmail` with stored email; refresh `lastSentAt` |
| response | uses already-loaded `invitation` from the query cache | `respondUserInvitation.mutate({ response: {email, accept}, token })` |

### Open implementation note

`validateInvitationOtp` returns `OtpResponseDTO { token, message }` — a *new* token. The current `respondUserInvitation` takes the original invitation token from the URL. The design assumes the backend correlates server-side (the original token gets marked OTP-validated) and we don't thread the new token through. **Verify against the backend during implementation**; if the new token replaces the URL token, the `response` step uses the OTP-returned token instead — a one-line change isolated to the orchestrator.

## Component structure

### File layout

```
src/app/(igrp)/invite/
├── accept/page.tsx          ← orchestrator (rewritten)
└── invite-error/page.tsx    ← thin redirect to /invite/accept?token=…

src/features/users/components/invite/
├── invite-flow-state.ts        ← Step union + reducer + transition helpers
├── invite-card-shell.tsx       ← centered card layout + decorative gradient bg
├── invite-email-step.tsx
├── invite-otp-step.tsx         ← uses InputOTP + resend cooldown
├── invite-response-step.tsx    ← email + departments + roles + Accept/Reject
├── invite-rejected-step.tsx    ← terminal "Voltar ao início"
└── invite-error-state.tsx      ← shared layout for invalid-invitation & email-mismatch
                                  (variants via prop: kind="invalid" | "mismatch")
```

### Schemas (Zod, `src/features/users/user-schema.ts`)

```ts
export const InviteEmailFormSchema = z.object({ email: EmailSchema });
export const InviteOtpFormSchema = z.object({
  otpCode: z.string().regex(/^\d{6}$/, "Código deve ter 6 dígitos"),
});
```

### Component contracts (all client components)

| Component | Props | Emits |
|---|---|---|
| `InviteCardShell` | `children` | — (purely presentational wrapper) |
| `InviteEmailStep` | `defaultEmail?`, `error?`, `isSubmitting`, `onSubmit(email)` | `onSubmit` |
| `InviteOtpStep` | `email`, `otpError?`, `isSubmitting`, `cooldownUntil`, `onSubmit(otpCode)`, `onResend()`, `onChangeEmail()` | three callbacks |
| `InviteResponseStep` | `invitation`, `isSubmitting`, `onAccept()`, `onReject()` | `onAccept`, `onReject` |
| `InviteRejectedStep` | `onBackHome()` | `onBackHome` |
| `InviteErrorState` | `kind: "invalid" \| "mismatch"`, `onBackHome()` | `onBackHome` |

### Orchestrator (`accept/page.tsx`) responsibilities — and only these

1. Read `?token=` from URL; if missing, render `InviteErrorState kind="invalid"`.
2. Resolve session via `useSession({ required: true })` — middleware/NextAuth handles unauthenticated redirect to login. We don't reimplement it here.
3. Run `useGetUserInvitationByToken(token)`.
4. Run the reducer:
   - `bootstrapping` until session + invitation both ready.
   - On invitation error → `invalid-invitation`.
   - On invitation OK: branch on `session.user?.email` — present + matches → `response`; present + mismatches → `email-mismatch`; missing → `email-entry`.
5. Wire mutations (`useValidateInvitationEmail`, `useValidateInvitationOtp`, `useRespondUserInvitation`) and dispatch transitions on their success/error.
6. Render `<InviteCardShell>` + the appropriate step component.

### Why split this way

- The orchestrator is the only place that knows about the network and the URL.
- The step components are pure UI + callbacks (easy to render in isolation, no react-query in their internals).
- The reducer is the only place that knows about transitions.

## Error handling

### Error sources and treatments

| Source | Where it surfaces | Treatment |
|---|---|---|
| `?token=` missing | orchestrator on mount | Render `InviteErrorState kind="invalid"` immediately. No toast. |
| `useGetUserInvitationByToken` fails (404 / 410 / network) | orchestrator effect | Transition to `invalid-invitation`. Show "Convite inválido ou expirado" inline. **Drop the existing toast + auto-redirect** — terminal inline state is clearer. |
| JWT email claim mismatches `invitation.email` | orchestrator branch on bootstrap | Transition to `email-mismatch` → `InviteErrorState kind="mismatch"`. |
| `validateInvitationEmail` fails (wrong email, rate-limit, etc.) | mutation `onError` while in `email-entry` | Stay on `email-entry`, set `error` from `extractApiError`-mapped message; show under the email field via `FormMessage`. |
| `validateInvitationOtp` fails (wrong code, expired) | mutation `onError` while in `otp-entry` | Stay on `otp-entry`, set `otpError`, show below the InputOTP slots. Clear OTP input on error. |
| Resend fails | mutation `onError` from resend path | Toast `"Não foi possível reenviar o código"`. Don't change step. |
| `respondUserInvitation` fails | mutation `onError` while in `response` | Toast (existing pattern preserved). Don't change step — user can retry. |
| Session expired mid-flow | next-auth/middleware | Already handled by `withIGRPAuth` `onSessionExpired → redirect("/logout")`. We do nothing extra. |

### Loading states

- `bootstrapping` → render `<AppCenterLoading description="Validando convite..." />` (existing component, reused).
- Mutation in flight → step button shows "A processar..." and is disabled; the rest of the form is disabled.

### Race conditions

- Token query and session resolve asynchronously. Reducer waits for both (`status === "authenticated"` **and** `!isLoadingInvitation`) before deriving the next step. No transitions until both are ready.
- Double-submit on Accept/Reject: button disabled while `respondMutation.isPending` (existing pattern preserved).
- Resend cooldown: disable resend until `Date.now() >= lastSentAt + 60_000`. Cooldown is a derived value (not stored) — a 1s `setInterval` re-renders the step to update the countdown text; cleared on unmount.

### `extractApiError`

Existing util in `src/lib/utils.ts` — used in every server action; reused for the two new ones, no new error-mapping code needed.

### `/invite/invite-error` route

Becomes a small client redirect — preserves the `?token=` query and `router.replace("/invite/accept?token=…")`. Old links keep working; new logic flows through one place.

## Visual & styling adaptation

The source `Invite.tsx` uses hard-coded dark colors. We re-skin onto IGRP tokens so light/dark themes both work.

### Mapping source → IGRP

| Source | IGRP equivalent |
|---|---|
| `bg-[#0a0c10]` outer page | `min-h-screen flex items-center justify-center p-4` (no bg — inherits from `(igrp)` layout) |
| `bg-[#11141d] border-gray-800/50 rounded-[32px]` card | `<Card>` (default tokens), `rounded-3xl` |
| Decorative blue/purple blur blobs | Keep as `<div>` with token colors: `bg-primary/10 blur-[80px]` and `bg-accent/10 blur-[80px]` (positioned absolute, `pointer-events-none`, behind `z-10` content) |
| `bg-blue-500/10 text-blue-400` step icon halo | `bg-primary/10 text-primary` |
| `bg-yellow-500/10 text-yellow-400` OTP icon | `bg-warning/10 text-warning` if the token exists, else `bg-amber-500/10 text-amber-600` (verify token availability during impl) |
| `bg-red-500/10 text-red-500` error halo | `bg-destructive/10 text-destructive` |
| `text-gray-400` body | `text-muted-foreground` |
| `text-white` heading | inherit (no color) — uses default foreground |
| `bg-blue-600` primary CTA | `<IGRPButton>` (default variant) |
| `bg-[#ff3b30]` reject button | `<IGRPButton variant="destructive">` |
| `bg-[#34c759]` accept button | `<IGRPButton>` (default) — destructive/default contrast is enough; we don't introduce a non-token green |
| Custom OTP `<input maxLength=6>` | `<InputOTP maxLength={6}>` with 6× `<InputOTPSlot>` |
| `<input type=email>` | `<Input>` with leading `IGRPIcon iconName="Mail"` |
| `inline-flex … rounded-full` role chip | `<Badge variant="outline">` |
| `animate-in fade-in slide-in-from-bottom-4 duration-500` step entrance | Keep — Tailwind utilities, theme-independent |
| Lucide icons | `<IGRPIcon iconName="…" />` |

### Components used from `@igrp/igrp-framework-react-design-system`

`Card`, `CardContent`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `IGRPButton`, `IGRPIcon`, `Input`, `Badge`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `useIGRPToast`. All existing exports — no design-system additions needed.

### Forms

Both forms use `react-hook-form` + `zodResolver` with the schemas above, mirroring `user-invite-dialog.tsx`. No raw `<input>` / `<form>`.

### Accessibility

- `aria-live="polite"` on step container so step transitions are announced.
- `aria-describedby` linking error text to inputs.
- OTP input: `inputMode="numeric"`, `autoComplete="one-time-code"`.
- Resend button countdown in `aria-label` (e.g., `"Reenviar em 47s"`) instead of raw seconds.

## Testing

The codebase has no test runner configured (per `AGENTS.md`). Verification will be manual:

1. Bring up the dev server with `pnpm dev`.
2. Generate an invitation through the existing user-invite flow.
3. Walk each branch of the state machine in the browser:
   - **No-claim path**: log in with a provider/account whose JWT lacks `email`; verify email-entry → OTP → response → accept/reject.
   - **Match path**: log in with the invited email; verify response screen shown directly.
   - **Mismatch path**: log in with a different email; verify `email-mismatch` terminal screen.
   - **Invalid token**: visit `/invite/accept?token=bogus`; verify `invalid-invitation` terminal screen.
   - **Bad OTP**: enter wrong code; verify inline error and form remains usable.
   - **Resend cooldown**: trigger resend; verify 60s disable + countdown.
   - **Old `/invite/invite-error?token=…` link**: verify it redirects through to the new flow.
4. Theme: toggle between light and dark; verify decorative blobs and step icons read correctly under both.
5. Run `pnpm lint` (the project's gate) before committing the implementation.

## Out of scope

- Custom theme tokens / forced dark mode.
- Design-system component changes.
- Localization framework swap.
- Rejection-reason capture.
- Per-provider JWT claim normalization (handled by `withIGRPAuth`).
