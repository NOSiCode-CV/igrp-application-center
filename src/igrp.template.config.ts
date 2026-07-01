import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
} from "@igrp/framework-next-types";

import { fontVariables } from "@/lib/fonts";
import { isAuthBypass } from "@/lib/utilities";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { IGRP_DEFAULT_MENU } from "@/temp/menus/menus";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockUser } from "@/temp/users/use-mock-user";

import { getPackageJson } from "./lib/config/get-pkj";
import { getRoutes } from "./lib/config/get-routes";
import { getSessionArgs } from "./lib/config/get-session-args";

export function createConfig(
  config: IGRPLayoutConfigArgs,
): Promise<IGRPConfigArgs> {
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
    layoutMockData: {
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
          showIGRPHeaderTitle: false,
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
}
