"use client";

import { useMemo } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  IGRPIcon,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import {
  type InviteEmailFormArgs,
  makeInviteEmailFormSchema,
} from "../../user-schemas";
import { InviteStepHeader } from "./invite-step-header";

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
  const t = useTranslations("users.invite.accept.emailStep");
  const tv = useTranslations("users.validation");
  const schema = useMemo(() => makeInviteEmailFormSchema(tv), [tv]);
  const form = useForm<InviteEmailFormArgs>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { email: defaultEmail ?? "" },
  });

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values.email.trim());
  });

  const fieldInvalid = Boolean(error) || Boolean(form.formState.errors.email);

  return (
    <div className="flex flex-col gap-8">
      <InviteStepHeader
        icon="Mail"
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fieldInvalid || undefined}>
            <FieldLabel htmlFor="email" className="sr-only">
              {t("emailLabel")}
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <IGRPIcon iconName="Mail" aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                autoComplete="email"
                spellCheck={false}
                placeholder={t("emailPlaceholder")}
                disabled={isSubmitting}
                aria-invalid={fieldInvalid}
                {...form.register("email")}
              />
            </InputGroup>
            <FieldDescription
              aria-live="polite"
              aria-atomic="true"
              className="text-destructive"
            >
              {form.formState.errors.email?.message ?? error ?? null}
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
          {!isSubmitting ? <IGRPIcon iconName="ArrowRight" data-icon="inline-end" /> : null}
        </Button>
      </form>
    </div>
  );
}
