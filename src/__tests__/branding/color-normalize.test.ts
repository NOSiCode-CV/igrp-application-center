import { describe, expect, it } from "vitest";

import {
  isEditorColor,
  normalizeColor,
  toHex,
} from "@/features/branding/lib/color-normalize";

describe("normalizeColor", () => {
  it.each([
    ["#ff0000", "oklch(0.628 0.2577 29.2339)"],
    ["#fff", "oklch(1 0 0)"],
    ["rgb(0 128 255)", "oklch(0.6152 0.2108 256.099)"],
    ["rgba(0, 0, 0, 0.5)", "oklch(0 0 0 / 0.5)"],
    ["hsl(210 50% 40%)", "oklch(0.4993 0.0987 250.4331)"],
    ["rebeccapurple", "oklch(0.4403 0.1603 303.373)"],
    ["lab(50% 40 30)", "oklch(0.5792 0.1323 31.5089)"],
    ["  oklch(0.45 0.18 250)  ", "oklch(0.45 0.18 250)"],
  ])("normalizes %j to %j", (input, expected) => {
    expect(normalizeColor(input)).toBe(expected);
  });

  it("gives greys a zero hue", () => {
    expect(normalizeColor("#808080")).toMatch(/^oklch\([\d.]+ 0 0\)$/);
  });

  it("is idempotent on its own output", () => {
    const once = normalizeColor("#3366cc");
    expect(once).not.toBeNull();
    expect(normalizeColor(once as string)).toBe(once);
  });

  it.each([
    "color-mix(in oklch, red, blue)",
    "var(--primary)",
    "rgb(var(--x) 0 0)",
    "transparent",
    "currentColor",
    "notacolor",
    "inherit",
    "red; background: url(x)",
    "",
  ])("rejects %j", (input) => {
    expect(isEditorColor(input)).toBe(false);
    expect(normalizeColor(input)).toBeNull();
  });
});

describe("toHex", () => {
  it("converts any editor colour to #rrggbb", () => {
    expect(toHex("oklch(0.628 0.2577 29.2339)")).toBe("#ff0000");
  });
  it("falls back to black for values it cannot parse", () => {
    expect(toHex("color-mix(in oklch, red, blue)")).toBe("#000000");
  });
});
