import type {
  OAuthClientDTO,
  OAuthClientRequestDTO,
} from "@igrp/platform-access-management-client-ts";

/**
 * PUT /api/clients/{id} replaces the whole client. Build the request from the
 * loaded DTO so fields the UI does not edit (requirePkce,
 * postLogoutRedirectUris) survive every save. Never copies clientSecret.
 */
export function toOAuthClientRequest(
  dto: OAuthClientDTO,
): OAuthClientRequestDTO {
  return {
    clientId: dto.clientId,
    clientName: dto.clientName ?? dto.clientId,
    description: dto.description,
    active: dto.active,
    requirePkce: dto.requirePkce,
    applicationId: dto.applicationId,
    accessTokenTtl: dto.accessTokenTtl,
    refreshTokenTtl: dto.refreshTokenTtl,
    authorizationCodeTtl: dto.authorizationCodeTtl,
    scopes: [...dto.scopes],
    redirectUris: [...dto.redirectUris],
    postLogoutRedirectUris: dto.postLogoutRedirectUris
      ? [...dto.postLogoutRedirectUris]
      : undefined,
    grantTypes: [...dto.grantTypes],
  };
}

export function withActive(
  dto: OAuthClientDTO,
  active: boolean,
): OAuthClientRequestDTO {
  return { ...toOAuthClientRequest(dto), active };
}

/**
 * What the UI sends to createOAuthClient/updateOAuthClient: the application is
 * named by its code; the server action resolves it to the SDK's numeric id.
 */
export type OAuthClientInput = Omit<OAuthClientRequestDTO, "applicationId"> & {
  applicationCode?: string;
};
