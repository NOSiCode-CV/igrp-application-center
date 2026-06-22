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

import { describe, expect, it, vi } from "vitest";

import { isAuthUiPath, isPublicPath } from "@/middleware";

describe("isPublicPath", () => {
  it.each([
    "/login",
    "/logout",
    "/api/auth",
    "/api/auth/callback",
    "/_next/x",
    "/favicon.ico",
    "/logo.png",
  ])("treats %s as public/static", (p) => expect(isPublicPath(p)).toBe(true));

  it.each(["/", "/settings/users", "/profile"])("treats %s as protected", (p) =>
    expect(isPublicPath(p)).toBe(false));
});

describe("isAuthUiPath", () => {
  it("matches the auth chrome exactly and by prefix", () => {
    expect(isAuthUiPath("/login")).toBe(true);
    expect(isAuthUiPath("/api/auth/x")).toBe(true);
    expect(isAuthUiPath("/settings")).toBe(false);
  });
});
