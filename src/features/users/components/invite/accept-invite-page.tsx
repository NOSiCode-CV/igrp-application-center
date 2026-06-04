"use client";

import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useReducer } from "react";
import { toast } from "sonner";
import {
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

  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useGetUserInvitationByToken(token ?? "");

  const [step, dispatch] = useReducer(inviteFlowReducer, initialStep);

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
    if (sessionStatus !== "authenticated" || isLoadingInvitation) return;

    if (invitationError || !invitation) {
      const message = (invitationError as Error | null)?.message;
      if (classifyInviteError(message) === "expired") {
        dispatch({ type: "bootstrap-expired", message });
      } else {
        dispatch({ type: "bootstrap-fail", message });
      }
      return;
    }

    const claimEmail = session?.user?.email;
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
    invitationError,
    invitation,
    session?.user?.email,
  ]);

  const goHome = useCallback(() => router.push("/"), [router]);

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
            toast.error("Não foi possível reenviar o código", {
              description: result.error,
            });
            return;
          }
          dispatch({ type: "resend-sent" });
          toast.success("Novo código enviado");
        },
        onError: (err) =>
          toast.error("Não foi possível reenviar o código", {
            description: (err as Error).message,
          }),
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
      { response: { accept: true, observation: "Convite aceito" }, token },
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
          router.push("/");
        },
        onError: (err) =>
          toast.error("Erro ao aceitar convite", {
            description: (err as Error).message,
          }),
      },
    );
  }, [token, invitation, respond, router]);

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

  // Auto-submit email when the session already carries one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: validateEmail mutation ref is stable
  useEffect(() => {
    if (
      !stepEmail ||
      !token ||
      validateEmail.isPending ||
      validateEmail.isSuccess
    )
      return;
    validateEmail.mutate(
      { token, email: stepEmail },
      {
        onSuccess: (result) => {
          if (!result.success) {
            dispatchEmailFailure(result.error);
            return;
          }
          dispatch({ type: "email-validated", email: stepEmail });
        },
        onError: (err) => dispatchEmailFailure((err as Error).message),
      },
    );
  }, [stepEmail, token]);

  return (
    <InviteCardShell step={stepIndex(step.kind)}>
      {step.kind === "bootstrapping" || step.kind === "email-auto-submit" ? (
        <LoadingState
          label={
            step.kind === "bootstrapping"
              ? "A validar convite..."
              : "A validar email..."
          }
        />
      ) : null}

      {step.kind === "invalid-invitation" ? (
        <InviteErrorState
          kind="invalid"
          description={step.message}
          onBackHome={goHome}
        />
      ) : null}

      {step.kind === "email-mismatch" ? (
        <InviteErrorState
          kind="mismatch"
          description={step.message}
          onBackHome={goHome}
        />
      ) : null}

      {step.kind === "token-expired" ? (
        <InviteErrorState
          kind="expired"
          description={step.message}
          onBackHome={goHome}
        />
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
          onChangeEmail={handleChangeEmail}
        />
      ) : null}

      {step.kind === "response" && invitation ? (
        <InviteResponseStep
          invitation={toInvitationLike(invitation)}
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

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center text-muted-foreground">
      <Loader2
        aria-hidden="true"
        className="size-8 animate-spin text-primary"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
