import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  emptyOAuthClientFormValues,
  oauthClientFormSchema,
  toCreateRequest,
  toFormValues,
  toUpdateRequest,
} from "@/features/oauth-clients/oauth-client-schemas";

const valid = {
  ...emptyOAuthClientFormValues(),
  clientId: "my-invoice",
  clientName: "Invoice App",
  redirectUris: ["https://invoice.gov.cv/cb"],
};

function issues(values: unknown) {
  const r = oauthClientFormSchema.safeParse(values);
  return r.success
    ? []
    : r.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
}

describe("oauthClientFormSchema", () => {
  it("accepts a valid web client", () => {
    expect(issues(valid)).toEqual([]);
  });

  it.each(["My-Invoice", "my_invoice", "-lead", "trail-", "a--b", ""])(
    "rejects clientId %j",
    (clientId) => {
      expect(
        issues({ ...valid, clientId }).some((m) => m.startsWith("clientId")),
      ).toBe(true);
    },
  );

  it("requires a redirect URI when authorization_code is selected", () => {
    expect(issues({ ...valid, redirectUris: [] })).toContain(
      "redirectUris: Adicione pelo menos um URI de redirecionamento.",
    );
  });

  it("does not require redirect URIs for a machine client", () => {
    expect(
      issues({
        ...valid,
        grantTypes: ["client_credentials"],
        redirectUris: [],
        scopes: [],
      }),
    ).toEqual([]);
  });

  it("rejects plain http outside localhost", () => {
    expect(
      issues({ ...valid, redirectUris: ["http://invoice.gov.cv/cb"] }),
    ).toContain(
      "redirectUris: «http://invoice.gov.cv/cb» não é permitido. Use https:// (ou http://localhost).",
    );
  });

  it("requires at least one grant type", () => {
    expect(issues({ ...valid, grantTypes: [] })).toContain(
      "grantTypes: Escolha pelo menos um grant type.",
    );
  });

  it("caps description at 140 characters", () => {
    expect(issues({ ...valid, description: "x".repeat(141) })).toContain(
      "description: Até 140 caracteres.",
    );
  });

  it("rejects non-integer or non-positive TTLs", () => {
    expect(issues({ ...valid, accessTokenTtl: 0 }).length).toBe(1);
    expect(issues({ ...valid, accessTokenTtl: 1.5 }).length).toBe(1);
    expect(issues({ ...valid, accessTokenTtl: undefined })).toEqual([]);
  });
});

describe("mapping", () => {
  const dto: OAuthClientDTO = {
    id: "u1",
    clientId: "my-invoice",
    clientName: "Invoice App",
    active: true,
    requirePkce: true,
    applicationId: 7,
    applicationCode: "INV",
    accessTokenTtl: 180,
    refreshTokenTtl: 86400,
    authorizationCodeTtl: 60,
    scopes: ["openid"],
    redirectUris: ["https://a.gov.cv/cb"],
    postLogoutRedirectUris: ["https://a.gov.cv/"],
    grantTypes: ["authorization_code"],
  };

  it("round-trips a DTO through form values", () => {
    expect(toFormValues(dto)).toEqual({
      clientId: "my-invoice",
      clientName: "Invoice App",
      description: "",
      applicationCode: "INV",
      grantTypes: ["authorization_code"],
      redirectUris: ["https://a.gov.cv/cb"],
      scopes: ["openid"],
      accessTokenTtl: 180,
      refreshTokenTtl: 86400,
      authorizationCodeTtl: 60,
      active: true,
    });
  });

  it("update keeps clientId, requirePkce and postLogoutRedirectUris from the DTO", () => {
    const req = toUpdateRequest(dto, {
      ...toFormValues(dto),
      clientId: "tampered",
      clientName: "Renamed",
    });
    expect(req.clientId).toBe("my-invoice");
    expect(req.clientName).toBe("Renamed");
    expect(req.requirePkce).toBe(true);
    expect(req.postLogoutRedirectUris).toEqual(["https://a.gov.cv/"]);
  });

  it("names the application by code, never by id", () => {
    const req = toUpdateRequest(dto, {
      ...toFormValues(dto),
      applicationCode: "CAD",
    });
    expect(req.applicationCode).toBe("CAD");
    expect("applicationId" in req).toBe(false);
    expect("applicationId" in toCreateRequest(valid)).toBe(false);
  });

  it("drops redirect URIs when authorization_code is not selected", () => {
    const values = {
      ...toFormValues(dto),
      grantTypes: ["client_credentials" as const],
    };
    expect(toCreateRequest(values).redirectUris).toEqual([]);
    expect(toUpdateRequest(dto, values).redirectUris).toEqual([]);
  });

  it("omits blank description and empty TTLs so the server defaults apply", () => {
    const req = toCreateRequest(valid);
    expect(req.description).toBeUndefined();
    expect(req.accessTokenTtl).toBeUndefined();
  });
});
