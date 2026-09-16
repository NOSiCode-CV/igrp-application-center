import { describe, expect, it } from "vitest";

import { getAppHref, getAppTileColor, getLastOpenedLabel } from "./app-utils";

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
    expect(getLastOpenedLabel(undefined, now)).toBe("Aberta recentemente");
    expect(getLastOpenedLabel(null, now)).toBe("Aberta recentemente");
  });

  it("returns a fallback for an unparseable date", () => {
    expect(getLastOpenedLabel("not-a-date", now)).toBe("Aberta recentemente");
  });

  it("formats minutes ago", () => {
    const eighteenMinutesAgo = new Date(
      now.getTime() - 18 * 60_000,
    ).toISOString();
    expect(getLastOpenedLabel(eighteenMinutesAgo, now)).toBe(
      "Aberta há 18 minutos",
    );
  });

  it("formats hours ago", () => {
    const threeHoursAgo = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(getLastOpenedLabel(threeHoursAgo, now)).toBe("Aberta há 3 horas");
  });

  it("formats yesterday", () => {
    const yesterday = new Date(now.getTime() - 25 * 3_600_000).toISOString();
    expect(getLastOpenedLabel(yesterday, now)).toBe("Aberta ontem");
  });

  it("formats a weekday name for 2-6 days ago", () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000).toISOString();
    const expectedWeekday = new Date(threeDaysAgo).toLocaleDateString("pt-PT", {
      weekday: "long",
    });
    expect(getLastOpenedLabel(threeDaysAgo, now)).toBe(
      `Aberta ${expectedWeekday}`,
    );
  });

  it("formats weeks ago for 7+ days", () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();
    expect(getLastOpenedLabel(twoWeeksAgo, now)).toBe("Aberta há 2 semanas");
  });
});

describe("getAppHref", () => {
  const app = (extra: Record<string, unknown>) =>
    ({ code: "X", name: "X", ...extra }) as never;

  it("prefers an explicit url", () => {
    expect(getAppHref(app({ url: "https://x.test", slug: "ignored" }))).toBe(
      "https://x.test",
    );
  });

  it("anchors a bare slug to the root", () => {
    // Without the leading slash this resolved RELATIVE to the current route,
    // so it 404'd somewhere unrelated instead of opening the app.
    expect(getAppHref(app({ slug: "payroll" }))).toBe("/payroll");
  });

  it("leaves an already-absolute slug alone", () => {
    expect(getAppHref(app({ slug: "/payroll" }))).toBe("/payroll");
  });

  it("returns an empty string when there is nothing to launch", () => {
    expect(getAppHref(app({}))).toBe("");
  });
});
