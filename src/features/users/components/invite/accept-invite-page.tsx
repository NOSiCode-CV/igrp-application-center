"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

import {
  useCurrentUser,
  useGetUserInvitationByToken,
  useRespondUserInvitation,
  useValidateInvitationEmail,
  useValidateInvitationOtp,
} from "@/features/users/use-users";

import { InviteCardShell, type InviteStepIndex } from "./invite-card-shell";
import { InviteEmailStep } from "./invite-email-step";
import { InviteErrorState } from "./invite-error-state";
import {
  classifyInviteError,
  initialStep,
  inviteFlowReducer,
  RESEND_COOLDOWN_MS,
  type Step,
} from "./invite-flow-state";
import { InviteOtpStep } from "./invite-otp-step";
import { InviteRejectedStep } from "./invite-rejected-step";
import { InviteResponseStep, toInvitationLike } from "./invite-response-step";

function stepIndex(kind: Step["kind"]): InviteStepIndex | undefined {
  switch (kind) {
    case "email-entry":
    case "email-auto-submit":
      return 0;
    case "otp-entry":
      return 1;
    case "response":
      return 2;
    default:
      return undefined;
  }
}

export function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });

  // `session.user.email` is not reliably populated by the IGRP OIDC provider —
  // use the API user record as the authoritative email source.
  // Only fire after the session is confirmed — calling the server action before
  // that risks getClientAccess() hitting a null session and redirecting to /login.
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser(
    { enabled: sessionStatus === "authenticated" },
  );

  // Mirror the same session guard applied to useCurrentUser: don't call the
  // server action until the session is confirmed to avoid a 403 from the
  // ACCESS MANAGEMENT API when the access token hasn't been validated yet.
  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useGetUserInvitationByToken(token ?? "", {
    enabled: sessionStatus === "authenticated",
  });

  const [step, dispatch] = useReducer(inviteFlowReducer, initialStep);

  // Guards the auto-submit effect against React StrictMode's double-invoke (and
  // any re-render before the mutation's `isPending` flips), which could
  // otherwise fire two OTP emails for the same address.
  const autoSubmittedEmailRef = useRef<string | null>(null);

  const validateEmail = useValidateInvitationEmail();
  const validateOtp = useValidateInvitationOtp();
  const respond = useRespondUserInvitation();

  const stepEmail = step.kind === "email-auto-submit" ? step.email : null;

  useEffect(() => {
    if (step.kind !== "bootstrapping") return;
    if (!token) {
      dispatch({ type: "bootstrap-fail" });
      return;
    }
    if (
      sessionStatus !== "authenticated" ||
      isLoadingInvitation ||
      isLoadingCurrentUser
    )
      return;

    if (invitationError || !invitation) {
      const message = (invitationError as Error | null)?.message;
      if (classifyInviteError(message) === "expired") {
        dispatch({ type: "bootstrap-expired", message });
      } else {
        dispatch({ type: "bootstrap-fail", message });
      }
      return;
    }

    const claimEmail = currentUser?.email ?? session?.user?.email ?? null;
    if (!claimEmail) {
      dispatch({ type: "bootstrap-ok-no-claim" });
    } else {
      dispatch({ type: "bootstrap-ok-has-email", email: claimEmail });
    }
  }, [
    step.kind,
    token,
    sessionStatus,
    isLoadingInvitation,
    isLoadingCurrentUser,
    invitationError,
    invitation,
    currentUser?.email,
    session?.user?.email,
  ]);

  // Full reload so the session is re-initialized with the correct roles.
  // A client-side router.push("/") reuses the stale access token, which can
  // still carry TEMPORARY status and cause the home layout to redirect back to
  // /invite/pending even when the user already has valid permissions.
  const goHome = useCallback(() => window.location.assign("/"), []);

  // Wrong account: route through /logout so the IdP SSO session is actually
  // terminated (a plain next-auth signOut clears only the local session, and
  // the IdP would silently re-authenticate the same wrong account on return,
  // trapping the user). After the full logout + fresh login the user lands on
  // the app home and re-opens the invite link as the correct account.
  const handleSignOut = useCallback(() => {
    router.push("/logout");
  }, [router]);

  const dispatchEmailFailure = useCallback((message: string | undefined) => {
    const cls = classifyInviteError(message);
    if (cls === "expired") {
      dispatch({ type: "token-expired", message });
    } else if (cls === "mismatch") {
      dispatch({ type: "email-mismatch", message });
    } else {
      dispatch({
        type: "email-error",
        message: message ?? "Erro ao validar email",
      });
    }
  }, []);

  const dispatchOtpFailure = useCallback((message: string | undefined) => {
    const cls = classifyInviteError(message);
    if (cls === "expired") {
      dispatch({ type: "token-expired", message });
    } else if (cls === "mismatch") {
      dispatch({ type: "email-mismatch", message });
    } else {
      dispatch({ type: "otp-error", message: message ?? "Código inválido" });
    }
  }, []);

  const handleEmailSubmit = useCallback(
    (email: string) => {
      if (!token) return;
      validateEmail.mutate(
        { token, email },
        {
          onSuccess: (result) => {
            if (!result.success) {
              dispatchEmailFailure(result.error);
              return;
            }
            dispatch({ type: "email-validated", email });
          },
          onError: (err) => dispatchEmailFailure((err as Error).message),
        },
      );
    },
    [token, validateEmail, dispatchEmailFailure],
  );

  const handleOtpSubmit = useCallback(
    (otpCode: string) => {
      if (!token) return;
      validateOtp.mutate(
        { token, otpCode },
        {
          onSuccess: (result) => {
            if (!result.success) {
              dispatchOtpFailure(result.error);
              return;
            }
            dispatch({ type: "otp-validated" });
          },
          onError: (err) => dispatchOtpFailure((err as Error).message),
        },
      );
    },
    [token, validateOtp, dispatchOtpFailure],
  );

  const handleResend = useCallback(() => {
    if (step.kind !== "otp-entry" || !token) return;
    const email = step.email;
    validateEmail.mutate(
      { token, email },
      {
        onSuccess: (result) => {
          if (!result.success) {
            // Mirror handleOtpSubmit: an expired token surfaces the dedicated
            // expired screen rather than a generic resend toast.
            if (classifyInviteError(result.error) === "expired") {
              dispatch({ type: "token-expired", message: result.error });
              return;
            }
            toast.error("Não foi possível reenviar o código", {
              description: result.error,
            });
            return;
          }
          dispatch({ type: "resend-sent" });
          toast.success("Novo código enviado");
        },
        onError: (err) => {
          const message = (err as Error).message;
          if (classifyInviteError(message) === "expired") {
            dispatch({ type: "token-expired", message });
            return;
          }
          toast.error("Não foi possível reenviar o código", {
            description: message,
          });
        },
      },
    );
  }, [step, token, validateEmail]);

  const handleChangeEmail = useCallback(
    () => dispatch({ type: "change-email" }),
    [],
  );

  const handleAccept = useCallback(() => {
    if (!token || !invitation) return;
    respond.mutate(
      { response: { accept: true, observation: "Convite aceite" }, token },
      {
        onSuccess: (result) => {
          if (!result.success) {
            toast.error("Erro ao aceitar convite", {
              description: result.error,
            });
            return;
          }
          toast.success("Convite aceite", {
            description: "Tem agora acesso à aplicação.",
          });
          // Full reload so the session is re-initialized with the new
          // roles/department granted by the accepted invite. A client-side
          // router.push("/") reuses the stale session, which causes the IGRP
          // layout header to fail when it tries to fetch the updated user data.
          window.location.assign("/");
        },
        onError: (err) =>
          toast.error("Erro ao aceitar convite", {
            description: (err as Error).message,
          }),
      },
    );
  }, [token, invitation, respond]);

  const handleReject = useCallback(() => {
    if (!token || !invitation) return;
    respond.mutate(
      { response: { accept: false, observation: "Convite rejeitado" }, token },
      {
        onSuccess: (result) => {
          if (!result.success) {
            toast.error("Erro ao rejeitar convite", {
              description: result.error,
            });
            return;
          }
          dispatch({ type: "rejected" });
        },
        onError: (err) =>
          toast.error("Erro ao rejeitar convite", {
            description: (err as Error).message,
          }),
      },
    );
  }, [token, invitation, respond]);

  // Auto-submit the email the session already carries so the user doesn't have
  // to retype it. On success the flow proceeds to the OTP step exactly like the
  // manual path — the emailed code is still required. On failure, surface the
  // reason via toast and fall back to the clean email entry step so the user can
  // manually identify themselves.
  // biome-ignore lint/correctness/useExhaustiveDependencies: validateEmail mutation ref is stable
  useEffect(() => {
    if (
      !stepEmail ||
      !token ||
      validateEmail.isPending ||
      validateEmail.isSuccess
    )
      return;
    if (autoSubmittedEmailRef.current === stepEmail) return;
    autoSubmittedEmailRef.current = stepEmail;
    validateEmail.mutate(
      { token, email: stepEmail },
      {
        onSuccess: (result) => {
          if (!result.success) {
            const cls = classifyInviteError(result.error);
            if (cls === "expired") {
              dispatch({ type: "token-expired", message: result.error });
              return;
            }
            toast.error("Verificação automática de email falhou", {
              description:
                result.error ??
                "O email da sua conta não corresponde ao convite.",
            });
            dispatch({ type: "auto-submit-failed" });
            return;
          }
          dispatch({ type: "email-validated", email: stepEmail });
        },
        onError: (err) => {
          const message = (err as Error).message;
          const cls = classifyInviteError(message);
          if (cls === "expired") {
            dispatch({ type: "token-expired", message });
            return;
          }
          toast.error("Verificação automática de email falhou", {
            description:
              message ?? "Não foi possível verificar o email automaticamente.",
          });
          dispatch({ type: "auto-submit-failed" });
        },
      },
    );
  }, [stepEmail, token]);

  return (
    <InviteCardShell step={stepIndex(step.kind)}>
      {step.kind === "bootstrapping" || step.kind === "email-auto-submit" ? (
        <LoadingState
          label={
            step.kind === "bootstrapping"
              ? "A validar convite…"
              : "A validar email…"
          }
        />
      ) : null}

      {step.kind === "invalid-invitation" ? (
        <InviteErrorState
          kind="invalid"
          description={step.message}
          onBackHome={goHome}
          onSignOut={handleSignOut}
        />
      ) : null}

      {step.kind === "email-mismatch" ? (
        <InviteErrorState
          kind="mismatch"
          description={step.message}
          onBackHome={goHome}
          onSignOut={handleSignOut}
        />
      ) : null}

      {step.kind === "token-expired" ? (
        <InviteErrorState
          kind="expired"
          description={step.message}
          onBackHome={goHome}
          onSignOut={handleSignOut}
        />
      ) : null}

      {step.kind === "email-entry" ? (
        <InviteEmailStep
          defaultEmail={currentUser?.email ?? session?.user?.email ?? undefined}
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
          onChangeEmail={handleChangeEmail}
        />
      ) : null}

      {step.kind === "response" ? (
        invitation ? (
          <InviteResponseStep
            invitation={toInvitationLike(invitation)}
            isSubmitting={respond.isPending}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ) : isLoadingInvitation ? (
          <LoadingState label="A carregar convite…" />
        ) : (
          <InviteErrorState
            kind="invalid"
            onBackHome={goHome}
            onSignOut={handleSignOut}
          />
        )
      ) : null}

      {step.kind === "rejected" ? (
        <InviteRejectedStep onBackHome={goHome} />
      ) : null}
    </InviteCardShell>
  );
}

export function LoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-8 text-center text-muted-foreground"
    >
      <Loader2
        aria-hidden="true"
        className="size-8 animate-spin text-primary"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
