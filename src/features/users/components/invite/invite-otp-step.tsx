"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  IGRPIcon,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import {
  type InviteOtpFormArgs,
  makeInviteOtpFormSchema,
} from "../../user-schemas";
import { InviteStepHeader } from "./invite-step-header";

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

function useCountdown(until: number): number {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.ceil((until - Date.now()) / 1000)),
  );
  useEffect(() => {
    setRemaining(Math.max(0, Math.ceil((until - Date.now()) / 1000)));
    if (until <= Date.now()) return;
    const id = window.setInterval(() => {
      const next = Math.max(0, Math.ceil((until - Date.now()) / 1000));
      setRemaining(next);
      if (next === 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [until]);
  return remaining;
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
  const t = useTranslations("users.invite.accept.otpStep");
  const tv = useTranslations("users.validation");
  const schema = useMemo(() => makeInviteOtpFormSchema(tv), [tv]);
  const form = useForm<InviteOtpFormArgs>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { otpCode: "" },
  });

  const { setValue } = form;
  useEffect(() => {
    if (otpError) setValue("otpCode", "", { shouldValidate: false });
  }, [otpError, setValue]);

  const remainingSeconds = useCountdown(cooldownUntil);
  const inCooldown = remainingSeconds > 0;

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.otpCode);
  });

  const handleOtpChange = useCallback(
    (value: string) => {
      form.setValue("otpCode", value, { shouldValidate: true });
    },
    [form],
  );

  const fieldInvalid =
    Boolean(otpError) || Boolean(form.formState.errors.otpCode);

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon="ShieldCheck"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t.rich("description", {
          email,
          strong: (chunks) => (
            <span className="font-medium text-foreground">{chunks}</span>
          ),
        })}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fieldInvalid || undefined}>
            <FieldLabel htmlFor="otp-code" className="sr-only">
              {t("codeLabel")}
            </FieldLabel>
            <InputOTP
              id="otp-code"
              maxLength={6}
              pattern="^\d+$"
              inputMode="numeric"
              autoComplete="one-time-code"
              containerClassName="justify-center"
              disabled={isSubmitting}
              value={form.watch("otpCode")}
              onChange={handleOtpChange}
            >
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
            <FieldDescription
              aria-live="polite"
              aria-atomic="true"
              className="text-center text-destructive"
            >
              {form.formState.errors.otpCode?.message ?? otpError ?? null}
            </FieldDescription>
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? (
            <IGRPIcon
              iconName="LoaderCircle"
              data-icon="inline-start"
              className="animate-spin"
            />
          ) : null}
          {isSubmitting ? t("submitting") : t("submit")}
        </Button>

        <div className="flex flex-col items-center gap-0.5">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onResend}
            disabled={inCooldown || isResending}
            className="h-auto p-0 font-medium"
          >
            {isResending
              ? t("resending")
              : inCooldown
                ? t("resendIn", { seconds: remainingSeconds })
                : t("resend")}
          </Button>
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={onChangeEmail}
            disabled={isSubmitting}
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
          >
            {t("changeEmail")}
          </Button>
        </div>
      </form>
    </div>
  );
}
