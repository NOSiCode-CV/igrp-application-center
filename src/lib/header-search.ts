import { fetchMenusAction } from "@igrp/framework-next/actions";
import type {
  IGRPConfigArgs,
  IGRPMenuItemArgs,
  IGRPTargetType,
} from "@igrp/framework-next-types";

import { isAuthBypass } from "@/lib/utilities";

/**
 * Serializable command data for the header search slot.
 *
 * `IGRPCommandItem.onSelect` is a function and cannot cross the Server→Client
 * boundary, so the server resolves plain data here and the client component
 * (`@/components/header/app-search`) builds the handlers.
 *
 * The navigation target stays split into `pageSlug` / `url` / `target` rather
 * than being flattened into an href here: deciding whether a URL is external
 * requires comparing it against the current origin, which only the browser
 * knows. The client resolves it with the same design-system helpers the sidebar
 * uses, so both navigate identically.
 */
export interface AppSearchCommand {
  id: string;
  label: string;
  icon?: string;
  group?: string;
  pageSlug?: string | null;
  url?: string | null;
  target?: IGRPTargetType;
}

/** Menu types that resolve to something navigable. FOLDER/GROUP are containers. */
const NAVIGABLE_MENU_TYPES = new Set([
  "MENU_PAGE",
  "EXTERNAL_PAGE",
  "SYSTEM_PAGE",
]);

function toCommands(menuItems: IGRPMenuItemArgs[]): AppSearchCommand[] {
  const active = menuItems.filter((item) => item.status === "ACTIVE");

  // Container names become command groups, so a leaf shows where it lives.
  const containerNames = new Map(
    active
      .filter((item) => item.type === "FOLDER" || item.type === "GROUP")
      .map((item) => [item.code, item.name]),
  );

  return (
    active
      .filter((item) => NAVIGABLE_MENU_TYPES.has(item.type))
      // An item with neither a slug nor a URL has nowhere to go.
      .filter((item) => Boolean(item.pageSlug || item.url))
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((item) => ({
        id: item.code,
        label: item.name,
        icon: item.icon,
        group: item.parentCode
          ? containerNames.get(item.parentCode)
          : undefined,
        pageSlug: item.pageSlug,
        url: item.url,
        target: item.target,
      }))
  );
}

/**
 * Resolves the header search palette's commands from the application menus.
 *
 * Mirrors how the framework's sidebar provider branches: mock menus under either
 * auth-bypass mode (`IGRP_PREVIEW_MODE=true` or `AUTH_PROVIDER=none`), the
 * access-management menus otherwise. Search is auxiliary chrome, so a failed menu
 * fetch yields an empty palette rather than taking the header down — a 401/403
 * still propagates, since `fetchMenusAction` rethrows the redirect that signals
 * an invalid session.
 */
export async function getHeaderSearchCommands(
  config: IGRPConfigArgs,
): Promise<AppSearchCommand[]> {
  if (isAuthBypass()) {
    const { menuItems } = await config.layoutMockData.getSidebarData();
    return toCommands(menuItems ?? []);
  }

  if (!config.appCode) return [];

  const result = await fetchMenusAction(config.appCode);
  return result.ok ? toCommands(result.data ?? []) : [];
}
