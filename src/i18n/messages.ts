// ─────────────────────────────────────────────────────────────────────────────
// Message catalogs + per-key fallback (FR-12).
//
// Used by the server request config (`request.ts`). Kept out of client
// modules so the catalogs are not bundled for the browser — the merged
// messages reach the client through `NextIntlClientProvider`.
// ─────────────────────────────────────────────────────────────────────────────

import { type Locale, MODULE_DEFAULT_LOCALE } from "./config";
import en from "./messages/en.json";
import fr from "./messages/fr.json";
import pt from "./messages/pt.json";

/** Complete catalog shape, typed from the module default (`pt.json`). */
export type Messages = typeof pt;

type MessageTree = { [key: string]: string | MessageTree };

/**
 * One file per platform language. Non-default files may be partial (FR-5).
 * Only platform languages are imported, so a file for any other language is
 * never loaded (FR-4).
 */
const CATALOGS: Record<Locale, MessageTree> = { pt, en, fr };

function isTree(value: unknown): value is MessageTree {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Deep merge: every key of `override` wins over `base`; keys missing from
 * `override` keep the `base` value. Neither input is mutated.
 */
export function deepMerge<T extends MessageTree>(
  base: T,
  override: MessageTree,
): T {
  const result: MessageTree = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const current = result[key];
    result[key] =
      isTree(current) && isTree(value) ? deepMerge(current, value) : value;
  }
  return result as T;
}

const mergedCache = new Map<Locale, Messages>();

/**
 * Messages for `locale`: its own file merged over the module default, so a
 * key missing in the requested language falls back to Portuguese (FR-12).
 * Computed once per locale and cached (NFR-4).
 */
export function getMessagesFor(locale: Locale): Messages {
  const cached = mergedCache.get(locale);
  if (cached) return cached;

  const base = CATALOGS[MODULE_DEFAULT_LOCALE] as Messages;
  const merged =
    locale === MODULE_DEFAULT_LOCALE
      ? base
      : deepMerge(base as unknown as MessageTree, CATALOGS[locale]);
  mergedCache.set(locale, merged as Messages);
  return merged as Messages;
}
