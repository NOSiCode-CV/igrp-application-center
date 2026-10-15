import { afterEach, describe, expect, it, vi } from "vitest";

import {
  dayRangeToInstants,
  formatAuditDateTime,
  formatYmd,
  isRangePreset,
  isValidYmd,
  localDateToYmd,
  PLATFORM_TIME_ZONE,
  presetToInstants,
  todayYmd,
  ymdToLocalDate,
  zoneOffsetMinutes,
} from "@/features/audit/lib/platform-time";

const CV = "Atlantic/Cape_Verde";

describe("platform time zone", () => {
  it("defaults to Cabo Verde", () => {
    expect(PLATFORM_TIME_ZONE).toBe(CV);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /* F6: NEXT_PUBLIC_AUDIT_TIME_ZONE resolves through a validity check at
     module scope; a bad zone must fall back instead of throwing a
     RangeError out of the module's top level. */
  it("falls back to Cabo Verde when the env override is not a valid IANA zone", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIT_TIME_ZONE", "Not/A_Zone");
    vi.resetModules();
    const mod = await import("@/features/audit/lib/platform-time");
    expect(mod.PLATFORM_TIME_ZONE).toBe(CV);
  });

  it("keeps a valid env override", async () => {
    vi.stubEnv("NEXT_PUBLIC_AUDIT_TIME_ZONE", "Europe/Lisbon");
    vi.resetModules();
    const mod = await import("@/features/audit/lib/platform-time");
    expect(mod.PLATFORM_TIME_ZONE).toBe("Europe/Lisbon");
  });

  it("reads Cabo Verde as UTC-1 and UTC as 0", () => {
    const instant = new Date("2026-09-23T12:00:00Z");
    expect(zoneOffsetMinutes(instant, CV)).toBe(-60);
    expect(zoneOffsetMinutes(instant, "UTC")).toBe(0);
  });
});

describe("dayRangeToInstants", () => {
  it("covers a whole Cabo Verde day", () => {
    expect(dayRangeToInstants("2026-09-23", "2026-09-23", CV)).toEqual({
      startDate: "2026-09-23T01:00:00.000Z",
      endDate: "2026-09-24T00:59:59.999Z",
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

  it("round-trips a calendar Date", () => {
    expect(localDateToYmd(ymdToLocalDate("2026-09-03"))).toBe("2026-09-03");
  });

  it("formats a day for display in pt-PT order", () => {
    expect(formatYmd("2026-09-03")).toBe("03/09/2026");
  });

  it("recognises presets", () => {
    expect(isRangePreset("7d")).toBe(true);
    expect(isRangePreset("custom")).toBe(false);
  });
});

describe("formatAuditDateTime", () => {
  it("renders in Cabo Verde time", () => {
    const text = formatAuditDateTime("2026-07-16T11:35:10Z");
    expect(text).toContain("16/07/2026");
    expect(text).toContain("10:35:10");
  });

  it("renders a dash for missing or invalid values", () => {
    expect(formatAuditDateTime(null)).toBe("—");
    expect(formatAuditDateTime(undefined)).toBe("—");
    expect(formatAuditDateTime("not a date")).toBe("—");
  });
});
