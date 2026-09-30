// FE-4 (FR-25, FR-26, FR-11): setLocale validates, writes the cookie and
// persists metadata.locale only when authenticated.

import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
const serverSession = vi.fn();
const isAuthBypass = vi.fn(() => false);
const updateCurrentUserLocale = vi.fn();

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
}));
vi.mock("@/lib/auth", () => ({ serverSession: () => serverSession() }));
vi.mock("@/lib/utils", () => ({ isAuthBypass: () => isAuthBypass() }));
vi.mock("@/actions/access-client", () => ({
  updateCurrentUserLocale: (locale: string) => updateCurrentUserLocale(locale),
}));

import { setLocale } from "@/i18n/actions";

const COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
};

beforeEach(() => {
  vi.clearAllMocks();
  isAuthBypass.mockReturnValue(false);
  serverSession.mockResolvedValue(null);
  updateCurrentUserLocale.mockResolvedValue(undefined);
});

describe("setLocale", () => {
  it("rejects an unsupported locale without side effects", async () => {
    const result = await setLocale("de");
    expect(result).toMatchObject({ success: false, status: 400 });
    expect(cookieSet).not.toHaveBeenCalled();
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
  });

  it("unauthenticated: writes only the cookie", async () => {
    const result = await setLocale("fr");
    expect(result).toEqual({
      success: true,
      data: { locale: "fr", authenticated: false },
    });
    expect(cookieSet).toHaveBeenCalledWith("IGRP_LOCALE", "fr", COOKIE_OPTIONS);
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
  });

  it("normalizes regional tags", async () => {
    await setLocale("en-GB");
    expect(cookieSet).toHaveBeenCalledWith("IGRP_LOCALE", "en", COOKIE_OPTIONS);
  });

  it("authenticated: persists via PUT users/me/locale, then writes the cookie", async () => {
    serverSession.mockResolvedValue({ accessToken: "t" });
    const result = await setLocale("en");
    expect(updateCurrentUserLocale).toHaveBeenCalledWith("en");
    expect(cookieSet).toHaveBeenCalledWith("IGRP_LOCALE", "en", COOKIE_OPTIONS);
    expect(result).toEqual({
      success: true,
      data: { locale: "en", authenticated: true },
    });
  });

  it("authenticated: an API failure leaves the cookie untouched", async () => {
    serverSession.mockResolvedValue({ accessToken: "t" });
    updateCurrentUserLocale.mockRejectedValue({ status: 500 });
    vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await setLocale("fr");
    expect(result).toMatchObject({ success: false, status: 500 });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("bypass mode never calls the API", async () => {
    isAuthBypass.mockReturnValue(true);
    await setLocale("fr");
    expect(serverSession).not.toHaveBeenCalled();
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalled();
  });
});
