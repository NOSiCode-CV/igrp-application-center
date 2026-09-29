// FE-1 (FR-6, FR-8): resolution priority session > cookie > Accept-Language >
// platform default; regional tags normalized; unsupported values ignored.

import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionLocale = vi.fn<() => Promise<string | undefined>>();
const cookieGet = vi.fn<(name: string) => { value: string } | undefined>();
const headerGet = vi.fn<(name: string) => string | null>();

vi.mock("@/lib/auth", () => ({ getSessionLocale: () => getSessionLocale() }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: cookieGet }),
  headers: async () => ({ get: headerGet }),
}));

import { normalizeLocale } from "@/i18n/config";
import {
  parseAcceptLanguage,
  pickLocale,
  resolveLocale,
} from "@/i18n/resolve-locale";

beforeEach(() => {
  vi.clearAllMocks();
  getSessionLocale.mockResolvedValue(undefined);
  cookieGet.mockReturnValue(undefined);
  headerGet.mockReturnValue(null);
});

describe("normalizeLocale", () => {
  it.each([
    ["pt", "pt"],
    ["pt-CV", "pt"],
    ["pt_PT", "pt"],
    ["PT-br", "pt"],
    ["en-GB", "en"],
    ["fr-FR", "fr"],
  ])("maps %s to %s", (tag, expected) => {
    expect(normalizeLocale(tag)).toBe(expected);
  });

  it.each([["de"], ["de-DE"], [""], [undefined], [null], [42]])(
    "rejects %s",
    (tag) => {
      expect(normalizeLocale(tag)).toBeUndefined();
    },
  );
});

describe("parseAcceptLanguage", () => {
  it("picks the first supported tag by q-value", () => {
    expect(parseAcceptLanguage("fr-FR,fr;q=0.9,en;q=0.8")).toBe("fr");
    expect(parseAcceptLanguage("en;q=0.5,fr;q=0.9")).toBe("fr");
  });

  it("skips unsupported tags, wildcards and q=0", () => {
    expect(parseAcceptLanguage("de-DE,de;q=0.9,en;q=0.1")).toBe("en");
    expect(parseAcceptLanguage("*,fr;q=0.2")).toBe("fr");
    expect(parseAcceptLanguage("fr;q=0,en;q=0.3")).toBe("en");
  });

  it("returns undefined when nothing is supported", () => {
    expect(parseAcceptLanguage("de")).toBeUndefined();
    expect(parseAcceptLanguage("")).toBeUndefined();
    expect(parseAcceptLanguage(null)).toBeUndefined();
  });
});

describe("pickLocale", () => {
  it("session wins over cookie and Accept-Language", () => {
    expect(
      pickLocale({ session: "en", cookie: "fr", acceptLanguage: "pt" }),
    ).toBe("en");
  });

  it("cookie wins over Accept-Language", () => {
    expect(pickLocale({ cookie: "fr-FR", acceptLanguage: "en" })).toBe("fr");
  });

  it("Accept-Language is used when there is no session or cookie", () => {
    expect(pickLocale({ acceptLanguage: "fr-FR,fr;q=0.9" })).toBe("fr");
  });

  it("falls back to the platform default (pt)", () => {
    expect(pickLocale({})).toBe("pt");
    expect(pickLocale({ acceptLanguage: "de" })).toBe("pt");
  });

  it("ignores unsupported candidates and moves down the chain", () => {
    expect(
      pickLocale({ session: "de", cookie: "xx", acceptLanguage: "en-US" }),
    ).toBe("en");
  });
});

describe("resolveLocale (request)", () => {
  it("reads session, cookie and Accept-Language from the request", async () => {
    getSessionLocale.mockResolvedValue("en");
    cookieGet.mockReturnValue({ value: "fr" });
    headerGet.mockReturnValue("pt-PT");
    await expect(resolveLocale()).resolves.toBe("en");
    expect(cookieGet).toHaveBeenCalledWith("IGRP_LOCALE");
    expect(headerGet).toHaveBeenCalledWith("accept-language");
  });

  it("uses the cookie when there is no session", async () => {
    cookieGet.mockReturnValue({ value: "fr" });
    headerGet.mockReturnValue("en");
    await expect(resolveLocale()).resolves.toBe("fr");
  });

  it("uses Accept-Language with no cookie and no session", async () => {
    headerGet.mockReturnValue("fr-FR,fr;q=0.9");
    await expect(resolveLocale()).resolves.toBe("fr");
  });

  it("uses the platform default for an unsupported browser language", async () => {
    headerGet.mockReturnValue("de");
    await expect(resolveLocale()).resolves.toBe("pt");
  });
});
