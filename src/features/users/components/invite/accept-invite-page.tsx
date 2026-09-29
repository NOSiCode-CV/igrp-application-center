"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useReducer, useRef } from "react";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("users.invite.accept");

  const { data: session, status: sessionStatus } = useSession({
    required: true,
  });
  
  const { data: currentUser, isLoading: isLoadingCurrentUser } = useCurrentUser(
    { enabled: sessionStatus === "authenticated" },
  );
 
  const {
    data: invitation,
    isLoading: isLoadingInvitation,
    error: invitationError,
  } = useGetUserInvitationByToken(token ?? "", {
    enabled: sessionStatus === "authenticated",
  });

  const [step, dispatch] = useReducer(inviteFlowReducer, initialStep);
  
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
  
  const goHome = useCallback(() => window.location.assign("/"), []);
  
  const handleSignOut = useCallback(() => {
    router.push("/logout");
  }, [router]);

  const dispatchEmailFailure = useCallback(
    (message: string | undefined) => {
      const cls = classifyInviteError(message);
      if (cls === "expired") {
        dispatch({ type: "token-expired", message });
      } else if (cls === "mismatch") {
        dispatch({ type: "email-mismatch", message });
      } else {
        dispatch({
          type: "email-error",
          message: message ?? t("errors.emailValidation"),
        });
      }
    },
    [t],
  );

  const dispatchOtpFailure = useCallback(
    (message: string | undefined) => {
      const cls = classifyInviteError(message);
      if (cls === "expired") {
        dispatch({ type: "token-expired", message });
      } else if (cls === "mismatch") {
        dispatch({ type: "email-mismatch", message });
      } else {
        dispatch({
          type: "otp-error",
          message: message ?? t("errors.invalidCode"),
        });
      }
    },
    [t],
  );

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
            if (classifyInviteError(result.error) === "expired") {
              dispatch({ type: "token-expired", message: result.error });
              return;
            }
            toast.error(t("toasts.resendFailed"), {
              description: result.error,
            });
            return;
          }
          dispatch({ type: "resend-sent" });
          toast.success(t("toasts.resendSuccess"));
        },
        onError: (err) => {
          const message = (err as Error).message;
          if (classifyInviteError(message) === "expired") {
            dispatch({ type: "token-expired", message });
            return;
          }
          toast.error(t("toasts.resendFailed"), {
            description: message,
          });
        },
      },
    );
  }, [step, token, validateEmail, t]);

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
            toast.error(t("toasts.acceptFailed"), {
              description: result.error,
            });
            return;
          }
          toast.success(t("toasts.accepted"), {
            description: t("toasts.acceptedDescription"),
          });        
          window.location.assign("/");
        },
        onError: (err) =>
          toast.error(t("toasts.acceptFailed"), {
            description: (err as Error).message,
          }),
      },
    );
  }, [token, invitation, respond, t]);

  const handleReject = useCallback(() => {
    if (!token || !invitation) return;
    respond.mutate(
      { response: { accept: false, observation: "Convite rejeitado" }, token },
      {
        onSuccess: (result) => {
          if (!result.success) {
            toast.error(t("toasts.rejectFailed"), {
              description: result.error,
            });
            return;
          }
          dispatch({ type: "rejected" });
        },
        onError: (err) =>
          toast.error(t("toasts.rejectFailed"), {
            description: (err as Error).message,
          }),
      },
    );
  }, [token, invitation, respond, t]);
  
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
            toast.error(t("toasts.autoVerifyFailed"), {
              description: result.error ?? t("toasts.autoVerifyMismatch"),
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
          toast.error(t("toasts.autoVerifyFailed"), {
            description: message ?? t("toasts.autoVerifyUnavailable"),
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
              ? t("loading.validatingInvite")
              : t("loading.validatingEmail")
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
          <LoadingState label={t("loading.loadingInvite")} />
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
      <IGRPIcon
        iconName="Loader2"
        className="size-8 animate-spin text-primary"
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}
