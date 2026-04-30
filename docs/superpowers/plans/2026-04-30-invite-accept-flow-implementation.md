# Invitation Accept Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `/invite/accept` into a multi-step state machine that branches on the JWT email claim, drives an OTP verification flow when the claim is missing, and renders the invitation response, terminal-error, and rejected states inline — using the IGRP design system.

**Architecture:** A page-level orchestrator (client component at `src/app/(igrp)/invite/accept/page.tsx`) owns network/URL/transition logic via `useReducer` over a discriminated-union `Step`. Each visible step is an extracted presentational component in `src/features/users/components/invite/` — the orchestrator is the only place that knows about react-query, mutations, and the route. Two new server actions wrap the SDK's already-exposed `validateInvitationEmail` / `validateInvitationOtp` endpoints; existing `useGetUserInvitationByToken` and `useRespondUserInvitation` hooks are reused.

**Tech Stack:** Next.js 15 App Router (RSC + client components), React 19, `@igrp/igrp-framework-react-design-system` (Card, IGRPButton, Input, InputOTP, Badge, Form/FormField, IGRPIcon, useIGRPToast), `@igrp/platform-access-management-client-ts` SDK, `next-auth/react` `useSession`, `@tanstack/react-query`, `react-hook-form` + `@hookform/resolvers/zod`, Zod v4. No test runner is configured; verification is `pnpm lint` + manual smoke on `pnpm dev`.

**Spec:** `docs/superpowers/specs/2026-04-30-invite-accept-flow-design.md`

---

## File Plan

**Create:**
- `src/features/users/components/invite/invite-flow-state.ts` — discriminated-union `Step`, `Action`, reducer, transition helpers, derived `cooldownRemaining(now, step)` util.
- `src/features/users/components/invite/invite-card-shell.tsx` — centered card layout + decorative gradient blobs.
- `src/features/users/components/invite/invite-error-state.tsx` — terminal error layout (`kind: "invalid" | "mismatch"`).
- `src/features/users/components/invite/invite-email-step.tsx` — email entry form.
- `src/features/users/components/invite/invite-otp-step.tsx` — OTP entry form + resend cooldown + change-email link.
- `src/features/users/components/invite/invite-response-step.tsx` — invitation response (email/depts/roles + Accept/Reject).
- `src/features/users/components/invite/invite-rejected-step.tsx` — terminal "Convite Rejeitado" state.

**Modify:**
- `src/actions/user.ts` — append two server actions (`validateInvitationEmail`, `validateInvitationOtp`).
- `src/features/users/use-users.ts` — append two mutation hooks (`useValidateInvitationEmail`, `useValidateInvitationOtp`); fix `useGetUserInvitationByToken` queryKey to include `token`.
- `src/features/users/user-schema.ts` — export `EmailSchema`; add `InviteEmailFormSchema`, `InviteOtpFormSchema`.
- `src/app/(igrp)/invite/accept/page.tsx` — full rewrite as the orchestrator.
- `src/app/(igrp)/invite/invite-error/page.tsx` — collapse into a thin redirect to `/invite/accept?token=…`.

---

## Task 1: Backend wiring (server actions + hooks + queryKey fix)

Adds the two new server actions, their react-query mutations, and fixes a stale-data bug in the existing invitation-by-token query.

**Files:**
- Modify: `src/actions/user.ts` (append at end before final newline)
- Modify: `src/features/users/use-users.ts` (modify imports, modify `useGetUserInvitationByToken`, append two new hooks)

- [ ] **Step 1.1: Add `validateInvitationEmail` server action**

In `src/actions/user.ts`, append after `setCurrentUserActiveRole` (last function in the file):

```ts
export async function validateInvitationEmail(
  request: Parameters<AccessClient["users"]["validateInvitationEmail"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationEmail"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.validateInvitationEmail(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[invitation] Erro ao validar email de convite:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 1.2: Add `validateInvitationOtp` server action**

In `src/actions/user.ts`, append immediately after `validateInvitationEmail`:

```ts
export async function validateInvitationOtp(
  request: Parameters<AccessClient["users"]["validateInvitationOtp"]>[0],
): Promise<
  ActionResult<SdkData<AccessClient["users"]["validateInvitationOtp"]>>
