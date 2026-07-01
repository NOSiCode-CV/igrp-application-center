import { describe, expect, it } from "vitest";
import { getAppTileColor, getLastOpenedLabel } from "./app-utils";

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

describe("getLastOpenedLabel", () => {
  const now = new Date("2026-06-30T12:00:00Z");

  it("returns a fallback when lastAccess is missing", () => {
    expect(getLastOpenedLabel(undefined, now)).toBe("Opened recently");
    expect(getLastOpenedLabel(null, now)).toBe("Opened recently");
  });

  it("returns a fallback for an unparseable date", () => {
    expect(getLastOpenedLabel("not-a-date", now)).toBe("Opened recently");
  });

  it("formats minutes ago", () => {
    const eighteenMinutesAgo = new Date(
      now.getTime() - 18 * 60_000,
    ).toISOString();
    expect(getLastOpenedLabel(eighteenMinutesAgo, now)).toBe(
      "Opened 18 minutes ago",
    );
  });

  it("formats hours ago", () => {
    const threeHoursAgo = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(getLastOpenedLabel(threeHoursAgo, now)).toBe("Opened 3 hours ago");
  });

  it("formats yesterday", () => {
    const yesterday = new Date(now.getTime() - 25 * 3_600_000).toISOString();
    expect(getLastOpenedLabel(yesterday, now)).toBe("Opened yesterday");
  });

  it("formats a weekday name for 2-6 days ago", () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();
    const expectedWeekday = new Date(threeDaysAgo).toLocaleDateString("en-US", {
      weekday: "long",
    });
    expect(getLastOpenedLabel(threeDaysAgo, now)).toBe(
      `Opened ${expectedWeekday}`,
    );
  });

  it("formats weeks ago for 7+ days", () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();
    expect(getLastOpenedLabel(twoWeeksAgo, now)).toBe("Opened 2 weeks ago");
  });
});
