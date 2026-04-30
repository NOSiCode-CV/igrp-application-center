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
