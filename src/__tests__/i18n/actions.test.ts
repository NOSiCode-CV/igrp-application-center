// setLocale wraps the framework's igrpSetLocale. Session-first: with a
// session, `persistLocale` saves the choice to the profile before the
// IGRP_LOCALE cookie is written; without one (or under bypass) only the cookie
// is written.

import { igrpLocaleCookieOptions } from "@igrp/framework-next/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookieSet, serverSession, isAuthBypass, updateCurrentUserLocale } =
  vi.hoisted(() => ({
    cookieSet: vi.fn(),
    serverSession: vi.fn(),
    isAuthBypass: vi.fn(() => false),
    updateCurrentUserLocale: vi.fn(),
  }));
const requestHeaders = new Headers();
const SESSION = { user: { name: "Ana" }, accessToken: "t" };

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
  headers: async () => requestHeaders,
}));
// The global setup stubs next/navigation; igrpSetLocale needs the real
// `unstable_rethrow` for its persistLocale failure path.
vi.mock("next/navigation", (importOriginal) => importOriginal());
vi.mock("@/lib/dal", () => ({ getLayoutConfig: async () => ({}) }));
vi.mock("@/lib/auth", () => ({ serverSession: () => serverSession() }));
vi.mock("@/lib/utilities", () => ({ isAuthBypass: () => isAuthBypass() }));
vi.mock("@/actions/access-client", () => ({
  updateCurrentUserLocale: (locale: string) => updateCurrentUserLocale(locale),
}));

import { setLocale } from "@/i18n/actions";

beforeEach(() => {
  vi.clearAllMocks();
  requestHeaders.delete("x-forwarded-proto");
  serverSession.mockResolvedValue(null);
  isAuthBypass.mockReturnValue(false);
  updateCurrentUserLocale.mockResolvedValue(undefined);
});

describe("setLocale", () => {
  it("rejects an unsupported locale without side effects", async () => {
    const result = await setLocale("de");
    expect(result).toMatchObject({ success: false, status: 400 });
    expect(cookieSet).not.toHaveBeenCalled();
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
  });

  it("anonymous change writes the cookie only", async () => {
    const result = await setLocale("en");
    expect(result).toEqual({
      success: true,
      data: { locale: "en", persisted: false },
    });
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
    expect(cookieSet).toHaveBeenCalledWith(
      "IGRP_LOCALE",
      "en",
      igrpLocaleCookieOptions(false),
    );
  });

  it("bypass mode never calls the API", async () => {
    isAuthBypass.mockReturnValue(true);
    serverSession.mockResolvedValue(SESSION);
    const result = await setLocale("en");
    expect(result).toEqual({
      success: true,
      data: { locale: "en", persisted: false },
    });
    expect(updateCurrentUserLocale).not.toHaveBeenCalled();
  });

  it("signed-in change saves to the profile", async () => {
    serverSession.mockResolvedValue(SESSION);
    const result = await setLocale("en");
    expect(updateCurrentUserLocale).toHaveBeenCalledWith("en");
    expect(result).toEqual({
      success: true,
      data: { locale: "en", persisted: true },
    });
    expect(cookieSet).toHaveBeenCalledWith(
      "IGRP_LOCALE",
      "en",
      igrpLocaleCookieOptions(false),
    );
  });

  it("API failure changes nothing", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    serverSession.mockResolvedValue(SESSION);
    updateCurrentUserLocale.mockRejectedValue(new Error("boom"));
    const result = await setLocale("en");
    expect(result).toMatchObject({ success: false, status: 500 });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("normalizes regional tags", async () => {
    await setLocale("en-GB");
    expect(cookieSet).toHaveBeenCalledWith(
      "IGRP_LOCALE",
      "en",
      igrpLocaleCookieOptions(false),
    );
  });

  it("marks the cookie secure behind an https proxy", async () => {
    requestHeaders.set("x-forwarded-proto", "https");
    await setLocale("pt");
    expect(cookieSet).toHaveBeenCalledWith(
      "IGRP_LOCALE",
      "pt",
      igrpLocaleCookieOptions(true),
    );
  });
});
