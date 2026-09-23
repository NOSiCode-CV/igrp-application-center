// OQ-3 / FR-25: the jwt/session callback extensions carry `locale`
// (OIDC `locale` claim at sign-in, `update({ locale })` afterwards).

import { beforeEach, describe, expect, it, vi } from "vitest";

type Callbacks = {
  jwt: (params: Record<string, unknown>, token: object) => Promise<object>;
  session: (
    params: Record<string, unknown>,
    session: object,
  ) => Promise<object>;
};

const { captured, serverSession, isAuthBypass } = vi.hoisted(() => ({
  captured: {} as { callbacks?: Callbacks },
  serverSession: vi.fn(),
  isAuthBypass: vi.fn(() => false),
}));

vi.mock("@igrp/framework-next-auth/config", () => ({
  withIGRPAuth: (options: { callbacks: Callbacks }) => {
    captured.callbacks = options.callbacks;
    return { serverSession: () => serverSession() };
  },
}));
vi.mock("@igrp/framework-next-auth/providers", () => ({
  assertAuthProviderEnv: vi.fn(),
}));
vi.mock("@igrp/framework-next", () => ({ igrpSetAccessClientConfig: vi.fn() }));
vi.mock("@igrp/framework-next/errors", () => ({ isIgrpError: () => false }));
vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));
vi.mock("@/lib/utils", () => ({ isAuthBypass: () => isAuthBypass() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { getSessionLocale } from "@/lib/auth";

const callbacks = () => captured.callbacks as Callbacks;

beforeEach(() => {
  vi.clearAllMocks();
  isAuthBypass.mockReturnValue(false);
});

describe("jwt callback extension", () => {
  it("seeds token.locale from the OIDC locale claim at sign-in", async () => {
    const token = await callbacks().jwt(
      { account: { provider: "igrp" }, profile: { locale: "fr-FR" } },
      { sub: "u1" },
    );
    expect(token).toEqual({ sub: "u1", locale: "fr" });
  });

  it("ignores an unsupported claim", async () => {
    const token = await callbacks().jwt(
      { account: { provider: "igrp" }, profile: { locale: "de" } },
      { sub: "u1" },
    );
    expect(token).toEqual({ sub: "u1" });
  });

  it("applies update({ locale }) and keeps it otherwise", async () => {
    const updated = await callbacks().jwt(
      { trigger: "update", session: { locale: "en" } },
      { sub: "u1", locale: "pt" },
    );
    expect(updated).toEqual({ sub: "u1", locale: "en" });

    const rejected = await callbacks().jwt(
      { trigger: "update", session: { locale: "xx" } },
      { sub: "u1", locale: "pt" },
    );
    expect(rejected).toEqual({ sub: "u1", locale: "pt" });

    const untouched = await callbacks().jwt({}, { sub: "u1", locale: "pt" });
    expect(untouched).toEqual({ sub: "u1", locale: "pt" });
  });
});

describe("session callback extension", () => {
  it("exposes session.locale from the token", async () => {
    const session = await callbacks().session(
      { token: { locale: "en" }, session: {} },
      { expires: "x" },
    );
    expect(session).toEqual({ expires: "x", locale: "en" });
  });

  it("leaves the session untouched without a valid token locale", async () => {
    const session = await callbacks().session(
      { token: {}, session: {} },
      { expires: "x" },
    );
    expect(session).toEqual({ expires: "x" });
  });
});

describe("getSessionLocale", () => {
  it("returns session.locale", async () => {
    serverSession.mockResolvedValue({ locale: "fr" });
    await expect(getSessionLocale()).resolves.toBe("fr");
  });

  it("returns undefined without a session, in bypass mode or on failure", async () => {
    serverSession.mockResolvedValue(null);
    await expect(getSessionLocale()).resolves.toBeUndefined();

    serverSession.mockRejectedValue(new Error("JWE decryption failed"));
    await expect(getSessionLocale()).resolves.toBeUndefined();

    isAuthBypass.mockReturnValue(true);
    await expect(getSessionLocale()).resolves.toBeUndefined();
  });

  it("rethrows Next's dynamic-rendering bailout", async () => {
    serverSession.mockRejectedValue(
      Object.assign(new Error("dyn"), { digest: "DYNAMIC_SERVER_USAGE" }),
    );
    await expect(getSessionLocale()).rejects.toThrow("dyn");
  });
});
