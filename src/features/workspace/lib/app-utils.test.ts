import { describe, expect, it } from "vitest";
import { getAppTileColor } from "./app-utils";

describe("getAppTileColor", () => {
  it("returns an object with bg and text keys", () => {
    const result = getAppTileColor("APP_HR");
    expect(result).toHaveProperty("bg");
    expect(result).toHaveProperty("text");
  });

  it("returns deterministic result for the same code", () => {
    expect(getAppTileColor("APP_FINANCE")).toEqual(
      getAppTileColor("APP_FINANCE"),
    );
  });

  it("returns different colors for different codes (statistically)", () => {
    const codes = ["APP_HR", "APP_FIN", "APP_DOC", "APP_PRO", "APP_CON"];
    const results = codes.map(getAppTileColor);
    const bgs = results.map((r) => r.bg);
    const unique = new Set(bgs);
    expect(unique.size).toBeGreaterThan(1);
  });
});