> {
  const client = await getClientAccess();

  try {
    const result = await client.users.validateInvitationOtp(request);
    return { success: true, data: result.data };
  } catch (error) {
    console.error(
      "[invitation] Erro ao validar código OTP de convite:",
      error,
    );
    return { success: false, error: extractApiError(error) };
  }
}
```

- [ ] **Step 1.3: Update imports in `use-users.ts`**

In `src/features/users/use-users.ts`, change the import block at the top of the file. Find:

```ts
import {
  addCurrentUserFavoriteApplication,
  addRolesToUser,
  cancelUserInvitation,
  getCurrentUser,
  getCurrentUserActiveRole,
  //getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
  getUser,
  getUserApplications,
  getUserDepartments,
  getUserInvitationByToken,
  getUserInvitations,
  getUserRoles,
  getUsers,
  inviteUser,
  registerCurrentUserApplicationAccess,
  removeCurrentUserFavoriteApplication,
  removeRolesFromUser,
  resendUserInvitation,
  respondUserInvitation,
  setCurrentUserActiveRole,
  //setCurrentUserActiveRole,
  updateUser,
  updateUserStatus,
} from "@/actions/user";
```

Replace with (insert `validateInvitationEmail` and `validateInvitationOtp` in alphabetical position):

```ts
import {
  addCurrentUserFavoriteApplication,
  addRolesToUser,
  cancelUserInvitation,
  getCurrentUser,
  getCurrentUserActiveRole,
  //getCurrentUserActiveRole,
  getCurrentUserApplications,
  getCurrentUserDepartments,
  getCurrentUserFavoriteApplications,
  getCurrentUserRecentApplications,
  getCurrentUserRoles,
  getUser,
  getUserApplications,
  getUserDepartments,
  getUserInvitationByToken,
  getUserInvitations,
  getUserRoles,
  getUsers,
  inviteUser,
  registerCurrentUserApplicationAccess,
  removeCurrentUserFavoriteApplication,
  removeRolesFromUser,
  resendUserInvitation,
  respondUserInvitation,
  setCurrentUserActiveRole,
  //setCurrentUserActiveRole,
  updateUser,
  updateUserStatus,
  validateInvitationEmail,
  validateInvitationOtp,
} from "@/actions/user";
```

- [ ] **Step 1.4: Fix `useGetUserInvitationByToken` queryKey**

In `src/features/users/use-users.ts`, find:

```ts
export function useGetUserInvitationByToken(token: string) {
  return useQuery({
    queryKey: ["user-invitation-by-token"],
    queryFn: async () => {
      const result = await getUserInvitationByToken(token);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    retry: false,
  });
}
```

Replace with:

```ts
export function useGetUserInvitationByToken(token: string) {
  return useQuery({
    queryKey: ["user-invitation-by-token", token],
    queryFn: async () => {
      const result = await getUserInvitationByToken(token);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: !!token,
    retry: false,
  });
}
```

(Adds the token to the cache key so different invitations don't share cache; `enabled: !!token` prevents the query from firing on an empty token while the orchestrator is still resolving the URL.)

- [ ] **Step 1.5: Add `useValidateInvitationEmail` hook**

In `src/features/users/use-users.ts`, append at the end of the file (after `useSetCurrentUserActiveRole`):

```ts
export function useValidateInvitationEmail() {
  return useMutation({
    mutationFn: async (
      request: Parameters<typeof validateInvitationEmail>[0],
    ) => validateInvitationEmail(request),
    retry: false,
  });
}
```

- [ ] **Step 1.6: Add `useValidateInvitationOtp` hook**

Append immediately after `useValidateInvitationEmail`:

```ts
export function useValidateInvitationOtp() {
  return useMutation({
    mutationFn: async (
      request: Parameters<typeof validateInvitationOtp>[0],
    ) => validateInvitationOtp(request),
    retry: false,
  });
}
```

- [ ] **Step 1.7: Lint**

Run: `pnpm lint`
Expected: zero errors. If Biome reports unused imports or formatting drift, accept the autofix output (Biome runs `--write`).

- [ ] **Step 1.8: Type-check via build**

Run: `pnpm exec tsc --noEmit`
Expected: zero errors. (No `tsc` script is defined; running it directly catches type drift before we touch UI.)

- [ ] **Step 1.9: Commit**

```bash
git add src/actions/user.ts src/features/users/use-users.ts
git commit -m "feat(invite): add OTP validation actions and hooks; key invitation query by token"
```

---

## Task 2: Schemas + state machine module

Adds the form schemas and the discriminated-union state + reducer the orchestrator will use.

**Files:**
- Modify: `src/features/users/user-schema.ts`
- Create: `src/features/users/components/invite/invite-flow-state.ts`

- [ ] **Step 2.1: Export `EmailSchema` and add invite form schemas**

In `src/features/users/user-schema.ts`, find:

```ts
const EmailSchema = z.email({ message: "Email inválido" }).max(254);
```

Replace with:

```ts
export const EmailSchema = z.email({ message: "Email inválido" }).max(254);
```

Then, append at the end of the file:

```ts
export const InviteEmailFormSchema = z.object({
  email: EmailSchema,
});
export type InviteEmailFormArgs = z.infer<typeof InviteEmailFormSchema>;

export const InviteOtpFormSchema = z.object({
  otpCode: z
    .string()
    .regex(/^\d{6}$/, { message: "Código deve ter 6 dígitos" }),
});
export type InviteOtpFormArgs = z.infer<typeof InviteOtpFormSchema>;
```

- [ ] **Step 2.2: Create the state machine module**

Create `src/features/users/components/invite/invite-flow-state.ts` with full content:

```ts
export type Step =
  | { kind: "bootstrapping" }
  | { kind: "invalid-invitation" }
  | { kind: "email-mismatch" }
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

export const RESEND_COOLDOWN_MS = 60_000;

export const initialStep: Step = { kind: "bootstrapping" };

export function inviteFlowReducer(state: Step, action: Action): Step {
  switch (action.type) {
    case "bootstrap-ok-no-claim":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-entry" };

    case "bootstrap-ok-matches":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "response" };

    case "bootstrap-ok-mismatch":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "email-mismatch" };

    case "bootstrap-fail":
      if (state.kind !== "bootstrapping") return state;
      return { kind: "invalid-invitation" };

    case "email-validated":
      if (state.kind !== "email-entry") return state;
      return {
        kind: "otp-entry",
        email: action.email,
        lastSentAt: Date.now(),
      };

    case "email-error":
      if (state.kind !== "email-entry") return state;
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

- [ ] **Step 2.3: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 2.4: Commit**

```bash
git add src/features/users/user-schema.ts src/features/users/components/invite/invite-flow-state.ts
git commit -m "feat(invite): add flow state machine and form schemas"
```

---

## Task 3: Card shell + terminal error state

Two presentational shells: the centered card with decorative gradient backdrop, and the terminal-error state used by both `invalid-invitation` and `email-mismatch`.

**Files:**
- Create: `src/features/users/components/invite/invite-card-shell.tsx`
- Create: `src/features/users/components/invite/invite-error-state.tsx`

- [ ] **Step 3.1: Create `InviteCardShell`**

Create `src/features/users/components/invite/invite-card-shell.tsx`:

```tsx
"use client";

import { Card } from "@igrp/igrp-framework-react-design-system";
import type { ReactNode } from "react";

export function InviteCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="relative w-full max-w-[480px] overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-[80px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/10 blur-[80px]"
        />
        <div
          className="relative z-10"
          aria-live="polite"
        >
          {children}
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 3.2: Create `InviteErrorState`**

Create `src/features/users/components/invite/invite-error-state.tsx`:

```tsx
"use client";

import {
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

interface InviteErrorStateProps {
  kind: "invalid" | "mismatch";
  onBackHome: () => void;
}

const COPY = {
  invalid: {
    title: "Convite inválido",
    description:
      "Não foi possível encontrar este convite. O link pode estar incorreto ou ter expirado.",
  },
  mismatch: {
    title: "Convite não corresponde",
    description: "Este convite não foi enviado para sua conta.",
  },
} as const;

export function InviteErrorState({ kind, onBackHome }: InviteErrorStateProps) {
  const { title, description } = COPY[kind];

  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IGRPIcon iconName="AlertTriangle" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground px-4">{description}</p>
      </div>
      <IGRPButton
        variant="outline"
        onClick={onBackHome}
        showIcon
        iconName="ArrowLeft"
        iconPlacement="start"
      >
        Voltar ao início
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 3.3: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 3.4: Commit**

```bash
git add src/features/users/components/invite/invite-card-shell.tsx src/features/users/components/invite/invite-error-state.tsx
git commit -m "feat(invite): add card shell and terminal error state components"
```

---

## Task 4: Email step component

Email entry form with `react-hook-form` + `zodResolver`, leading mail icon, submit button.

**Files:**
- Create: `src/features/users/components/invite/invite-email-step.tsx`

- [ ] **Step 4.1: Create `InviteEmailStep`**

Create `src/features/users/components/invite/invite-email-step.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";
import {
  type InviteEmailFormArgs,
  InviteEmailFormSchema,
} from "../../user-schema";

interface InviteEmailStepProps {
  defaultEmail?: string;
  error?: string;
  isSubmitting: boolean;
  onSubmit: (email: string) => void;
}

export function InviteEmailStep({
  defaultEmail,
  error,
  isSubmitting,
  onSubmit,
}: InviteEmailStepProps) {
  const form = useForm<InviteEmailFormArgs>({
    resolver: zodResolver(InviteEmailFormSchema),
    mode: "onChange",
    defaultValues: { email: defaultEmail ?? "" },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.email.trim());
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <IGRPIcon iconName="Mail" className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Bem-vindo</h2>
        <p className="text-sm text-muted-foreground">
          Introduza o seu email para aceder ao convite
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <IGRPIcon
                      iconName="Mail"
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      type="email"
                      autoComplete="email"
                      placeholder="exemplo@email.com"
                      className="h-12 rounded-xl pl-12"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
                {error && !form.formState.errors.email ? (
                  <p
                    role="alert"
                    className="text-sm font-medium text-destructive"
                  >
                    {error}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          <IGRPButton
            type="submit"
            className="h-12 w-full rounded-xl"
            disabled={isSubmitting || !form.formState.isValid}
            showIcon
            iconName="ArrowRight"
            iconPlacement="end"
          >
            {isSubmitting ? "A enviar..." : "Enviar Código"}
          </IGRPButton>
        </form>
      </Form>
    </div>
  );
}
```

- [ ] **Step 4.2: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 4.3: Commit**

```bash
git add src/features/users/components/invite/invite-email-step.tsx
git commit -m "feat(invite): add email entry step component"
```

---

## Task 5: OTP step component

OTP entry using IGRP's `InputOTP`, with resend cooldown timer (1s `setInterval` for re-render), error display, "Alterar email" link.

**Files:**
- Create: `src/features/users/components/invite/invite-otp-step.tsx`

- [ ] **Step 5.1: Create `InviteOtpStep`**

Create `src/features/users/components/invite/invite-otp-step.tsx`:

```tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPButton,
  IGRPIcon,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@igrp/igrp-framework-react-design-system";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  type InviteOtpFormArgs,
  InviteOtpFormSchema,
} from "../../user-schema";

interface InviteOtpStepProps {
  email: string;
  otpError?: string;
  isSubmitting: boolean;
  isResending: boolean;
  cooldownUntil: number;
  onSubmit: (otpCode: string) => void;
  onResend: () => void;
  onChangeEmail: () => void;
}

function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function InviteOtpStep({
  email,
  otpError,
  isSubmitting,
  isResending,
  cooldownUntil,
  onSubmit,
  onResend,
  onChangeEmail,
}: InviteOtpStepProps) {
  const form = useForm<InviteOtpFormArgs>({
    resolver: zodResolver(InviteOtpFormSchema),
    mode: "onChange",
    defaultValues: { otpCode: "" },
  });

  // Clear the input whenever a new error arrives so the user can re-enter.
  useEffect(() => {
    if (otpError) {
      form.setValue("otpCode", "", { shouldValidate: false });
    }
  }, [otpError, form]);

  const now = useNow(1000);
  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));
  const inCooldown = remainingSeconds > 0;
  const resendLabel = inCooldown
    ? `Reenviar em ${remainingSeconds}s`
    : "Reenviar código";

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.otpCode);
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <IGRPIcon iconName="Shield" className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Verificação OTP</h2>
        <p className="text-sm text-muted-foreground">
          Enviamos um código de 6 dígitos para{" "}
          <span className="font-medium text-primary">{email}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormField
            control={form.control}
            name="otpCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="sr-only">Código OTP</FormLabel>
                <FormControl>
                  <InputOTP
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    containerClassName="justify-center"
                    disabled={isSubmitting}
                    value={field.value}
                    onChange={field.onChange}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </FormControl>
                <FormMessage className="text-center" />
                {otpError && !form.formState.errors.otpCode ? (
                  <p
                    role="alert"
                    className="text-center text-sm font-medium text-destructive"
                  >
                    {otpError}
                  </p>
                ) : null}
              </FormItem>
            )}
          />

          <IGRPButton
            type="submit"
            className="h-12 w-full rounded-xl"
            disabled={isSubmitting || !form.formState.isValid}
          >
            {isSubmitting ? "A verificar..." : "Verificar Código"}
          </IGRPButton>

          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={onResend}
              disabled={inCooldown || isResending}
              aria-label={resendLabel}
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
            >
              {isResending ? "A reenviar..." : resendLabel}
            </button>
            <button
              type="button"
              onClick={onChangeEmail}
              disabled={isSubmitting}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
            >
              Alterar email
            </button>
          </div>
        </form>
      </Form>
    </div>
  );
}
```

- [ ] **Step 5.2: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 5.3: Commit**

```bash
git add src/features/users/components/invite/invite-otp-step.tsx
git commit -m "feat(invite): add OTP entry step component with resend cooldown"
```

---

## Task 6: Response and Rejected step components

Response step shows email/departments/roles + Accept/Reject. Rejected step is the terminal "Convite Rejeitado" screen.

**Files:**
- Create: `src/features/users/components/invite/invite-response-step.tsx`
- Create: `src/features/users/components/invite/invite-rejected-step.tsx`

- [ ] **Step 6.1: Create `InviteResponseStep`**

Create `src/features/users/components/invite/invite-response-step.tsx`:

```tsx
"use client";

import {
  Badge,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

// The SDK's `getUserInvitationByToken` returns `InvitationDTO`, but its
// runtime shape (department-as-array, embedded roles) doesn't match the
// declared types. We type-narrow to what the response step needs without
// importing the misaligned DTO.
interface CodeDescriptionLike {
  code?: string;
  description?: string;
}

export interface InvitationLike {
  email: string;
  department?: CodeDescriptionLike[] | CodeDescriptionLike | null;
  roles?: CodeDescriptionLike[] | null;
}

interface InviteResponseStepProps {
  invitation: InvitationLike;
  isSubmitting: boolean;
  onAccept: () => void;
  onReject: () => void;
}

function toArray(
  value: CodeDescriptionLike[] | CodeDescriptionLike | null | undefined,
): CodeDescriptionLike[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function InviteResponseStep({
  invitation,
  isSubmitting,
  onAccept,
  onReject,
}: InviteResponseStepProps) {
  const departments = toArray(invitation.department);
  const roles = invitation.roles ?? [];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="space-y-4 text-center">
        <div className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground shadow-xl">
          <IGRPIcon iconName="Mail" className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold">Aceitar convite</h2>
      </div>

      <div className="space-y-6 rounded-2xl border bg-muted/40 p-6">
        <div className="flex items-start gap-4">
          <IGRPIcon
            iconName="Mail"
            className="mt-0.5 h-5 w-5 text-muted-foreground"
          />
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Email
            </p>
            <p className="font-medium">{invitation.email}</p>
          </div>
        </div>

        {departments.length > 0 ? (
          <>
            <div className="h-px w-full bg-border" />
            <div className="flex items-start gap-4">
              <IGRPIcon
                iconName="Building"
                className="mt-0.5 h-5 w-5 text-muted-foreground"
              />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Departamento
                </p>
                <div className="flex flex-wrap gap-2">
                  {departments.map((dept) => (
                    <Badge
                      key={dept.code ?? dept.description}
                      variant="outline"
                    >
                      {dept.description || dept.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}

        {roles.length > 0 ? (
          <>
            <div className="h-px w-full bg-border" />
            <div className="flex items-start gap-4">
              <IGRPIcon
                iconName="Shield"
                className="mt-0.5 h-5 w-5 text-muted-foreground"
              />
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Perfis
                </p>
                <div className="flex flex-wrap gap-2">
                  {roles.map((role) => (
                    <Badge
                      key={role.code ?? role.description}
                      variant="outline"
                    >
                      {role.description || role.code}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <IGRPButton
          variant="destructive"
          onClick={onReject}
          disabled={isSubmitting}
          showIcon
          iconName="X"
          iconPlacement="start"
          className="h-14 rounded-xl"
        >
          Rejeitar
        </IGRPButton>
        <IGRPButton
          onClick={onAccept}
          disabled={isSubmitting}
          showIcon
          iconName="Check"
          iconPlacement="start"
          className="h-14 rounded-xl"
        >
          {isSubmitting ? "A processar..." : "Aceitar"}
        </IGRPButton>
      </div>
    </div>
  );
}
```

- [ ] **Step 6.2: Create `InviteRejectedStep`**

Create `src/features/users/components/invite/invite-rejected-step.tsx`:

```tsx
"use client";

import {
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

interface InviteRejectedStepProps {
  onBackHome: () => void;
}

export function InviteRejectedStep({ onBackHome }: InviteRejectedStepProps) {
  return (
    <div className="space-y-6 text-center animate-in zoom-in duration-300">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <IGRPIcon iconName="X" className="h-10 w-10" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Convite Rejeitado</h2>
        <p className="text-sm text-muted-foreground">
          Você optou por não aceitar o acesso a este módulo.
        </p>
      </div>
      <IGRPButton
        variant="outline"
        onClick={onBackHome}
        showIcon
        iconName="ArrowLeft"
        iconPlacement="start"
      >
        Voltar ao início
      </IGRPButton>
    </div>
  );
}
```

- [ ] **Step 6.3: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 6.4: Commit**

```bash
git add src/features/users/components/invite/invite-response-step.tsx src/features/users/components/invite/invite-rejected-step.tsx
git commit -m "feat(invite): add response and rejected step components"
```

---

## Task 7: Orchestrator rewrite + invite-error redirect

Replace `accept/page.tsx` with the orchestrator using everything built above. Collapse `invite-error/page.tsx` into a thin redirect.

**Files:**
- Modify: `src/app/(igrp)/invite/accept/page.tsx` (full rewrite)
- Modify: `src/app/(igrp)/invite/invite-error/page.tsx` (full rewrite)

- [ ] **Step 7.1: Rewrite `accept/page.tsx`**

Replace the entire contents of `src/app/(igrp)/invite/accept/page.tsx` with:

```tsx
"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useReducer } from "react";
import { AppCenterLoading } from "@/components/loading";
import { InviteCardShell } from "@/features/users/components/invite/invite-card-shell";
import { InviteEmailStep } from "@/features/users/components/invite/invite-email-step";
import { InviteErrorState } from "@/features/users/components/invite/invite-error-state";
import {
  initialStep,
  inviteFlowReducer,
  RESEND_COOLDOWN_MS,
} from "@/features/users/components/invite/invite-flow-state";
import { InviteOtpStep } from "@/features/users/components/invite/invite-otp-step";
import { InviteRejectedStep } from "@/features/users/components/invite/invite-rejected-step";
import {
  type InvitationLike,
  InviteResponseStep,
} from "@/features/users/components/invite/invite-response-step";
import {
  useGetUserInvitationByToken,
  useRespondUserInvitation,
  useValidateInvitationEmail,
  useValidateInvitationOtp,
} from "@/features/users/use-users";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const token = searchParams.get("token");

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useGetUserInvitationByToken(token ?? "");

  const [step, dispatch] = useReducer(inviteFlowReducer, initialStep);

  const validateEmail = useValidateInvitationEmail();
  const validateOtp = useValidateInvitationOtp();
  const respond = useRespondUserInvitation();

  // Bootstrap branch — runs once both session and invitation are ready.
  useEffect(() => {
    if (step.kind !== "bootstrapping") return;

    if (!token) {
      dispatch({ type: "bootstrap-fail" });
      return;
    }

    if (sessionStatus !== "authenticated") return;
    if (isLoadingInvitation) return;

    if (invitationError || !invitation) {
      dispatch({ type: "bootstrap-fail" });
      return;
    }

    const claimEmail = session?.user?.email;
    if (!claimEmail) {
      dispatch({ type: "bootstrap-ok-no-claim" });
    } else if (claimEmail === invitation.email) {
      dispatch({ type: "bootstrap-ok-matches" });
    } else {
      dispatch({ type: "bootstrap-ok-mismatch" });
    }
  }, [
    step.kind,
    token,
    sessionStatus,
    isLoadingInvitation,
    invitationError,
    invitation,
    session?.user?.email,
  ]);

  const goHome = () => router.push("/");

  const handleEmailSubmit = (email: string) => {
    if (!token) return;
    validateEmail.mutate(
      { token, email },
      {
        onSuccess: (result) => {
          if (!result.success) {
            dispatch({ type: "email-error", message: result.error });
            return;
          }
          dispatch({ type: "email-validated", email });
        },
        onError: (err) => {
          dispatch({
            type: "email-error",
            message: (err as Error).message,
          });
        },
      },
    );
  };

  const handleOtpSubmit = (otpCode: string) => {
    if (!token) return;
    validateOtp.mutate(
      { token, otpCode },
      {
        onSuccess: (result) => {
          if (!result.success) {
            dispatch({ type: "otp-error", message: result.error });
            return;
          }
          dispatch({ type: "otp-validated" });
        },
        onError: (err) => {
          dispatch({ type: "otp-error", message: (err as Error).message });
        },
      },
    );
  };

  const handleResend = () => {
    if (step.kind !== "otp-entry" || !token) return;
    validateEmail.mutate(
      { token, email: step.email },
      {
        onSuccess: (result) => {
          if (!result.success) {
            igrpToast({
              type: "error",
              title: "Não foi possível reenviar o código",
              description: result.error,
              duration: 4000,
            });
            return;
          }
          dispatch({ type: "resend-sent" });
          igrpToast({
            type: "success",
            description: "Novo código enviado",
            duration: 3000,
          });
        },
        onError: (err) => {
          igrpToast({
            type: "error",
            title: "Não foi possível reenviar o código",
            description: (err as Error).message,
            duration: 4000,
          });
        },
      },
    );
  };

  const handleAccept = () => {
    if (!token || !invitation) return;
    respond.mutate(
      {
        response: { email: invitation.email, accept: true },
        token,
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            igrpToast({
              type: "error",
              title: "Erro ao aceitar convite",
              description: result.error,
              duration: 4000,
            });
            return;
          }
          igrpToast({
            type: "success",
            title: "Convite aceito",
            description: "Você agora tem acesso à aplicação",
            duration: 4000,
          });
          router.push("/");
        },
        onError: (err) => {
          igrpToast({
            type: "error",
            title: "Erro ao aceitar convite",
            description: (err as Error).message,
            duration: 4000,
          });
        },
      },
    );
  };

  const handleReject = () => {
    if (!token || !invitation) return;
    respond.mutate(
      {
        response: { email: invitation.email, accept: false },
        token,
      },
      {
        onSuccess: (result) => {
          if (!result.success) {
            igrpToast({
              type: "error",
              title: "Erro ao rejeitar convite",
              description: result.error,
              duration: 4000,
            });
            return;
          }
          dispatch({ type: "rejected" });
        },
        onError: (err) => {
          igrpToast({
            type: "error",
            title: "Erro ao rejeitar convite",
            description: (err as Error).message,
            duration: 4000,
          });
        },
      },
    );
  };

  // Render
  if (step.kind === "bootstrapping") {
    return <AppCenterLoading descrption="Validando convite..." />;
  }

  return (
    <InviteCardShell>
      {step.kind === "invalid-invitation" ? (
        <InviteErrorState kind="invalid" onBackHome={goHome} />
      ) : null}

      {step.kind === "email-mismatch" ? (
        <InviteErrorState kind="mismatch" onBackHome={goHome} />
      ) : null}

      {step.kind === "email-entry" ? (
        <InviteEmailStep
          error={step.error}
          isSubmitting={validateEmail.isPending}
          onSubmit={handleEmailSubmit}
        />
      ) : null}

      {step.kind === "otp-entry" ? (
        <InviteOtpStep
          email={step.email}
          otpError={step.otpError}
          isSubmitting={validateOtp.isPending}
          isResending={validateEmail.isPending}
          cooldownUntil={step.lastSentAt + RESEND_COOLDOWN_MS}
          onSubmit={handleOtpSubmit}
          onResend={handleResend}
          onChangeEmail={() => dispatch({ type: "change-email" })}
        />
      ) : null}

      {step.kind === "response" && invitation ? (
        <InviteResponseStep
          invitation={invitation as unknown as InvitationLike}
          isSubmitting={respond.isPending}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      ) : null}

      {step.kind === "rejected" ? (
        <InviteRejectedStep onBackHome={goHome} />
      ) : null}
    </InviteCardShell>
  );
}
```

- [ ] **Step 7.2: Rewrite `invite-error/page.tsx` as a redirect**

Replace the entire contents of `src/app/(igrp)/invite/invite-error/page.tsx` with:

```tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { AppCenterLoading } from "@/components/loading";

export default function InviteErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      router.replace(`/invite/accept?token=${encodeURIComponent(token)}`);
    } else {
      router.replace("/");
    }
  }, [token, router]);

  return <AppCenterLoading descrption="A redireccionar..." />;
}
```

- [ ] **Step 7.3: Lint and type-check**

Run: `pnpm lint && pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 7.4: Commit**

```bash
git add src/app/(igrp)/invite/accept/page.tsx src/app/(igrp)/invite/invite-error/page.tsx
git commit -m "feat(invite): rewrite accept page as multi-step OTP flow; redirect invite-error"
```

---

## Task 8: Manual verification

The codebase has no test runner; this is the verification gate.

**Files:** none — runtime smoke testing only.

- [ ] **Step 8.1: Run lint as the project gate**

Run: `pnpm lint`
Expected: zero errors. Biome autofixes formatting; if it modifies files, stage + amend the most recent commit (only if the changes are pure formatting).

- [ ] **Step 8.2: Type-check**

Run: `pnpm exec tsc --noEmit`
Expected: zero errors.

- [ ] **Step 8.3: Start the dev server**

Run: `pnpm dev`
Expected: server starts on the configured port without errors. Leave running for the rest of this task.

- [ ] **Step 8.4: Generate a test invitation**

In the running app: log in as an admin, open the user-invite dialog (Users page → "Convidar utilizador"), invite an email you control. Capture the invitation token from the email link or — if email is not delivered in dev — query it via the access-management API directly. Resulting URL: `/invite/accept?token=<TOKEN>`.

- [ ] **Step 8.5: Test path A — JWT email claim missing**

Log out. Log in with an account/provider whose JWT lacks the `email` claim (or use a test account configured for this). Visit `/invite/accept?token=<TOKEN>`.

Expected:
1. Brief loading screen ("Validando convite...").
2. Email entry step appears.
3. Enter the **invited** email → "Enviar Código" → OTP step appears with masked email shown.
4. Enter the OTP from the email → "Verificar Código" → response step appears with email/departments/roles.
5. Click "Rejeitar" → terminal "Convite Rejeitado" screen with "Voltar ao início" link.

- [ ] **Step 8.6: Test path A — invalid OTP**

Repeat path A through the OTP step. Enter a wrong 6-digit code → submit.

Expected: stay on OTP step, error message under the slots, input cleared, form usable for retry. No screen change.

- [ ] **Step 8.7: Test path A — resend cooldown**

On the OTP step, click "Reenviar código" once.

Expected: success toast "Novo código enviado", button text becomes "Reenviar em 60s" and counts down. Clicking it during the cooldown does nothing. After 60s the label returns to "Reenviar código" and the button is enabled.

- [ ] **Step 8.8: Test path A — change email**

On the OTP step, click "Alterar email".

Expected: returns to email entry step with the previous email cleared. Submitting again sends a fresh OTP.

- [ ] **Step 8.9: Test path B — JWT email claim matches invited email**

Log out. Log in with the invited email account directly. Visit `/invite/accept?token=<TOKEN>`.

Expected: brief loading, then response step appears immediately (no email/OTP). "Aceitar" → success toast → redirect to `/`.

- [ ] **Step 8.10: Test path C — JWT email claim mismatches**

Log in with a different account (not the invited email). Visit `/invite/accept?token=<TOKEN>`.

Expected: terminal "Convite não corresponde" screen with "Voltar ao início" link.

- [ ] **Step 8.11: Test invalid token**

Visit `/invite/accept?token=bogus-string`.

Expected: terminal "Convite inválido" screen with "Voltar ao início" link. No toast, no redirect loop.

- [ ] **Step 8.12: Test missing token**

Visit `/invite/accept` (no `?token=`).

Expected: terminal "Convite inválido" screen.

- [ ] **Step 8.13: Test the legacy `/invite/invite-error` redirect**

Visit `/invite/invite-error?token=<TOKEN>`.

Expected: brief "A redireccionar..." loading, then arrives at `/invite/accept?token=<TOKEN>` and resumes the normal flow. Without `?token=`, redirects to `/`.

- [ ] **Step 8.14: Theme check**

Toggle the app's theme between light and dark (whichever switcher exists). Walk through email-entry, OTP, and response steps in both themes.

Expected: text remains readable (no white-on-white), decorative gradient blobs are visible but not overwhelming, error states use the destructive token, the OTP icon halo (amber) reads correctly. If amber halo looks wrong in either theme, swap to `bg-warning/10 text-warning` (the spec flags this as token-availability-dependent) — note any change as a follow-up commit.

- [ ] **Step 8.15: Stop the dev server and report results**

Document each verification step's outcome (pass/fail). If any step failed, halt and either fix in place or open an issue describing the gap before declaring the plan complete.

---

## Self-Review Checklist (run before declaring complete)

- **Spec coverage:** every section of the spec maps to at least one task. State machine → Task 2 + Task 7. Data flow → Task 1 + Task 7. Components → Tasks 3–6. Error handling → Tasks 3, 5, 6, 7 + verification 8.6/8.10/8.11. Visual mapping → Tasks 3–6. Accessibility → Task 4 (`aria-describedby` via FormMessage), Task 5 (`aria-label` countdown, `inputMode`/`autoComplete` on InputOTP), Task 3 (`aria-live` on shell, `aria-hidden` on decoration). Testing → Task 8.
- **Placeholder scan:** no "TBD" / "TODO" / "implement later" — Step 7.1 deliberately introduces a placeholder line that Step 7.2 deletes; flagged inline.
- **Type consistency:** `Step` / `Action` names match across reducer (Task 2), orchestrator dispatches (Task 7.1), component prop shapes (Tasks 4–6); `RESEND_COOLDOWN_MS` exported by Task 2 and consumed by Task 7.1; `InvitationLike` defined in Task 6.1 and consumed by Task 7.1.
- **Commit cadence:** seven feature commits on the way to a working flow, plus a verification task — no half-states left in tree.
