"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useReducer } from "react";
import { AppCenterLoading } from "@/components/loading";
import {
  useGetUserInvitationByToken,
  useRespondUserInvitation,
  useValidateInvitationEmail,
  useValidateInvitationOtp,
} from "@/features/users/use-users";
import { InviteCardShell } from "./invite-card-shell";
import { InviteEmailStep } from "./invite-email-step";
import { InviteErrorState } from "./invite-error-state";
import {
  classifyInviteError,
  initialStep,
  inviteFlowReducer,
  RESEND_COOLDOWN_MS,
} from "./invite-flow-state";
import { InviteOtpStep } from "./invite-otp-step";
import { InviteRejectedStep } from "./invite-rejected-step";
import { InviteResponseStep, toInvitationLike } from "./invite-response-step";

export function AcceptInvitePage() {
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

  const stepEmail = step.kind === "email-auto-submit" ? step.email : null;

  const validateEmail = useValidateInvitationEmail();
  const validateOtp = useValidateInvitationOtp();
  const respond = useRespondUserInvitation();

  useEffect(() => {
    if (step.kind !== "bootstrapping") return;

    if (!token) {
      dispatch({ type: "bootstrap-fail" });
      return;
    }

    if (sessionStatus !== "authenticated") return;
    if (isLoadingInvitation) return;

    if (invitationError || !invitation) {
      const message = (invitationError as Error | null)?.message;
      const cls = classifyInviteError(message);
      if (cls === "expired") {
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

  const goHome = () => router.push("/");

  const dispatchEmailFailure = (message: string | undefined) => {
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
  };

  const handleEmailSubmit = (email: string) => {
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
        onError: (err) => {
          dispatchEmailFailure((err as Error).message);
        },
      },
    );
  };

  const dispatchOtpFailure = (message: string | undefined) => {
    const cls = classifyInviteError(message);
    if (cls === "expired") {
      dispatch({ type: "token-expired", message });
    } else if (cls === "mismatch") {
      dispatch({ type: "email-mismatch", message });
    } else {
      dispatch({
        type: "otp-error",
        message: message ?? "Código inválido",
      });
    }
  };

  const handleOtpSubmit = (otpCode: string) => {
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
        onError: (err) => {
          dispatchOtpFailure((err as Error).message);
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
              duration: 6000,
            });
            return;
          }
          igrpToast({
            type: "success",
            title: "Convite aceito",
            description: "Você agora tem acesso à aplicação",
            duration: 6000,
          });
          router.push("/");
        },
        onError: (err) => {
          igrpToast({
            type: "error",
            title: "Erro ao aceitar convite",
            description: (err as Error).message,
            duration: 6000,
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
        onError: (err) => {
          dispatchEmailFailure((err as Error).message);
        },
      },
    );
  }, [stepEmail, token]);

  if (step.kind === "bootstrapping") {
    return <AppCenterLoading description="Validando convite..." />;
  }

  if (step.kind === "email-auto-submit") {
    return <AppCenterLoading description="A validar email..." />;
  }

  return (
    <InviteCardShell>
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
          onChangeEmail={() => dispatch({ type: "change-email" })}
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
