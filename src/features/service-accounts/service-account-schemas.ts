import type { Messages } from "next-intl";
import { z } from "zod";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
} from "@/features/oauth-clients/oauth-client-schemas";

/** Column limits enforced by the backend (ACCOUNTS_BACKEND_RESPONSES.md §7). */
export const SERVICE_ACCOUNT_NAME_MAX = 180;
export const SERVICE_ACCOUNT_DESCRIPTION_MAX = 500;

/**
 * Translator for `serviceAccounts.validation.*`, satisfied by
 * `useTranslations("serviceAccounts.validation")`.
 */
export type ServiceAccountsValidationTranslator = (
  key: keyof Messages["serviceAccounts"]["validation"],
  values?: Record<string, number>,
) => string;

/** Validation messages come from the catalog, so the schema is built per translator. */
export function makeServiceAccountIdentitySchema(
  t: ServiceAccountsValidationTranslator,
) {
  return z.object({
    name: z
      .string()
      .trim()
      .min(1, t("nameRequired"))
      .max(
        SERVICE_ACCOUNT_NAME_MAX,
        t("nameMax", { max: SERVICE_ACCOUNT_NAME_MAX }),
      ),
    description: z
      .string()
      .trim()
      .max(
        SERVICE_ACCOUNT_DESCRIPTION_MAX,
        t("descriptionMax", { max: SERVICE_ACCOUNT_DESCRIPTION_MAX }),
      ),
    active: z.boolean(),
  });
}

export type ServiceAccountIdentityValues = z.infer<
  ReturnType<typeof makeServiceAccountIdentitySchema>
>;

export function emptyIdentityValues(): ServiceAccountIdentityValues {
  return { name: "", description: "", active: true };
}

/** Wizard step 1, "new client": grant types are fixed to client_credentials. */
export function machineClientFormValues(): OAuthClientFormValues {
  return {
    ...emptyOAuthClientFormValues(),
    grantTypes: ["client_credentials"],
    scopes: [],
  };
}
