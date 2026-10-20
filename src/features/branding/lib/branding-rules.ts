import type { IGRPBranding } from "@igrp/framework-next-types";
import { igrpParseBranding } from "@igrp/framework-next-ui";

/* Pure rules shared by the editor (feedback) and saveBranding (enforcement). */

export const MAX_FAVICON_BYTES = 256 * 1024;
export const FAVICON_ACCEPT =
  "image/png,image/x-icon,image/vnd.microsoft.icon,.ico";

const ICO_TYPES = new Set(["image/x-icon", "image/vnd.microsoft.icon"]);
const NORMALIZED_OKLCH =
  /^oklch\(\d+(\.\d+)? \d+(\.\d+)? \d+(\.\d+)?( \/ \d+(\.\d+)?)?\)$/;

/** Read at call time so tests can stub it; Next inlines it in the client bundle. */
export function minioBaseUrl(): string {
  return process.env.NEXT_PUBLIC_IGRP_MINIO_URL ?? "";
}

/** Same origin (scheme, host, port) as the MinIO base, so only our own uploads can be saved. */
export function isOnMinioHost(url: string, minioUrl: string): boolean {
  try {
    return new URL(url).origin === new URL(minioUrl).origin;
  } catch {
    return false;
  }
}

/** PNG or ICO, at most 256 KB. Some browsers report ICO with an empty type. */
export function isFaviconFile(file: File): boolean {
  const ico =
    ICO_TYPES.has(file.type) || (file.type === "" && /\.ico$/i.test(file.name));
  return file.size <= MAX_FAVICON_BYTES && (file.type === "image/png" || ico);
}

export function isNormalizedOklch(value: string): boolean {
  return NORMALIZED_OKLCH.test(value);
}

/**
 * The cleaned Brand when `raw` is something the editor could have produced:
 * within 64 KB (the framework parser rejects larger), nothing dropped, only
 * catalog Token names (so `--radius` or `--spacing` cannot be set by a direct
 * action call), every colour in normalized OKLCH, every logo on the MinIO
 * origin. Otherwise `null`.
 */
export function checkSavableBranding(
  raw: string,
  minioUrl: string,
  tokenNames: readonly string[],
): IGRPBranding | null {
  const { branding, dropped } = igrpParseBranding(raw);
  if (!branding || dropped > 0) return null;

  const maps = [branding.tokens.light ?? {}, branding.tokens.dark ?? {}];
  const known = new Set(tokenNames);
  if (!maps.every((map) => Object.keys(map).every((name) => known.has(name)))) {
    return null;
  }
  if (!maps.every((map) => Object.values(map).every(isNormalizedOklch))) {
    return null;
  }

  const urls = Object.values(branding.logos).flatMap((slot) =>
    slot ? [slot.light, ...(slot.dark ? [slot.dark] : [])] : [],
  );
  if (!urls.every((url) => isOnMinioHost(url, minioUrl))) return null;

  return branding;
}
