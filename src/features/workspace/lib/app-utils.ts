import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export const APP_CATALOG_SECTION_ID = "app-catalog";

type AppTileColor = { bg: string; text: string };

const TILE_COLORS: AppTileColor[] = [
  { bg: "bg-indigo-100", text: "text-indigo-700" },
  { bg: "bg-blue-100", text: "text-blue-700" },
  { bg: "bg-purple-100", text: "text-purple-700" },
  { bg: "bg-emerald-100", text: "text-emerald-700" },
  { bg: "bg-amber-100", text: "text-amber-700" },
  { bg: "bg-rose-100", text: "text-rose-700" },
  { bg: "bg-cyan-100", text: "text-cyan-700" },
  { bg: "bg-orange-100", text: "text-orange-700" },
];

export function getAppTileColor(code: string): AppTileColor {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0xffff;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}

/** Formats an ISO `lastAccess` timestamp as "Opened <relative time>". */
export function getLastOpenedLabel(
  lastAccess: string | null | undefined,
  now = new Date(),
): string {
  if (!lastAccess) return "Opened recently";

  const date = new Date(lastAccess);
  if (Number.isNaN(date.getTime())) return "Opened recently";

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Opened just now";
  if (diffMins < 60) {
    return `Opened ${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Opened ${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Opened yesterday";
  if (diffDays < 7) {
    return `Opened ${date.toLocaleDateString("en-US", { weekday: "long" })}`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `Opened ${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
}

/** Resolves the launch URL for an app card. Mirrors the legacy home launcher's logic. */
export function getAppHref(app: ApplicationDTO): string {
  if (app.code === "APP_IGRP_CENTER") return "/applications";
  return app.url ?? app.slug ?? "";
}

export function isExternalAppHref(app: ApplicationDTO, href: string): boolean {
  return app.type === "EXTERNAL" || /^https?:\/\//i.test(href);
}
