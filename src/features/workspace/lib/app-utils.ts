import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export const APP_CATALOG_SECTION_ID = "app-catalog";

type AppTileColor = { bg: string; text: string };

/**
 * Two-stop pairs, not `bg-chart-N/15 text-chart-N`.
 *
 * The old pattern set the tile letter in the same token as its own 15% wash,
 * which makes contrast a pure function of that token's lightness — `--chart-1`
 * measured 1.40:1 in light mode and `--chart-3/4/5` under 2.1:1 in dark, so the
 * initial was rendered but invisible. It also borrowed the chart series colours,
 * which would tie app-tile theming to chart theming forever.
 *
 * Each `--app-tile-N` / `--app-tile-N-foreground` pair holds >= 6.6:1 in both
 * themes; see the contract in `src/styles/app-center.css`.
 */
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

/** Formats an ISO `lastAccess` timestamp as "Aberta <tempo relativo>". */
export function getLastOpenedLabel(
  lastAccess: string | null | undefined,
  now = new Date(),
): string {
  if (!lastAccess) return "Aberta recentemente";

  const date = new Date(lastAccess);
  if (Number.isNaN(date.getTime())) return "Aberta recentemente";

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60_000);

  if (diffMins < 1) return "Aberta agora mesmo";
  if (diffMins < 60) {
    return `Aberta há ${diffMins} minuto${diffMins !== 1 ? "s" : ""}`;
  }

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) {
    return `Aberta há ${diffHours} hora${diffHours !== 1 ? "s" : ""}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Aberta ontem";
  if (diffDays < 7) {
    return `Aberta ${date.toLocaleDateString("pt-PT", { weekday: "long" })}`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  return `Aberta há ${diffWeeks} semana${diffWeeks !== 1 ? "s" : ""}`;
}

/** Resolves the launch URL for an app card. Mirrors the legacy home launcher's logic. */
export function getAppHref(app: ApplicationDTO): string {
  if (app.code === "APP_IGRP_CENTER") return "/applications";
  if (app.url) return app.url;
  if (!app.slug) return "";
  // A bare slug ("payroll") resolves relative to whatever route the user is
  // on, so it 404s somewhere unrelated. Anchor it to the root.
  return app.slug.startsWith("/") ? app.slug : `/${app.slug}`;
}

export function isExternalAppHref(app: ApplicationDTO, href: string): boolean {
  return app.type === "EXTERNAL" || /^https?:\/\//i.test(href);
}

const NEW_APP_WINDOW_DAYS = 14;

/** True when `createdDate` falls within the last `NEW_APP_WINDOW_DAYS` days. */
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
