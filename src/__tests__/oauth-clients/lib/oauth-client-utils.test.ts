import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import {
  findLinkedServiceAccount,
  formatSeconds,
  getClientKind,
  isAllowedRedirectUri,
} from "@/features/oauth-clients/lib/oauth-client-utils";

describe("getClientKind", () => {
  it("is web when authorization_code is present", () => {
    expect(getClientKind(["authorization_code", "refresh_token"])).toBe("web");
  });
  it("is machine otherwise", () => {
    expect(getClientKind(["client_credentials"])).toBe("machine");
    expect(getClientKind([])).toBe("machine");
  });
});

describe("isAllowedRedirectUri", () => {
  it.each([
    "https://invoice.gov.cv/api/auth/callback/igrp-auth",
    "http://localhost:3000/callback",
    "http://localhost/callback",
    "http://127.0.0.1:8080/cb",
  ])("allows %s", (uri) => expect(isAllowedRedirectUri(uri)).toBe(true));

  it.each([
    "http://invoice.gov.cv/callback",
    "ftp://x.y",
    "not a url",
    "",
    "http://localhost.evil.com/cb",
  ])("rejects %s", (uri) => expect(isAllowedRedirectUri(uri)).toBe(false));
});

describe("formatSeconds", () => {
  it.each([
    [60, "1 minuto"],
    [180, "3 minutos"],
    [3600, "1 hora"],
    [7200, "2 horas"],
    [86400, "1 dia"],
    [2592000, "30 dias"],
    [45, "45 segundos"],
    [1, "1 segundo"],
    [90, "90 segundos"],
  ])("formats %i as %s", (s, text) => expect(formatSeconds(s)).toBe(text));

  it("returns empty for missing or non-positive values", () => {
    expect(formatSeconds(undefined)).toBe("");
    expect(formatSeconds(0)).toBe("");
    expect(formatSeconds(Number.NaN)).toBe("");
  });
});

describe("findLinkedServiceAccount", () => {
  const sa = (id: string, oauthClientId: string) =>
    ({
      id,
      oauthClientId,
      name: id,
      active: true,
      clientId: "c",
    }) as ServiceAccountDTO;

  it("finds the single linked account", () => {
    const r = findLinkedServiceAccount([sa("a", "c1"), sa("b", "c2")], "c2");
    expect(r.account?.id).toBe("b");
    expect(r.duplicate).toBe(false);
  });
  it("flags a 1:1 violation", () => {
    const r = findLinkedServiceAccount([sa("a", "c1"), sa("b", "c1")], "c1");
    expect(r.account?.id).toBe("a");
    expect(r.duplicate).toBe(true);
  });
  it("handles no data", () => {
    expect(findLinkedServiceAccount(undefined, "c1")).toEqual({
      account: undefined,
      duplicate: false,
    });
  });
});
