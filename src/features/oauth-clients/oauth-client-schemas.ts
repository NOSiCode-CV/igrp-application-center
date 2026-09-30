import type {
  OAuthClientDTO,
  OAuthGrantType,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import {
  type OAuthClientInput,
  toOAuthClientRequest,
} from "./lib/oauth-client-request";
import { isAllowedRedirectUri } from "./lib/oauth-client-utils";

export const grantTypeSchema = z.enum([
  "authorization_code",
  "refresh_token",
  "client_credentials",
  "device_code",
]);

const ttlSchema = z
  .number({ error: "Use um número inteiro de segundos." })
  .int("Use um número inteiro de segundos.")
  .positive("Use um número inteiro de segundos.")
  .optional();

export const oauthClientFormSchema = z
  .object({
    clientId: z
      .string()
      .trim()
      .min(1, "Indique o client ID.")
      .max(100, "Até 100 caracteres.")
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        "Use minúsculas, números e hífenes (ex.: my-invoice).",
      ),
    clientName: z
      .string()
      .trim()
      .min(1, "Indique o nome.")
      .max(255, "Até 255 caracteres."),
    description: z.string().trim().max(140, "Até 140 caracteres."),
    // IGRPCombobox emits "" when the selected option is picked again.
    applicationCode: z.string().trim().optional(),
    grantTypes: z
      .array(grantTypeSchema)
      .min(1, "Escolha pelo menos um grant type."),
    redirectUris: z.array(z.string().trim()),
    scopes: z.array(z.string().trim().min(1)),
    accessTokenTtl: ttlSchema,
    refreshTokenTtl: ttlSchema,
    authorizationCodeTtl: ttlSchema,
    active: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (!v.grantTypes.includes("authorization_code")) return;
    if (v.redirectUris.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["redirectUris"],
        message: "Adicione pelo menos um URI de redirecionamento.",
      });
    }
    for (const uri of v.redirectUris) {
      if (!isAllowedRedirectUri(uri)) {
        ctx.addIssue({
          code: "custom",
          path: ["redirectUris"],
          message: `«${uri}» não é permitido. Use https:// (ou http://localhost).`,
        });
      }
    }
  });

export type OAuthClientFormValues = z.infer<typeof oauthClientFormSchema>;

/** Scope defaults while authorization_code is selected (spec §4.3). */
export const DEFAULT_WEB_SCOPES = ["openid", "email", "profile"] as const;

export function emptyOAuthClientFormValues(): OAuthClientFormValues {
  return {
    clientId: "",
    clientName: "",
    description: "",
    applicationCode: undefined,
    grantTypes: ["authorization_code", "refresh_token"],
    redirectUris: [],
    scopes: [...DEFAULT_WEB_SCOPES],
    accessTokenTtl: undefined,
    refreshTokenTtl: undefined,
    authorizationCodeTtl: undefined,
    active: true,
  };
}

function isKnownGrantType(g: string): g is OAuthGrantType {
  return grantTypeSchema.safeParse(g).success;
}

export function toFormValues(dto: OAuthClientDTO): OAuthClientFormValues {
  return {
    clientId: dto.clientId,
    clientName: dto.clientName ?? "",
    description: dto.description ?? "",
    applicationCode: dto.applicationCode,
    // Spread first: filter on the SDK's `OAuthGrantType[] | string[]` union
    // drops the type guard.
    grantTypes: [...dto.grantTypes].filter(isKnownGrantType),
    redirectUris: [...dto.redirectUris],
    scopes: [...dto.scopes],
    accessTokenTtl: dto.accessTokenTtl,
    refreshTokenTtl: dto.refreshTokenTtl,
    authorizationCodeTtl: dto.authorizationCodeTtl,
    active: dto.active,
  };
}

function editableFields(values: OAuthClientFormValues) {
  const usesRedirects = values.grantTypes.includes("authorization_code");
  return {
    clientName: values.clientName.trim(),
    description: values.description.trim() || undefined,
    applicationCode: values.applicationCode || undefined,
    grantTypes: [...values.grantTypes],
    // Hidden section ⇒ no hidden config: a client without authorization_code
    // carries no redirect URIs.
    redirectUris: usesRedirects ? [...values.redirectUris] : [],
    scopes: [...values.scopes],
    accessTokenTtl: values.accessTokenTtl,
    refreshTokenTtl: values.refreshTokenTtl,
    authorizationCodeTtl: values.authorizationCodeTtl,
  };
}

export function toCreateRequest(
  values: OAuthClientFormValues,
): OAuthClientInput {
  return {
    clientId: values.clientId.trim(),
    ...editableFields(values),
    active: values.active,
  };
}

export function toUpdateRequest(
  dto: OAuthClientDTO,
  values: OAuthClientFormValues,
): OAuthClientInput {
  // Start from the full DTO (keeps requirePkce, postLogoutRedirectUris), but
  // drop the numeric id: the application travels as a code and the server
  // action resolves it.
  const { applicationId: _applicationId, ...base } = toOAuthClientRequest(dto);
  const fields = editableFields(values);
  // Grant types the form doesn't know (toFormValues filters them out) must
  // survive a save — PUT is full replacement.
  const unknownGrants = dto.grantTypes.filter((g) => !isKnownGrantType(g));
  return {
    ...base,
    ...fields,
    grantTypes: [...fields.grantTypes, ...unknownGrants],
    // `active` stays whatever the server has: activation is a separate
    // danger-zone action and never rides along with a save (spec §4.7).
    active: dto.active,
    clientId: dto.clientId, // immutable
  };
}
