import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { PLATFORM_TIME_ZONE } from "@/features/audit/lib/platform-time";

export const APP_CATALOG_SECTION_ID = "app-catalog";

/** This portal's own application code — never listed as a launchable app on home. */
export const CURRENT_APP_CODE = "APP_IGRP_CENTER";

export function excludeCurrentApp<T extends { code: string }>(apps: T[]): T[] {
  return apps.filter((app) => app.code !== CURRENT_APP_CODE);
}

type AppTileColor = { bg: string; text: string };

const TILE_COLORS: AppTileColor[] = [
  { bg: "bg-app-tile-1", text: "text-app-tile-1-foreground" },
  { bg: "bg-app-tile-2", text: "text-app-tile-2-foreground" },
  { bg: "bg-app-tile-3", text: "text-app-tile-3-foreground" },
  { bg: "bg-app-tile-4", text: "text-app-tile-4-foreground" },
  { bg: "bg-app-tile-5", text: "text-app-tile-5-foreground" },
];

export function getAppTileColor(code: string): AppTileColor {
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = (hash * 31 + code.charCodeAt(i)) & 0xffff;
  }
  return TILE_COLORS[hash % TILE_COLORS.length];
}

/** A `workspace.lastOpened.*` message key plus its values. */
export type LastOpened =
  | { key: "justNow" | "yesterday" }
  | { key: "minutes" | "hours" | "weeks"; count: number }
  /** `day`: 0 (Sunday) … 6, in the platform zone — picks "no"/"na" in pt. */
  | { key: "weekday"; date: Date; day: number };

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const platformWeekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: PLATFORM_TIME_ZONE,
});

/**
 * How long ago an app was opened, as a message key for the caller to
 * translate. `null` when there is no usable timestamp — the caller then
 * renders nothing rather than claim a time it does not have.
 */
export function getLastOpened(
  lastAccess: string | null | undefined,
  now = new Date(),
): LastOpened | null {
  if (!lastAccess) return null;

  const date = new Date(lastAccess);
  if (Number.isNaN(date.getTime())) return null;

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return { key: "justNow" };
  if (diffMins < 60) return { key: "minutes", count: diffMins };

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return { key: "hours", count: diffHours };

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return { key: "yesterday" };
  if (diffDays < 7) {
    return {
      key: "weekday",
      date,
      day: WEEKDAY_INDEX[platformWeekday.format(date)] ?? 1,
    };
  }

  return { key: "weeks", count: Math.floor(diffDays / 7) };
}

export function getAppHref(app: ApplicationDTO): string {
  if (app.code === CURRENT_APP_CODE) return "/applications";
  if (app.url) return app.url;
  if (!app.slug) return "";
  return app.slug.startsWith("/") ? app.slug : `/${app.slug}`;
}

export function isExternalAppHref(app: ApplicationDTO, href: string): boolean {
  return app.type === "EXTERNAL" || /^https?:\/\//i.test(href);
}

const NEW_APP_WINDOW_DAYS = 14;

export function isRecentlyAdded(
  createdDate: string | null | undefined,
  now = new Date(),
): boolean {
  if (!createdDate) return false;
  const created = new Date(createdDate);
  if (Number.isNaN(created.getTime())) return false;
  const diffDays = (now.getTime() - created.getTime()) / 86_400_000;
  return diffDays >= 0 && diffDays <= NEW_APP_WINDOW_DAYS;
}
