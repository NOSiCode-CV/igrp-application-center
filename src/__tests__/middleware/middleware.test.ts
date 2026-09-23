// Mock heavy module-level deps before importing @/middleware
vi.mock("@/lib/auth", () => ({
  auth: {
    isAuthDisabled: vi.fn(() => false),
    isPreviewMode: vi.fn(() => false),
    getTokenFromRequest: vi.fn(),
    isTokenExpiredOrFailed: vi.fn(() => false),
    config: {},
  },
}));
vi.mock("@/lib/logout-pending", () => ({
  LOGOUT_PENDING_COOKIE: "logout_pending",
}));

import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth as authMock } from "@/lib/auth";
import { middleware } from "@/middleware";

// Cast to get typed mock helpers
const auth = authMock as unknown as {
  isAuthDisabled: ReturnType<typeof vi.fn>;
  isPreviewMode: ReturnType<typeof vi.fn>;
  getTokenFromRequest: ReturnType<typeof vi.fn>;
  isTokenExpiredOrFailed: ReturnType<typeof vi.fn>;
  config: Record<string, unknown>;
};

const req = (path: string) =>
  new NextRequest(new URL(`http://localhost${path}`));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.isAuthDisabled).mockReturnValue(false);
  vi.mocked(auth.isPreviewMode).mockReturnValue(false);
  vi.mocked(auth.isTokenExpiredOrFailed).mockReturnValue(false);
});

describe("middleware auth gate", () => {
  it("in bypass mode redirects /login to /", async () => {
    vi.mocked(auth.isPreviewMode).mockReturnValue(true);
    const res = await middleware(req("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
  });

  it("redirects to /login when no token on a protected route", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue(null);
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("location")).toContain("/login");
  });

  it("passes a valid token through without redirecting", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    // NextResponse.next() → no redirect
    expect(res.headers.get("location")).toBeNull();
  });
});

describe("locale cookie sync (FR-27)", () => {
  const withCookie = (path: string, cookie: string) => {
    const r = req(path);
    r.cookies.set("IGRP_LOCALE", cookie);
    return r;
  };

  it("rewrites IGRP_LOCALE when the session locale differs", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({
      sub: "u1",
      locale: "en",
    });
    const res = await middleware(withCookie("/settings/users", "fr"));
    expect(res.headers.get("location")).toBeNull();
    const cookie = res.cookies.get("IGRP_LOCALE");
    expect(cookie?.value).toBe("en");
    expect(cookie?.path).toBe("/");
    expect(cookie?.sameSite).toBe("lax");
  });

  it("leaves the cookie alone when it already matches", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({
      sub: "u1",
      locale: "en",
    });
    const res = await middleware(withCookie("/settings/users", "en"));
    expect(res.cookies.get("IGRP_LOCALE")).toBeUndefined();
  });

  it("does nothing when the session has no (valid) locale", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({
      sub: "u1",
      locale: "de",
    });
    const res = await middleware(withCookie("/settings/users", "fr"));
    expect(res.cookies.get("IGRP_LOCALE")).toBeUndefined();
  });

  it("never touches the cookie on public paths", async () => {
    const res = await middleware(withCookie("/login", "fr"));
    expect(auth.getTokenFromRequest).not.toHaveBeenCalled();
    expect(res.cookies.get("IGRP_LOCALE")).toBeUndefined();
  });
});

describe("security headers (production)", () => {
  it("sets HSTS and omits the deprecated X-XSS-Protection in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(res.headers.get("X-XSS-Protection")).toBeNull();
    vi.unstubAllEnvs();
  });

  it("ships a Report-Only CSP in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    auth.getTokenFromRequest.mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("Content-Security-Policy-Report-Only")).toContain(
      "default-src 'self'",
    );
    expect(res.headers.get("Content-Security-Policy")).toBeNull();
    vi.unstubAllEnvs();
  });
});
