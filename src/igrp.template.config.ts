import { cache } from "react";

import { igrpBuildConfig } from "@igrp/framework-next";
import type { IGRPConfigClient } from "@igrp/framework-next-types";

import { fontVariables } from "@/lib/fonts";
import { isAuthBypass } from "@/lib/utilities";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { IGRP_DEFAULT_MENU } from "@/temp/menus/menus";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockUser } from "@/temp/users/use-mock-user";

import { getPermissions } from "./lib/config/get-permissions";
import { getPackageJson } from "./lib/config/get-pkj";
import { getRoutes } from "./lib/config/get-routes";
import { getSessionArgs } from "./lib/config/get-session-args";

/**
 * Annotated with `IGRPConfigClient` so the whole config object is type-checked
 * here, at its definition site, rather than only where `igrpBuildConfig`
 * consumes it — a missing or misspelled key fails in this file.
 */
const buildConfig: IGRPConfigClient = (config) => {
  // Mock data + framework preview behavior apply under EITHER bypass mode
  // (IGRP_PREVIEW_MODE=true or AUTH_PROVIDER=none) — they must behave the same.
  const bypass = isAuthBypass();

  const routes = getRoutes();
  const appRoutes = routes?.appRoutes ?? [];
  const paramMapBody = routes?.paramMapBody ?? "";

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: bypass,
    syncAccess: process.env.IGRP_SYNC_ACCESS === "true",
    appInformation: getPackageJson(),
    layoutData: {
      getHeaderData: async () => {
        const user = bypass ? getMockUser().mockUser : undefined;
        return {
          user: user,
          userProfileUrl: process.env.NEXT_PUBLIC_IGRP_PROFILE_URL || "",
          notificationsUrl: process.env.NEXT_PUBLIC_IGRP_NOTIFICATION_URL || "",
          showBreadcrumb: true,
          showSearch: true,
          showNotifications: true,
          showUser: true,
          showThemeSwitcher: true,
          showIGRPSidebarTrigger: true,
          showIGRPHeaderTitle: true,
          showIGRPHeaderLogo: true,
          showSettings: true,
          settingsUrl: process.env.NEXT_PUBLIC_IGRP_SETTINGS_URL || "",
        };
      },
      getSidebarData: async () => {
        const user = bypass ? getMockUser().mockUser : undefined;
        const menu = bypass ? getMockMenus().mockMenus : undefined;
        const apps = bypass ? getMockApps().mockApps : undefined;
        return {
          menuItems: menu ?? [],
          user: user,
          defaultOpen: true,
          showAppSwitcher: true,
          apps: apps ?? [],
          appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "",
          showMenuSearch: true,
          showNotifications: true,
        };
      },
    },
    font: fontVariables,

    layout: {
      ...config,
    },
    apiManagementConfig: {
      baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
      serviceId: process.env.IGRP_SERVICE_ID || "",
      m2mClientId: process.env.IGRP_M2M_CLIENT_ID || "",
      m2mClientSecret: process.env.IGRP_M2M_CLIENT_SECRET || "",
      syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",
      syncOnCodeMenuRoles: process.env.IGRP_SYNC_ON_CODE_MENU_ROLES !== "false",
      onCodeMenus: IGRP_DEFAULT_MENU,
      syncPermissions: process.env.IGRP_SYNC_PERMISSIONS === "true",

      onCodePermissions: getPermissions(),
      appRoutes,
      paramMapBody,
    },
    toasterConfig: {
      showToaster: true,
      position: "bottom-right",
      richColors: true,
      closeButton: true,
    },
    sessionArgs: getSessionArgs(),
  });
};

/**
 * Per-request memoized config builder.
 *
 * `app/layout.tsx` and `app/(igrp)/layout.tsx` BOTH build the config on every
 * request. Without this, `igrpBuildConfig` — plus `getRoutes()` (a synchronous
 * file read), `getPermissions()` and `getSessionArgs()` — ran twice per request
 * and produced two distinct config objects for the same render.
 *
 * `cache()` keys on argument identity, and the only argument comes from
 * `getLayoutConfig` in `lib/dal.ts`, which is itself `cache()`d — so both
 * layouts pass the *same* object and share one result. That makes it provable
 * that the root layout and the authenticated layout see identical config,
 * rather than merely likely.
 */
export const createConfig: IGRPConfigClient = cache(buildConfig);
