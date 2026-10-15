// ─────────────────────────────────────────────────────────────────────────────
// i18n configuration for the Application Center.
//
// Pure module (no server/client-only APIs) so it can be imported from server
// components, client components, server actions and the Edge middleware.
// Shaped like the future framework package (`@igrp/framework-next` i18n) so
// the later move is an import change.
// ─────────────────────────────────────────────────────────────────────────────

/** Platform languages (FR-1). Fixed, not configurable per installation. */
export const LOCALES = ["pt", "en", "fr"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * Module default (FR-2): the language this deployable declares as complete.
 * Its messages file (`messages/pt.json`) is the per-key fallback (FR-12).
 */
export const MODULE_DEFAULT_LOCALE: Locale = "pt";

/**
 * Platform default (OQ-1): only used to pick the requested locale when nothing
 * else is known. Never part of the message fallback chain (FR-13).
 */
export const PLATFORM_DEFAULT_LOCALE: Locale = "pt";

/** Fixed formatting region per language (FR-22). */
export const FORMAT_REGION: Record<Locale, string> = {
  pt: "pt-CV",
  en: "en-GB",
  fr: "fr-FR",
};

/**
 * Native language names for the language selectors. Deliberately not
 * translated: a language is always shown in its own name.
 */
export const LOCALE_NATIVE_NAMES: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  fr: "Français",
};

/** Cookie carrying the user's language choice (FR-6 priority 2). */
export const LOCALE_COOKIE = "IGRP_LOCALE";

/**
 * Cookie attributes. `path=/` so every app behind the gateway (HAProxy
 * `/apps/[slug]`) sees the same choice. Not `httpOnly`: `global-error.tsx`
 * renders outside every provider and reads it from `document.cookie`.
 */
export const LOCALE_COOKIE_OPTIONS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
  sameSite: "lax",
} as const;

// FR-3: a module default outside the platform list is a startup/build error.
if (!(LOCALES as readonly string[]).includes(MODULE_DEFAULT_LOCALE)) {
  throw new Error(
    `[i18n] MODULE_DEFAULT_LOCALE "${MODULE_DEFAULT_LOCALE}" is not a platform language (${LOCALES.join(", ")})`,
  );
}

export function isLocale(value: unknown): value is Locale {
  return (
    typeof value === "string" && (LOCALES as readonly string[]).includes(value)
  );
}

/**
 * Normalizes a language tag to a platform language (FR-8): `pt-CV`, `pt_PT`,
 * `PT-br` → `pt`. Returns `undefined` for empty or unsupported tags.
 */
export function normalizeLocale(tag: unknown): Locale | undefined {
  if (typeof tag !== "string") return undefined;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return isLocale(base) ? base : undefined;
}
