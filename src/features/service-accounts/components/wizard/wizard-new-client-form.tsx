"use client";

import {
  Button,
  Form,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import { OAuthClientFormSections } from "@/features/oauth-clients/components/oauth-client-form-sections";
import type { OAuthClientFormValues } from "@/features/oauth-clients/oauth-client-schemas";

/** The form instance lives in the wizard so a 409 at submit can land on clientId. */
export function WizardNewClientForm({
  form,
  onContinue,
}: {
  form: UseFormReturn<OAuthClientFormValues>;
  onContinue: (values: OAuthClientFormValues) => void;
}) {
  const t = useTranslations("serviceAccounts");
  return (
    <Form {...form}>
      <form
        noValidate
        onSubmit={form.handleSubmit(onContinue)}
        className="flex flex-col gap-4 rounded-lg border border-border"
      >
        <OAuthClientFormSections mode="create" grantTypesFixed />
        <div className="flex justify-end p-4">
          <Button type="submit">
            {t("shared.continue")}
            <IGRPIcon iconName="ArrowRight" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
