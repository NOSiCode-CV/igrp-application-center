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
import { type InviteOtpFormArgs, InviteOtpFormSchema } from "../../user-schema";

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
          <IGRPIcon iconName="Shield" className="h-8 w-8" aria-hidden="true" />
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
