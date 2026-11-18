import type { IGRPBranding } from "@igrp/framework-next-types";
import { describe, expect, it } from "vitest";

import { BRANDING_TOKEN_NAMES } from "@/features/branding/catalog";
import {
  toBrandingDocument,
  toFormValues,
} from "@/features/branding/lib/branding-mapper";

const URL_A = "https://minio.example/igrp/public/branding/u/a.png";
const saved: IGRPBranding = {
  version: 1,
  tokens: {
    light: { "--primary": "oklch(0.45 0.18 250)" },
    dark: { "--app-tile-1": "oklch(0.3 0.06 41.116)" },
  },
  logos: {
    header: { light: URL_A },
    wide: { light: URL_A, dark: URL_A, width: 320, height: 96 },
  },
};

describe("toFormValues", () => {
  it("gives every catalog Token a field in both Modes, empty when unset", () => {
    const values = toFormValues(null);
    for (const mode of ["light", "dark"] as const) {
      expect(Object.keys(values.tokens[mode]).sort()).toEqual(
        [...BRANDING_TOKEN_NAMES].sort(),
      );
      expect(Object.values(values.tokens[mode]).every((v) => v === "")).toBe(
        true,
      );
    }
    expect(values.logos.favicon).toEqual({ light: "", dark: "" });
  });

  it("fills saved values", () => {
    const values = toFormValues(saved);
    expect(values.tokens.light["--primary"]).toBe("oklch(0.45 0.18 250)");
    expect(values.tokens.dark["--app-tile-1"]).toBe("oklch(0.3 0.06 41.116)");
    expect(values.logos.wide).toEqual({
      light: URL_A,
      dark: URL_A,
      width: 320,
      height: 96,
    });
    expect(values.logos.header).toEqual({ light: URL_A, dark: "" });
  });
});

describe("toBrandingDocument", () => {
  it("keeps only filled Tokens and normalizes them to OKLCH", () => {
    const values = toFormValues(null);
    values.tokens.light["--primary"] = "#ff0000";
    // No File in these values, so the string-only overload is safe.
    const doc = toBrandingDocument(values as never);
    expect(doc).toEqual({
      version: 1,
      tokens: {
        light: { "--primary": "oklch(0.628 0.2577 29.2339)" },
        dark: {},
      },
      logos: {},
    });
  });

  it("drops empty logo slots, keeps size only on the wide slot", () => {
    const values = toFormValues(saved);
    values.logos.header = { light: URL_A, dark: "", width: 10, height: 10 };
    const doc = toBrandingDocument(values as never);
    expect(doc.logos.header).toEqual({ light: URL_A });
    expect(doc.logos.wide).toEqual({
      light: URL_A,
      dark: URL_A,
      width: 320,
      height: 96,
    });
    expect(doc.logos.favicon).toBeUndefined();
  });

  it("round-trips a saved Brand", () => {
    expect(toBrandingDocument(toFormValues(saved) as never)).toEqual(saved);
  });

  it("throws on a colour the editor rejects", () => {
    const values = toFormValues(null);
    values.tokens.dark["--primary"] = "color-mix(in oklch, red, blue)";
    expect(() => toBrandingDocument(values as never)).toThrow();
  });
});
