// ─────────────────────────────────────────────────────────────────────────────
// Central date / number / collation helpers (FR-22, FR-23).
//
// Every helper formats with the fixed region of the language
// (`pt` → pt-CV, `en` → en-GB, `fr` → fr-FR). Feature code must not hardcode a
// locale or region.
//
// - Client components / sync server components: `const f = useFormat()`.
// - Async server components / actions: `formatDate(value, await getLocale())`.
// ─────────────────────────────────────────────────────────────────────────────

import { useLocale } from "next-intl";

import { FORMAT_REGION, type Locale } from "./config";

export type DateInput = Date | string | number | null | undefined;

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
};

function toDate(value: DateInput): Date | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

/** `dd/mm/yyyy` in all platform regions. Empty string for missing/invalid input. */
export function formatDate(
  value: DateInput,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = DATE_OPTIONS,
): string {
  const date = toDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat(FORMAT_REGION[locale], options).format(date);
}

/** Date plus `HH:mm`. Empty string for missing/invalid input. */
export function formatDateTime(
  value: DateInput,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = DATE_TIME_OPTIONS,
): string {
  return formatDate(value, locale, options);
}

export function formatNumber(
  value: number | bigint,
  locale: Locale,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(FORMAT_REGION[locale], options).format(value);
}

const collators = new Map<Locale, Intl.Collator>();

function getCollator(locale: Locale): Intl.Collator {
  let collator = collators.get(locale);
  if (!collator) {
    collator = new Intl.Collator(FORMAT_REGION[locale], {
      sensitivity: "base",
      numeric: true,
    });
    collators.set(locale, collator);
  }
  return collator;
}

/** Locale-aware string comparison, usable directly as an `Array#sort` comparator body. */
export function compare(
  a: string | null | undefined,
  b: string | null | undefined,
  locale: Locale,
): number {
  return getCollator(locale).compare(a ?? "", b ?? "");
}

/** The helpers above bound to the current locale (`useLocale()`). */
export function useFormat() {
  const locale = useLocale();
  return {
    locale,
    formatDate: (value: DateInput, options?: Intl.DateTimeFormatOptions) =>
      formatDate(value, locale, options),
    formatDateTime: (value: DateInput, options?: Intl.DateTimeFormatOptions) =>
      formatDateTime(value, locale, options),
    formatNumber: (
      value: number | bigint,
      options?: Intl.NumberFormatOptions,
    ) => formatNumber(value, locale, options),
    compare: (a: string | null | undefined, b: string | null | undefined) =>
      compare(a, b, locale),
  };
}
