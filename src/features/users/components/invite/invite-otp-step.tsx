"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@igrp/igrp-framework-react-design-system";
import { Loader2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { type InviteOtpFormArgs, InviteOtpFormSchema } from "../../user-schema";
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
  const form = useForm<InviteOtpFormArgs>({
    resolver: zodResolver(InviteOtpFormSchema),
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
        icon={ShieldCheck}
        eyebrow="Verificação"
        title="Código de acesso"
        description={
          <>
            Enviámos um código de 6 dígitos para{" "}
            <span className="font-medium text-foreground">{email}</span>.
          </>
        }
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fieldInvalid || undefined}>
            <FieldLabel htmlFor="otp-code" className="sr-only">
              Código OTP
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
            {otpError || form.formState.errors.otpCode ? (
              <FieldDescription
                role="alert"
                className="text-center text-destructive"
              >
                {form.formState.errors.otpCode?.message ?? otpError}
              </FieldDescription>
            ) : null}
          </Field>
        </FieldGroup>

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting || !form.formState.isValid}
        >
          {isSubmitting ? (
            <Loader2 data-icon="inline-start" className="animate-spin" />
          ) : null}
          {isSubmitting ? "A verificar..." : "Verificar código"}
        </Button>

        <div className="flex flex-col items-center gap-1.5 text-sm">
          <button
            type="button"
            onClick={onResend}
            disabled={inCooldown || isResending}
            className="font-medium text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {isResending
              ? "A reenviar..."
              : inCooldown
                ? `Reenviar em ${remainingSeconds}s`
                : "Reenviar código"}
          </button>
          <button
            type="button"
            onClick={onChangeEmail}
            disabled={isSubmitting}
            className="text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed"
          >
            Alterar email
          </button>
        </div>
      </form>
    </div>
  );
}
