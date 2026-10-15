import "server-only";

import { cookies, headers } from "next/headers";

import { getSessionLocale } from "@/lib/auth";

import {
  LOCALE_COOKIE,
  type Locale,
  normalizeLocale,
  PLATFORM_DEFAULT_LOCALE,
} from "./config";

/**
 * Picks the first supported language from an `Accept-Language` header,
 * honouring q-values (`fr-FR,fr;q=0.9,en;q=0.8`). Entries with `q=0`, the `*`
 * wildcard and unsupported languages are skipped. Ties keep header order.
 */
export function parseAcceptLanguage(
  header: string | null | undefined,
): Locale | undefined {
  if (!header) return undefined;

  const entries = header
    .split(",")
    .map((part, index) => {
      const [rawTag, ...params] = part.trim().split(";");
      const qParam = params
        .map((p) => p.trim())
        .find((p) => p.toLowerCase().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.slice(2)) : 1;
      return {
        tag: rawTag?.trim() ?? "",
        q: Number.isFinite(q) ? q : 0,
        index,
      };
    })
    .filter((e) => e.tag && e.tag !== "*" && e.q > 0)
    .sort((a, b) => b.q - a.q || a.index - b.index);

  for (const entry of entries) {
    const locale = normalizeLocale(entry.tag);
    if (locale) return locale;
  }
  return undefined;
}

export type LocaleCandidates = {
  /** `session.locale` — the user's `metadata.locale` (OIDC `locale` claim). */
  session?: string | null;
  /** Value of the `IGRP_LOCALE` cookie. */
  cookie?: string | null;
  /** Raw `Accept-Language` request header. */
  acceptLanguage?: string | null;
};

/**
 * Pure resolution chain (FR-6): session → cookie → Accept-Language → platform
 * default. Every candidate is normalized to its base language (FR-8) and
 * unsupported values are ignored.
 */
export function pickLocale(candidates: LocaleCandidates): Locale {
  return (
    normalizeLocale(candidates.session) ??
    normalizeLocale(candidates.cookie) ??
    parseAcceptLanguage(candidates.acceptLanguage) ??
    PLATFORM_DEFAULT_LOCALE
  );
}

/**
 * Resolves the requested locale for the current request (server only).
 * The locale is never read from — nor written to — the URL (FR-7).
 */
export async function resolveLocale(): Promise<Locale> {
  const [sessionLocale, cookieStore, headerStore] = await Promise.all([
    getSessionLocale(),
    cookies(),
    headers(),
  ]);

  return pickLocale({
    session: sessionLocale,
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerStore.get("accept-language"),
  });
}
