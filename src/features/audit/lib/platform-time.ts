const DEFAULT_TIME_ZONE = "Atlantic/Cape_Verde";

function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone });
    return true;
  } catch {
    return false;
  }
}

/* ADR-0001: every audit date range is interpreted, and every audit time is
   displayed, in ONE zone — never the server's (UTC in the cluster) or the
   viewer's browser. That keeps the filter and the times on screen in
   agreement, and makes a shared Report link return the same rows for
   everyone. A bad NEXT_PUBLIC_AUDIT_TIME_ZONE must not crash the module at
   import time (the Intl.DateTimeFormat below would throw a RangeError), so
   an invalid override falls back to the default instead. */
const configuredTimeZone = process.env.NEXT_PUBLIC_AUDIT_TIME_ZONE;
export const PLATFORM_TIME_ZONE =
  configuredTimeZone && isValidTimeZone(configuredTimeZone)
    ? configuredTimeZone
    : DEFAULT_TIME_ZONE;

/** Shown beside the date controls. Must be changed together with
    NEXT_PUBLIC_AUDIT_TIME_ZONE / PLATFORM_TIME_ZONE. */
export const PLATFORM_TIME_ZONE_LABEL = "Hora de Cabo Verde";

export const RANGE_PRESETS = ["24h", "7d", "30d"] as const;
export type RangePreset = (typeof RANGE_PRESETS)[number];

export function isRangePreset(value: unknown): value is RangePreset {
  return RANGE_PRESETS.includes(value as RangePreset);
}

export interface InstantRange {
  startDate: string;
  endDate: string;
}

const HOUR_MS = 60 * 60 * 1000;
const PRESET_MS: Record<RangePreset, number> = {
  "24h": 24 * HOUR_MS,
  "7d": 7 * 24 * HOUR_MS,
  "30d": 30 * 24 * HOUR_MS,
};

/** Offset of `timeZone` from UTC at `instant`, in minutes (Cabo Verde → -60). */
export function zoneOffsetMinutes(
  instant: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): number {
  const name =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "longOffset" })
      .formatToParts(instant)
      .find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  // "GMT" for UTC itself, otherwise "GMT-01:00" / "GMT+05:30".
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/** "Last N": ends at `now`, which callers resolve at query time, not page load. */
export function presetToInstants(preset: RangePreset, now: Date): InstantRange {
  return {
    startDate: new Date(now.getTime() - PRESET_MS[preset]).toISOString(),
    endDate: now.toISOString(),
  };
}

function splitYmd(ymd: string): [number, number, number] {
  const [y, m, d] = ymd.split("-").map(Number);
  return [y, m, d];
}

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = splitYmd(ymd);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

function zonedMidnightUtc(ymd: string, timeZone: string): Date {
  const [y, m, d] = splitYmd(ymd);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const offset = zoneOffsetMinutes(new Date(utcMidnight), timeZone);
  return new Date(utcMidnight - offset * 60_000);
}

/** Whole days, both inclusive: 00:00:00.000 on `from` to 23:59:59.999 on `to`. */
export function dayRangeToInstants(
  fromYmd: string,
  toYmd: string,
  timeZone: string = PLATFORM_TIME_ZONE,
): InstantRange {
  const start = zonedMidnightUtc(fromYmd, timeZone);
  const end = zonedMidnightUtc(addDaysYmd(toYmd, 1), timeZone).getTime() - 1;
  return {
    startDate: start.toISOString(),
    endDate: new Date(end).toISOString(),
  };
}

export function isValidYmd(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [y, m, d] = splitYmd(value);
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function todayYmd(
  now: Date,
  timeZone: string = PLATFORM_TIME_ZONE,
): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/* The calendar works in the browser's local days; these two only move a
   picked day in and out of it. The zone conversion happens in
   `dayRangeToInstants`. */
export function ymdToLocalDate(ymd: string): Date {
  const [y, m, d] = splitYmd(ymd);
  return new Date(y, m - 1, d);
}

export function localDateToYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatYmd(ymd: string): string {
  const [y, m, d] = ymd.split("-");
  return `${d}/${m}/${y}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat("pt-PT", {
  timeZone: PLATFORM_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export function formatAuditDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateTimeFormatter.format(date);
}
