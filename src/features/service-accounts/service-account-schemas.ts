import { z } from "zod";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
} from "@/features/oauth-clients/oauth-client-schemas";

/** Column limits enforced by the backend (ACCOUNTS_BACKEND_RESPONSES.md §7). */
export const SERVICE_ACCOUNT_NAME_MAX = 180;
export const SERVICE_ACCOUNT_DESCRIPTION_MAX = 500;

export const serviceAccountIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indique o nome.")
    .max(
      SERVICE_ACCOUNT_NAME_MAX,
      `Até ${SERVICE_ACCOUNT_NAME_MAX} caracteres.`,
    ),
  description: z
    .string()
    .trim()
    .max(
      SERVICE_ACCOUNT_DESCRIPTION_MAX,
      `Até ${SERVICE_ACCOUNT_DESCRIPTION_MAX} caracteres.`,
    ),
  active: z.boolean(),
});

export type ServiceAccountIdentityValues = z.infer<
  typeof serviceAccountIdentitySchema
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
