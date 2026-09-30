// FE-2 (FR-12): per-key fallback requested → module default (pt) → key + warning.

import { createTranslator } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  // Return the factory itself so the test can invoke it.
  getRequestConfig: <T>(factory: T) => factory,
}));
const resolveLocale = vi.fn();
vi.mock("@/i18n/resolve-locale", () => ({
  resolveLocale: () => resolveLocale(),
}));

import { getMessageFallback, onIntlError } from "@/i18n/fallback";
import { deepMerge, getMessagesFor } from "@/i18n/messages";
import pt from "@/i18n/messages/pt.json";
import requestConfig from "@/i18n/request";

const PT = {
  users: {
    title: "Utilizadores",
    invite: { submit: "Enviar convite", cancel: "Cancelar" },
  },
};
const FR = { users: { invite: { submit: "Envoyer l'invitation" } } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("deepMerge", () => {
  it("returns the requested value when present and pt when missing", () => {
    const merged = deepMerge(PT, FR);
    expect(merged.users.invite.submit).toBe("Envoyer l'invitation");
    expect(merged.users.invite.cancel).toBe("Cancelar");
    expect(merged.users.title).toBe("Utilizadores");
  });

  it("does not mutate its inputs", () => {
    deepMerge(PT, FR);
    expect(PT.users.invite.submit).toBe("Enviar convite");
  });
});

describe("translator with the merged catalog", () => {
  const t = createTranslator({
    locale: "fr",
    messages: deepMerge(PT, FR),
    onError: onIntlError,
    getMessageFallback,
  });

  it("uses the fr value, then the pt value", () => {
    // biome-ignore lint/suspicious/noExplicitAny: ad-hoc fixture catalog, not AppConfig.Messages
    const tt = t as any;
    expect(tt("users.invite.submit")).toBe("Envoyer l'invitation");
    expect(tt("users.invite.cancel")).toBe("Cancelar");
  });

  it("returns the key and warns when absent from both files", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    // biome-ignore lint/suspicious/noExplicitAny: key intentionally missing
    expect((t as any)("users.invite.missingKey")).toBe(
      "users.invite.missingKey",
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]?.[0])).toContain(
      "users.invite.missingKey",
    );
  });
});

describe("getMessagesFor", () => {
  it("returns the complete pt catalog for pt", () => {
    expect(getMessagesFor("pt")).toEqual(pt);
  });

  it("merges fr over pt, keeping pt keys missing in fr", () => {
    const fr = getMessagesFor("fr");
    expect(fr.i18n.localeSwitcher.label).toBe("Langue");
    expect(fr.errors.unexpected.title).toBe(pt.errors.unexpected.title);
  });
});

describe("request config", () => {
  it("resolves the locale and serves merged messages with the fallback handlers", async () => {
    resolveLocale.mockResolvedValue("en");
    const factory = requestConfig as unknown as () => Promise<{
      locale: string;
      messages: typeof pt;
      onError: unknown;
      getMessageFallback: unknown;
    }>;
    const config = await factory();
    expect(config.locale).toBe("en");
    expect(config.messages.i18n.localeSwitcher.label).toBe("Language");
    expect(config.messages.errors.unexpected.title).toBe(
      pt.errors.unexpected.title,
    );
    expect(config.onError).toBe(onIntlError);
    expect(config.getMessageFallback).toBe(getMessageFallback);
  });
});
