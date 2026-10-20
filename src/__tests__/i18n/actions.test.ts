// setLocale wraps the framework's igrpSetLocale. Cookie-first since a331515:
// no `persistLocale`, so nothing is written to the profile — validate, then
// write the IGRP_LOCALE cookie.

import { igrpLocaleCookieOptions } from "@igrp/framework-next/i18n";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieSet = vi.fn();
const requestHeaders = new Headers();

vi.mock("next/headers", () => ({
  cookies: async () => ({ set: cookieSet }),
  headers: async () => requestHeaders,
}));
vi.mock("@/lib/dal", () => ({ getLayoutConfig: async () => ({}) }));

import { setLocale } from "@/i18n/actions";

beforeEach(() => {
  vi.clearAllMocks();
  requestHeaders.delete("x-forwarded-proto");
});

describe("setLocale", () => {
  it("rejects an unsupported locale without side effects", async () => {
    const result = await setLocale("de");
    expect(result).toMatchObject({ success: false, status: 400 });
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("writes only the cookie and reports it as not persisted", async () => {
    const result = await setLocale("fr");
    expect(result).toEqual({
      success: true,
      data: { locale: "fr", persisted: false },
    });
    expect(cookieSet).toHaveBeenCalledWith(
      "IGRP_LOCALE",
      "fr",
      igrpLocaleCookieOptions(false),
    );
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
