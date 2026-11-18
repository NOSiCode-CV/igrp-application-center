import { describe, expect, it } from "vitest";

import { previewStyle } from "@/features/branding/lib/live-preview";
import { BRANDING_DEFAULTS } from "@/features/branding/token-defaults";

describe("previewStyle", () => {
  it("is the Mode's Defaults when the draft is empty", () => {
    expect(previewStyle({ "--primary": "" }, "dark")).toEqual(
      BRANDING_DEFAULTS.dark,
    );
  });

  it("overrides only the filled, valid draft values", () => {
    const style = previewStyle(
      { "--primary": "#ff0000", "--accent": "color-mix(in oklch, red, blue)" },
      "light",
    );
    expect(style["--primary"]).toBe("#ff0000");
    expect(style["--accent"]).toBe(BRANDING_DEFAULTS.light["--accent"]);
  });

  it("never touches the document root", () => {
    const before = document.documentElement.getAttribute("style");
    previewStyle({ "--primary": "#ff0000" }, "light");
    expect(document.documentElement.getAttribute("style")).toBe(before);
  });
});
