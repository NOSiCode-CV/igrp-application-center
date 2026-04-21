import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
} from "@igrp/framework-next-types";
import { fontVariables } from "@/lib/fonts";
import { getMockApps } from "@/temp/applications/use-mock-apps";
import { getMockMenus } from "@/temp/menus/use-mock-menus";
import { getMockMenusFooter } from "@/temp/menus/use-mock-menus-footer";
import { getMockUser } from "@/temp/users/use-mock-user";
import { getPackageJson } from "./lib/config/get-pkj";
import { getSessionArgs } from "./lib/config/get-session-args";
import { getRoutes } from "./lib/config/get-routes";

export function createConfig(
  config: IGRPLayoutConfigArgs
): Promise<IGRPConfigArgs> {
  const user = getMockUser().mockUser;
  const menu = getMockMenus().mockMenus;
  const apps = getMockApps().mockApps;

  const routes = getRoutes();
  const appRoutes = routes?.appRoutes ?? [];
  const paramMapBody = routes?.paramMapBody ?? "";

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: process.env.IGRP_PREVIEW_MODE === "true",
    syncAccess: process.env.IGRP_SYNC_ACCESS === "true",
    appInformation: getPackageJson(),
    layoutMockData: {
      getHeaderData: async () => ({
        user: user,
        showBreadcrumb: true,
        showSearch: true,
        showNotifications: true,
        showUser: true,
        showThemeSwitcher: true,
        showIGRPHeaderTitle: true,
        showIGRPSidebarTrigger: false,
        showIGRPHeaderLogo: false,
        showSettings: true,
        settingsUrl: "/settings",
        settingsIcon: "Settings",
      }),
      getSidebarData: async () => ({
        menuItems: menu,
        user: user,
        defaultOpen: true,
        showAppSwitcher: true,
        apps: apps,
        appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "",
      }),
    },
    font: fontVariables,
    showSidebar: false,
    showHeader: true,

    layout: {
      ...config,
    },
    apiManagementConfig: {
      baseUrl: process.env.IGRP_ACCESS_MANAGEMENT_API || "",
      m2mServiceId: process.env.IGRP_M2M_SERVICE_ID || "",
      m2mToken: process.env.IGRP_M2M_TOKEN || "",
      syncOnCodeMenus: process.env.IGRP_SYNC_ON_CODE_MENUS === "true",
      appRoutes,
      paramMapBody,
    },
    toasterConfig: {
      showToaster: true,
      position: "bottom-right",
      richColors: true,
      closeButton: true,
    },
    showSettings: true,
    sessionArgs: getSessionArgs(),
  });
}