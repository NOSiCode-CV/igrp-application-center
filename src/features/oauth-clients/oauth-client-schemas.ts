import type {
  OAuthClientDTO,
  OAuthGrantType,
} from "@igrp/platform-access-management-client-ts";
import type { Messages } from "next-intl";
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

/**
 * Translator for `oauthClients.validation.*`, satisfied by
 * `useTranslations("oauthClients.validation")`.
 */
export type OAuthClientsValidationTranslator = (
  key: keyof Messages["oauthClients"]["validation"],
  values?: Record<string, string>,
) => string;

/** Validation messages come from the catalog, so the schema is built per translator. */
export function makeOAuthClientSchemas(t: OAuthClientsValidationTranslator) {
  const ttlSchema = z
    .number({ error: t("ttlInteger") })
    .int(t("ttlInteger"))
    .positive(t("ttlInteger"))
    .optional();

  const oauthClientFormSchema = z
    .object({
      clientId: z
        .string()
        .trim()
        .min(1, t("clientIdRequired"))
        .max(100, t("clientIdMax"))
        .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, t("clientIdPattern")),
      clientName: z
        .string()
        .trim()
        .min(1, t("nameRequired"))
        .max(255, t("nameMax")),
      description: z.string().trim().max(140, t("descriptionMax")),
      // IGRPCombobox emits "" when the selected option is picked again.
      applicationCode: z.string().trim().optional(),
      grantTypes: z.array(grantTypeSchema).min(1, t("grantTypesRequired")),
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
          message: t("redirectRequired"),
        });
      }
      for (const uri of v.redirectUris) {
        if (!isAllowedRedirectUri(uri)) {
          ctx.addIssue({
            code: "custom",
            path: ["redirectUris"],
            message: t("redirectNotAllowed", { uri }),
          });
        }
      }
    });

  return { oauthClientFormSchema };
}

export type OAuthClientFormValues = z.infer<
  ReturnType<typeof makeOAuthClientSchemas>["oauthClientFormSchema"]
>;

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
