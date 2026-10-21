import { describe, expect, it } from "vitest";

import { getAppHref, getAppTileColor, getLastOpened } from "./app-utils";

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

describe("getLastOpened", () => {
  // A Tuesday, midday in the platform zone (UTC-1).
  const now = new Date("2026-06-30T13:00:00Z");
  const CV = "Atlantic/Cape_Verde";

  it("says nothing when lastAccess is missing", () => {
    // It used to claim "Aberta recentemente" for a timestamp it did not have.
    // The caller renders the label only when present, so null hides the row.
    expect(getLastOpened(undefined, now, CV)).toBeNull();
    expect(getLastOpened(null, now, CV)).toBeNull();
  });

  it("says nothing for an unparseable date", () => {
    expect(getLastOpened("not-a-date", now, CV)).toBeNull();
  });

  it("says just now under a minute", () => {
    const tenSecondsAgo = new Date(now.getTime() - 10_000).toISOString();
    expect(getLastOpened(tenSecondsAgo, now, CV)).toEqual({ key: "justNow" });
  });

  it("counts minutes ago", () => {
    const eighteenMinutesAgo = new Date(
      now.getTime() - 18 * 60_000,
    ).toISOString();
    expect(getLastOpened(eighteenMinutesAgo, now, CV)).toEqual({
      key: "minutes",
      count: 18,
    });
  });

  it("counts hours ago", () => {
    const threeHoursAgo = new Date(now.getTime() - 3 * 3_600_000).toISOString();
    expect(getLastOpened(threeHoursAgo, now, CV)).toEqual({
      key: "hours",
      count: 3,
    });
  });

  it("says yesterday", () => {
    const yesterday = new Date(now.getTime() - 25 * 3_600_000).toISOString();
    expect(getLastOpened(yesterday, now, CV)).toEqual({ key: "yesterday" });
  });

  it("names the weekday, in the platform zone, for 2-6 days ago", () => {
    const threeDaysAgo = new Date(now.getTime() - 3 * 86_400_000);
    expect(getLastOpened(threeDaysAgo.toISOString(), now, CV)).toEqual({
      key: "weekday",
      date: threeDaysAgo,
      day: 6, // Saturday
    });
  });

  it("counts weeks ago for 7+ days", () => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86_400_000).toISOString();
    expect(getLastOpened(twoWeeksAgo, now, CV)).toEqual({
      key: "weeks",
      count: 2,
    });
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
