// FE-3 (FR-22, FR-23): formatting uses the fixed region of each language.

import { describe, expect, it } from "vitest";

import { FORMAT_REGION } from "@/i18n/config";
import {
  compare,
  formatDate,
  formatDateTime,
  formatNumber,
} from "@/i18n/format";

// Midday, so no time zone can shift the calendar day.
const DATE = new Date(2026, 8, 22, 12, 0, 0);

describe("formatDate", () => {
  it.each(["pt", "en", "fr"] as const)("formats %s as dd/mm/yyyy", (locale) => {
    expect(formatDate(DATE, locale)).toBe("22/09/2026");
  });

  it("accepts ISO strings and timestamps", () => {
    expect(formatDate(DATE.toISOString(), "pt")).toBe("22/09/2026");
    expect(formatDate(DATE.getTime(), "en")).toBe("22/09/2026");
  });

  it("returns an empty string for missing or invalid input", () => {
    expect(formatDate(undefined, "pt")).toBe("");
    expect(formatDate(null, "pt")).toBe("");
    expect(formatDate("not a date", "pt")).toBe("");
  });

  it("uses the region mapping", () => {
    expect(FORMAT_REGION).toEqual({ pt: "pt-CV", en: "en-GB", fr: "fr-FR" });
    const long = { day: "numeric", month: "long" } as const;
    expect(formatDate(DATE, "pt", long)).toBe(
      new Intl.DateTimeFormat("pt-CV", long).format(DATE),
    );
    expect(formatDate(DATE, "fr", long)).toBe("22 septembre");
    expect(formatDate(DATE, "en", long)).toBe("22 September");
  });
});

describe("formatDateTime", () => {
  it("adds hours and minutes", () => {
    expect(formatDateTime(DATE, "en")).toBe(
      new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(DATE),
    );
    expect(formatDateTime(DATE, "fr")).toContain("12:00");
  });
});

describe("formatNumber", () => {
  it("formats with the region separators", () => {
    const value = 1234567.5;
    expect(formatNumber(value, "en")).toBe("1,234,567.5");
    expect(formatNumber(value, "pt")).toBe(
      new Intl.NumberFormat("pt-CV").format(value),
    );
    expect(formatNumber(value, "fr")).toBe(
      new Intl.NumberFormat("fr-FR").format(value),
    );
  });
});

describe("compare", () => {
  it("uses the locale collator (accents sort with their base letter)", () => {
    const names = ["Zé", "Élio", "Ana", "Óscar", "eva"];
    const sorted = [...names].sort((a, b) => compare(a, b, "pt"));
    expect(sorted).toEqual(["Ana", "Élio", "eva", "Óscar", "Zé"]);
  });

  it("matches Intl.Collator for the region and handles nullish values", () => {
    const collator = new Intl.Collator("fr-FR", {
      sensitivity: "base",
      numeric: true,
    });
    expect(Math.sign(compare("côte", "cote", "fr"))).toBe(
      Math.sign(collator.compare("côte", "cote")),
    );
    expect(compare(null, "a", "en")).toBeLessThan(0);
    expect(compare("item 2", "item 10", "en")).toBeLessThan(0);
  });
});
