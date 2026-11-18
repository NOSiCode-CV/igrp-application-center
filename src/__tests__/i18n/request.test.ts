// FE-2 (FR-12): per-key fallback requested → module default (pt) → key + warning.

import { createTranslator } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  // Return the factory itself so the test can invoke it.
  getRequestConfig: <T>(factory: T) => factory,
}));
vi.mock("next/headers", () => ({
  cookies: async () => new Map([["IGRP_LOCALE", { value: "en" }]]),
  headers: async () => new Headers(),
}));
vi.mock("@/lib/dal", () => ({ getLayoutConfig: async () => ({}) }));

import {
  type IGRPFrameworkMessages,
  igrpDeepMergeMessages,
  igrpMergeMessages,
} from "@igrp/framework-next/i18n/messages";
import {
  igrpGetMessageFallback,
  igrpOnIntlError,
} from "@igrp/framework-next/i18n/server";

import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";
import requestConfig from "@/i18n/request";

const PT = {
  users: {
    title: "Utilizadores",
    invite: { submit: "Enviar convite", cancel: "Cancelar" },
  },
};
const FR_PART = { users: { invite: { submit: "Envoyer l'invitation" } } };

afterEach(() => {
  vi.restoreAllMocks();
});

describe("igrpDeepMergeMessages", () => {
  it("returns the requested value when present and pt when missing", () => {
    const merged = igrpDeepMergeMessages(PT, FR_PART) as typeof PT;
    expect(merged.users.invite.submit).toBe("Envoyer l'invitation");
    expect(merged.users.invite.cancel).toBe("Cancelar");
    expect(merged.users.title).toBe("Utilizadores");
  });

  it("does not mutate its inputs", () => {
    igrpDeepMergeMessages(PT, FR_PART) as typeof PT;
    expect(PT.users.invite.submit).toBe("Enviar convite");
  });
});

describe("translator with the merged catalog", () => {
  const t = createTranslator({
    locale: "fr",
    messages: igrpDeepMergeMessages(PT, FR_PART),
    onError: igrpOnIntlError,
    getMessageFallback: igrpGetMessageFallback,
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

describe("igrpMergeMessages", () => {
  it("returns the complete pt catalog for pt", () => {
    expect(
      igrpMergeMessages({ defaultLocale: "pt" }, "pt", { pt, en, fr }).common,
    ).toMatchObject(pt.common);
  });

  it("merges fr over pt", () => {
    const merged = igrpMergeMessages({ defaultLocale: "pt" }, "fr", {
      pt,
      en,
      fr,
    }) as typeof pt;
    expect(merged.common.actions.backHome).toBe("Retour à l’accueil");
    expect(merged.errors.unexpected.title).toBe(
      "Une erreur inattendue s’est produite.",
    );
  });
});

describe("request config", () => {
  it("resolves the locale (cookie) and serves merged messages with the framework fallback handlers", async () => {
    const factory = requestConfig as unknown as () => Promise<{
      locale: string;
      messages: typeof pt;
      onError: unknown;
      getMessageFallback: unknown;
    }>;
    const config = await factory();
    expect(config.locale).toBe("en");
    expect(
      (config.messages as unknown as IGRPFrameworkMessages).i18n.localeSwitcher
        .label,
    ).toBe("Language");
    expect(config.messages.errors.unexpected.title).toBe(
      "An unexpected error occurred.",
    );
    expect(config.onError).toBe(igrpOnIntlError);
    expect(config.getMessageFallback).toBe(igrpGetMessageFallback);
  });
});
