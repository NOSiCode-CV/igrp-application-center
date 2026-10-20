import { describe, expect, it } from "vitest";

import {
  BRANDING_GROUPS,
  BRANDING_TOKEN_NAMES,
  labelKeyOf,
} from "@/features/branding/catalog";
import { BRANDING_DEFAULTS } from "@/features/branding/token-defaults";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

import { readBrandingDefaults } from "../../../scripts/branding-defaults.mjs";

const keysDeep = (value: unknown, prefix = ""): string[] =>
  typeof value === "object" && value !== null
    ? Object.entries(value).flatMap(([k, v]) => keysDeep(v, `${prefix}${k}.`))
    : [prefix.slice(0, -1)];

describe("branding catalog", () => {
  it("holds 73 unique Tokens: 50 core and 23 app-tier", () => {
    expect(BRANDING_TOKEN_NAMES).toHaveLength(73);
    expect(new Set(BRANDING_TOKEN_NAMES).size).toBe(73);
    expect(BRANDING_TOKEN_NAMES).not.toContain("--radius");
  });

  it("derives camelCase label keys", () => {
    expect(labelKeyOf("--app-tile-1-foreground")).toBe("appTile1Foreground");
    expect(labelKeyOf("--chart-1")).toBe("chart1");
    expect(labelKeyOf("--primary")).toBe("primary");
  });

  it("has a Default for every Token in both Modes", () => {
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(BRANDING_DEFAULTS[mode]).sort()).toEqual(
        [...BRANDING_TOKEN_NAMES].sort(),
      );
    }
  });

  it("keeps the generated Defaults in sync with the CSS", () => {
    expect(BRANDING_DEFAULTS).toEqual(readBrandingDefaults());
  });
});

describe("branding messages", () => {
  it.each([
    ["pt", pt],
    ["en", en],
    ["fr", fr],
  ])("%s labels every group and Token", (_, messages) => {
    for (const group of BRANDING_GROUPS) {
      expect(messages.branding.groups).toHaveProperty(group.key);
      for (const token of group.tokens) {
        expect(messages.branding.tokens).toHaveProperty(token.labelKey);
      }
    }
  });

  it("en and fr carry exactly the pt keys", () => {
    const ptKeys = keysDeep(pt.branding).sort();
    expect(keysDeep(en.branding).sort()).toEqual(ptKeys);
    expect(keysDeep(fr.branding).sort()).toEqual(ptKeys);
  });
});
