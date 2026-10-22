export const DEFAULT_TIME_ZONE = "Atlantic/Cape_Verde";

/** `IGRP_TIME_ZONE` when it is a valid IANA zone; otherwise the default (warned once). */
export function resolveTimeZone(raw: string | undefined): string {
  if (!raw) return DEFAULT_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en", { timeZone: raw });
    return raw;
  } catch {
    console.warn(
      `IGRP_TIME_ZONE "${raw}" is not a valid time zone; using ${DEFAULT_TIME_ZONE}.`,
    );
    return DEFAULT_TIME_ZONE;
  }
}
