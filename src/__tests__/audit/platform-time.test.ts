import { describe, expect, it } from "vitest";

import {
  dayRangeToInstants,
  isRangePreset,
  isValidYmd,
  localDateToYmd,
  presetToInstants,
  todayYmd,
  ymdToLocalDate,
  zoneOffsetMinutes,
} from "@/features/audit/lib/platform-time";

const CV = "Atlantic/Cape_Verde";

describe("zone offsets", () => {
  const instant = new Date("2026-09-23T12:00:00Z");

  it("reads Cabo Verde as UTC-1 and UTC as 0", () => {
    expect(zoneOffsetMinutes(instant, CV)).toBe(-60);
    expect(zoneOffsetMinutes(instant, "UTC")).toBe(0);
  });

  it("follows whichever zone it is given, daylight saving included", () => {
    expect(zoneOffsetMinutes(instant, "Europe/Lisbon")).toBe(60);
    expect(
      zoneOffsetMinutes(new Date("2026-01-15T12:00:00Z"), "Europe/Lisbon"),
    ).toBe(0);
    expect(zoneOffsetMinutes(instant, "Asia/Kolkata")).toBe(330);
  });
});

describe("dayRangeToInstants", () => {
  it("covers a whole Cabo Verde day", () => {
    expect(dayRangeToInstants("2026-09-23", "2026-09-23", CV)).toEqual({
      startDate: "2026-09-23T01:00:00.000Z",
      endDate: "2026-09-24T00:59:59.999Z",
    });
  });

  it("covers the same days in another zone", () => {
    expect(dayRangeToInstants("2026-09-23", "2026-09-23", "UTC")).toEqual({
      startDate: "2026-09-23T00:00:00.000Z",
      endDate: "2026-09-23T23:59:59.999Z",
    });
    expect(
      dayRangeToInstants("2026-09-23", "2026-09-23", "Europe/Lisbon"),
    ).toEqual({
      startDate: "2026-09-22T23:00:00.000Z",
      endDate: "2026-09-23T22:59:59.999Z",
    });
  });

  it("includes an event at 23:30 Cabo Verde time on the last day", () => {
    const { startDate, endDate } = dayRangeToInstants(
      "2026-09-23",
      "2026-09-23",
      CV,
    );
    const event = "2026-09-24T00:30:00.000Z"; // 23:30 on the 23rd in CV
    expect(event >= startDate && event <= endDate).toBe(true);
  });

  it("spans month boundaries", () => {
    expect(dayRangeToInstants("2026-08-31", "2026-09-01", CV)).toEqual({
      startDate: "2026-08-31T01:00:00.000Z",
      endDate: "2026-09-02T00:59:59.999Z",
    });
  });
});

describe("presetToInstants", () => {
  const now = new Date("2026-09-23T10:00:00.000Z");

  it("ends exactly at the given now", () => {
    expect(presetToInstants("24h", now)).toEqual({
      startDate: "2026-09-22T10:00:00.000Z",
      endDate: "2026-09-23T10:00:00.000Z",
    });
  });

  it("goes back 7 and 30 days", () => {
    expect(presetToInstants("7d", now).startDate).toBe(
      "2026-09-16T10:00:00.000Z",
    );
    expect(presetToInstants("30d", now).startDate).toBe(
      "2026-08-24T10:00:00.000Z",
    );
  });
});

describe("calendar-day helpers", () => {
  it("validates YYYY-MM-DD strictly", () => {
    expect(isValidYmd("2026-09-23")).toBe(true);
    expect(isValidYmd("2026-02-30")).toBe(false);
    expect(isValidYmd("2026-9-23")).toBe(false);
    expect(isValidYmd(undefined)).toBe(false);
  });

  it("computes today in the platform zone, not UTC", () => {
    // 00:30 UTC on the 24th is still 23:30 on the 23rd in Cabo Verde.
    expect(todayYmd(new Date("2026-09-24T00:30:00Z"), CV)).toBe("2026-09-23");
  });

  it("computes today in whichever zone it is given", () => {
    const instant = new Date("2026-09-23T23:30:00Z");
    expect(todayYmd(instant, CV)).toBe("2026-09-23");
    expect(todayYmd(instant, "Europe/Lisbon")).toBe("2026-09-24");
  });

  it("round-trips a calendar Date", () => {
    expect(localDateToYmd(ymdToLocalDate("2026-09-03"))).toBe("2026-09-03");
  });

  it("recognises presets", () => {
    expect(isRangePreset("7d")).toBe(true);
    expect(isRangePreset("custom")).toBe(false);
  });
});
