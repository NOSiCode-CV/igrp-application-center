import { z } from "zod";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
} from "@/features/oauth-clients/oauth-client-schemas";

/** Limits are provisional — ACCOUNTS_BACKEND_REQUESTS.md §7. */
export const serviceAccountIdentitySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Indique o nome.")
    .max(255, "Até 255 caracteres."),
  description: z.string().trim().max(255, "Até 255 caracteres."),
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
