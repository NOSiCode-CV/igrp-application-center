import type { IGRPBrandingTokenGroup } from "@igrp/framework-next-types";
import { IGRP_BRANDING_CORE_TOKENS } from "@igrp/framework-next-ui";

import type pt from "@/i18n/messages/pt.json";

import { APP_BRANDING_TOKENS, type AppTokenGroup } from "./app-tokens";

export type BrandingGroupKey = IGRPBrandingTokenGroup | AppTokenGroup;
export type BrandingTokenLabelKey = keyof (typeof pt)["branding"]["tokens"];
export type CatalogToken = { name: string; labelKey: BrandingTokenLabelKey };
export type CatalogGroup = { key: BrandingGroupKey; tokens: CatalogToken[] };

/* Display order: brand first (open by default), app-tier groups next to the
   core group they extend. */
const GROUP_ORDER: BrandingGroupKey[] = [
  "brand",
  "surface",
  "text",
  "status",
  "subtle",
  "sidebar",
  "chart",
  "tiles",
  "other",
  "appOther",
];

/** `--app-tile-1-foreground` → `appTile1Foreground` (messages use camelCase keys). */
export function labelKeyOf(name: string): string {
  return name
    .slice(2)
    .replace(/-([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

const ALL = [...IGRP_BRANDING_CORE_TOKENS, ...APP_BRANDING_TOKENS];

// The catalog test proves every labelKey exists in the messages.
export const BRANDING_GROUPS: CatalogGroup[] = GROUP_ORDER.map((key) => ({
  key,
  tokens: ALL.filter((t) => t.group === key).map((t) => ({
    name: t.name,
    labelKey: labelKeyOf(t.name) as BrandingTokenLabelKey,
  })),
}));

export const BRANDING_TOKEN_NAMES = ALL.map((t) => t.name);
