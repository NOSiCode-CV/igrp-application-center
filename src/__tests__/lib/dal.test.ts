import { beforeEach, describe, expect, it, vi } from "vitest";

const getSession = vi.fn();
const isAuthBypass = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
const headersGet = vi.fn(() => null);

vi.mock("@/lib/auth", () => ({
  getSession: () => getSession(),
  // dal.ts returns this object verbatim in bypass mode.
  PREVIEW_SESSION_STUB: {
    user: { name: "Preview User", email: "preview@example.com" },
    accessToken: "preview-token",
    expires: "9999-12-31T23:59:59.999Z",
  },
}));
vi.mock("@/lib/utilities", () => ({
  isAuthBypass: () => isAuthBypass(),
  sanitizeCallbackUrl: (u: unknown) => (typeof u === "string" ? u : undefined),
}));
vi.mock("next/navigation", () => ({ redirect: (u: string) => redirect(u) }));
vi.mock("next/headers", () => ({
  headers: async () => ({ get: headersGet }),
}));
// configLayout is imported transitively via getLayoutConfig; stub it out.
vi.mock("@/actions/igrp/layout", () => ({ configLayout: vi.fn() }));

import { getAuthenticatedUser, verifySession } from "@/lib/dal";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("verifySession", () => {
  it("returns a stub session in bypass mode without calling getSession", async () => {
    isAuthBypass.mockReturnValue(true);
    const s = await verifySession();
    expect(s.user?.email).toBe("preview@example.com");
    expect(getSession).not.toHaveBeenCalled();
  });

  it("redirects to /login when there is no session", async () => {
    isAuthBypass.mockReturnValue(false);
    getSession.mockResolvedValue(null);
    await expect(verifySession()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("getAuthenticatedUser", () => {
  it("narrows the session to id/name/email/accessToken only", async () => {
    isAuthBypass.mockReturnValue(false);
    getSession.mockResolvedValue({
      user: { id: "u1", name: "Ana", email: "a@x.cv", role: "admin" },
      accessToken: "tok",
      refreshToken: "SECRET",
      expires: "9999-01-01",
    });
    const u = await getAuthenticatedUser();
    expect(u).toEqual({
      id: "u1",
      name: "Ana",
      email: "a@x.cv",
      accessToken: "tok",
    });
    expect(u).not.toHaveProperty("refreshToken");
  });
});
