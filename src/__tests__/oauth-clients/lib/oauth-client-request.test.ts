import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  toOAuthClientRequest,
  withActive,
} from "@/features/oauth-clients/lib/oauth-client-request";
import { toServiceAccountRequest } from "@/features/service-accounts/lib/service-account-request";

const dto: OAuthClientDTO = {
  id: "uuid-1",
  clientId: "my-invoice",
  clientSecret: "must-never-be-sent",
  clientName: "Invoice App",
  description: "Portal",
  active: true,
  requirePkce: false,
  applicationId: 7,
  applicationCode: "INV",
  accessTokenTtl: 180,
  refreshTokenTtl: 86400,
  authorizationCodeTtl: 60,
  scopes: ["openid"],
  redirectUris: ["https://a.gov.cv/cb"],
  postLogoutRedirectUris: ["https://a.gov.cv/"],
  grantTypes: ["authorization_code", "refresh_token"],
  createdAt: "2026-01-01T00:00:00Z",
};

describe("toOAuthClientRequest", () => {
  it("carries every writable field, including ones the UI does not edit", () => {
    expect(toOAuthClientRequest(dto)).toEqual({
      clientId: "my-invoice",
      clientName: "Invoice App",
      description: "Portal",
      active: true,
      requirePkce: false,
      applicationId: 7,
      accessTokenTtl: 180,
      refreshTokenTtl: 86400,
      authorizationCodeTtl: 60,
      scopes: ["openid"],
      redirectUris: ["https://a.gov.cv/cb"],
      postLogoutRedirectUris: ["https://a.gov.cv/"],
      grantTypes: ["authorization_code", "refresh_token"],
    });
  });

  it("never includes the secret or read-only fields", () => {
    const req = toOAuthClientRequest(dto) as unknown as Record<string, unknown>;
    expect(req.clientSecret).toBeUndefined();
    expect(req.id).toBeUndefined();
    expect(req.applicationCode).toBeUndefined();
    expect(req.createdAt).toBeUndefined();
  });

  it("falls back to clientId when clientName is missing", () => {
    expect(
      toOAuthClientRequest({ ...dto, clientName: undefined }).clientName,
    ).toBe("my-invoice");
  });
});

describe("withActive", () => {
  it("only flips active", () => {
    expect(withActive(dto, false)).toEqual({
      ...toOAuthClientRequest(dto),
      active: false,
    });
  });
});

describe("toServiceAccountRequest", () => {
  it("maps the full replacement set", () => {
    const sa: ServiceAccountDTO = {
      id: "sa-1",
      name: "Nightly",
      description: "d",
      active: true,
      oauthClientId: "uuid-1",
      clientId: "etl",
      applicationId: 7,
      applicationCode: "INV",
      roleIds: [1, 2],
      roleCodes: ["a", "b"],
      permissionIds: [9],
      permissionNames: ["p"],
    };
    expect(toServiceAccountRequest(sa)).toEqual({
      name: "Nightly",
      description: "d",
      active: true,
      oauthClientId: "uuid-1",
      applicationId: 7,
      roleIds: [1, 2],
      permissionIds: [9],
    });
  });
});
