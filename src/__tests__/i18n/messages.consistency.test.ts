// FE-7 (FR-34): message catalog consistency — runs with the normal `pnpm test`.
//
// - en/fr contain no key missing from pt (the module default);
// - ICU arguments per shared key are identical to pt;
// - every message in every file parses as valid ICU;
// - keys are nested camelCase;
// - per-locale coverage is printed (informational only).

import {
  type MessageFormatElement,
  parse,
  TYPE,
} from "@formatjs/icu-messageformat-parser";
import { describe, expect, it } from "vitest";

import { LOCALES, type Locale, MODULE_DEFAULT_LOCALE } from "@/i18n/config";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

type Tree = { [key: string]: unknown };

const CATALOGS: Record<Locale, Tree> = { pt, en, fr };

function flatten(tree: Tree, prefix = ""): Map<string, unknown> {
  const out = new Map<string, unknown>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [k, v] of flatten(value as Tree, path)) out.set(k, v);
    } else {
      out.set(path, value);
    }
  }
  return out;
}

/** Names of every ICU argument / tag used by a message, sorted. */
function icuArguments(message: string): string[] {
  const names = new Set<string>();
  const visit = (elements: MessageFormatElement[]) => {
    for (const el of elements) {
      switch (el.type) {
        case TYPE.argument:
        case TYPE.number:
        case TYPE.date:
        case TYPE.time:
          names.add(`${el.value}:${TYPE[el.type]}`);
          break;
        case TYPE.select:
        case TYPE.plural:
          names.add(`${el.value}:${TYPE[el.type]}`);
          for (const option of Object.values(el.options)) visit(option.value);
          break;
        case TYPE.tag:
          names.add(`<${el.value}>`);
          visit(el.children);
          break;
        default:
          break;
      }
    }
  };
  visit(parse(message));
  return [...names].sort();
}

const FLAT: Record<Locale, Map<string, unknown>> = {
  pt: flatten(CATALOGS.pt),
  en: flatten(CATALOGS.en),
  fr: flatten(CATALOGS.fr),
};
const OTHER_LOCALES = LOCALES.filter((l) => l !== MODULE_DEFAULT_LOCALE);

describe("messages consistency", () => {
  it.each(OTHER_LOCALES)("%s has no key missing from pt", (locale) => {
    const orphans = [...FLAT[locale].keys()].filter(
      (key) => !FLAT[MODULE_DEFAULT_LOCALE].has(key),
    );
    expect(orphans).toEqual([]);
  });

  it.each(LOCALES)(
    "%s: every value is a string that parses as ICU",
    (locale) => {
      const invalid: string[] = [];
      for (const [key, value] of FLAT[locale]) {
        if (typeof value !== "string") {
          invalid.push(`${key}: not a string`);
          continue;
        }
        try {
          parse(value);
        } catch (error) {
          invalid.push(`${key}: ${(error as Error).message}`);
        }
      }
      expect(invalid).toEqual([]);
    },
  );

  it.each(OTHER_LOCALES)(
    "%s uses the same ICU arguments as pt for every shared key",
    (locale) => {
      const mismatches: string[] = [];
      for (const [key, value] of FLAT[locale]) {
        const base = FLAT[MODULE_DEFAULT_LOCALE].get(key);
        if (typeof value !== "string" || typeof base !== "string") continue;
        const got = icuArguments(value);
        const expected = icuArguments(base);
        if (got.join() !== expected.join()) {
          mismatches.push(
            `${key}: [${got.join(", ")}] ≠ pt [${expected.join(", ")}]`,
          );
        }
      }
      expect(mismatches).toEqual([]);
    },
  );

  it.each(LOCALES)("%s uses nested camelCase keys", (locale) => {
    const bad = [...FLAT[locale].keys()].filter((key) =>
      key.split(".").some((segment) => !/^[a-z][a-zA-Z0-9]*$/.test(segment)),
    );
    expect(bad).toEqual([]);
  });

  it("detects ICU argument mismatches (self-check)", () => {
    expect(
      icuArguments("{count, plural, one {# user} other {# users}}"),
    ).toEqual(["count:plural"]);
    expect(icuArguments("Olá {name}, <b>{n, number}</b>")).toEqual([
      "<b>",
      "n:number",
      "name:argument",
    ]);
  });

  it("reports per-locale coverage (informational)", () => {
    const total = FLAT[MODULE_DEFAULT_LOCALE].size;
    const report = LOCALES.map((locale) => {
      const covered = [...FLAT[locale].keys()].filter((k) =>
        FLAT[MODULE_DEFAULT_LOCALE].has(k),
      ).length;
      return `${locale}: ${Math.round((covered / total) * 100)}% (${covered}/${total})`;
    });
    console.info(`[i18n] message coverage — ${report.join(" · ")}`);
    expect(total).toBeGreaterThan(0);
  });
});
