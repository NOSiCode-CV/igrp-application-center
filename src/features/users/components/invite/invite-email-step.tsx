"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@igrp/igrp-framework-react-design-system";
import { ArrowRight, Loader2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";

import {
  type InviteEmailFormArgs,
  InviteEmailFormSchema,
} from "../../user-schema";
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
  const form = useForm<InviteEmailFormArgs>({
    resolver: zodResolver(InviteEmailFormSchema),
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
        icon={Mail}
        eyebrow="Confirmação"
        title="Bem-vindo"
        description="Introduza o seu email para aceder ao convite."
      />

      <form onSubmit={handleSubmit} className="flex flex-col gap-6" noValidate>
        <FieldGroup>
          <Field data-invalid={fieldInvalid || undefined}>
            <FieldLabel htmlFor="email" className="sr-only">
              Email
            </FieldLabel>
            <InputGroup>
              <InputGroupAddon>
                <Mail aria-hidden="true" />
              </InputGroupAddon>
              <InputGroupInput
                id="email"
                type="email"
                autoComplete="email"
                placeholder="exemplo@email.cv"
                disabled={isSubmitting}
                aria-invalid={fieldInvalid}
                {...form.register("email")}
              />
            </InputGroup>
            {form.formState.errors.email ? (
              <FieldDescription className="text-destructive">
                {form.formState.errors.email.message}
              </FieldDescription>
            ) : error ? (
              <FieldDescription role="alert" className="text-destructive">
                {error}
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
          {isSubmitting ? "A enviar..." : "Enviar código"}
          {!isSubmitting ? <ArrowRight data-icon="inline-end" /> : null}
        </Button>
      </form>
    </div>
  );
}
