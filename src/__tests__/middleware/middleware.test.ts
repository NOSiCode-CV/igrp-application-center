// Mock heavy module-level deps before importing @/middleware
vi.mock("@/lib/auth-instance", () => ({
  auth: {
    isAuthDisabled: vi.fn(() => false),
    isPreviewMode: vi.fn(() => false),
    getTokenFromRequest: vi.fn(),
    isTokenExpiredOrFailed: vi.fn(() => false),
    isEndedByHostLogout: vi.fn(() => false),
    resolveAppUrl: vi.fn(
      (path: string, request: Request) => new URL(path, request.url),
    ),
    getLoginRedirectUrl: vi.fn(
      (request: Request) => new URL("/login", request.url),
    ),
    config: {},
  },
}));
vi.mock("@/lib/logout-pending", () => ({
  LOGOUT_PENDING_COOKIE: "logout_pending",
}));

import { NextRequest } from "next/server";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth as authMock } from "@/lib/auth-instance";
import { middleware } from "@/middleware";

// Cast to get typed mock helpers
const auth = authMock as unknown as {
  isAuthDisabled: ReturnType<typeof vi.fn>;
  isPreviewMode: ReturnType<typeof vi.fn>;
  getTokenFromRequest: ReturnType<typeof vi.fn>;
  isTokenExpiredOrFailed: ReturnType<typeof vi.fn>;
  isEndedByHostLogout: ReturnType<typeof vi.fn>;
  config: Record<string, unknown>;
};

const req = (path: string) =>
  new NextRequest(new URL(`http://localhost${path}`));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(auth.isAuthDisabled).mockReturnValue(false);
  vi.mocked(auth.isPreviewMode).mockReturnValue(false);
  vi.mocked(auth.isTokenExpiredOrFailed).mockReturnValue(false);
  vi.mocked(auth.isEndedByHostLogout).mockReturnValue(false);
});

describe("middleware auth gate", () => {
  it("in bypass mode redirects /login to /", async () => {
    // middleware gates on isAuthBypass() from @/lib/utilities, which reads
    // process.env at call time — not on auth.isPreviewMode().
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    const res = await middleware(req("/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
    vi.unstubAllEnvs();
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

  it("sends a session another co-hosted app logged out to /login?reason=session_ended", async () => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({ sub: "u1" });
    vi.mocked(auth.isEndedByHostLogout).mockReturnValue(true);
    const res = await middleware(req("/settings/users"));
    const location = new URL(
      res.headers.get("location") ?? "",
      "http://localhost",
    );
    expect(location.pathname).toBe("/login");
    expect(location.searchParams.get("reason")).toBe("session_ended");
  });
});

// Session-first: the token's locale (the user's profile) rewrites a stale
// IGRP_LOCALE cookie, so sessionless pages (login after logout) follow it.
describe("locale cookie", () => {
  const withToken = (locale: string, cookie?: string, https = false) => {
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({
      sub: "u1",
      locale,
    });
    const r = new NextRequest(new URL("http://localhost/settings/users"), {
      headers: https ? { "x-forwarded-proto": "https" } : {},
    });
    if (cookie) r.cookies.set("IGRP_LOCALE", cookie);
    return middleware(r);
  };

  it("rewrites a stale locale cookie from the token", async () => {
    const res = await withToken("en", "pt", true);
    expect(res.headers.get("location")).toBeNull();
    expect(res.cookies.get("IGRP_LOCALE")).toMatchObject({
      value: "en",
      secure: true,
    });
  });

  it("normalizes a regional token locale", async () => {
    const res = await withToken("pt-CV");
    expect(res.cookies.get("IGRP_LOCALE")?.value).toBe("pt");
  });

  it("ignores an unsupported token locale", async () => {
    const res = await withToken("es", "fr");
    expect(res.cookies.get("IGRP_LOCALE")).toBeUndefined();
  });
});

describe("security headers (production)", () => {
  it("sets HSTS and disables the legacy XSS auditor in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(auth.getTokenFromRequest).mockResolvedValue({ sub: "u1" });
    const res = await middleware(req("/settings/users"));
    expect(res.headers.get("Strict-Transport-Security")).toContain("max-age=");
    expect(res.headers.get("X-XSS-Protection")).toBe("0");
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
