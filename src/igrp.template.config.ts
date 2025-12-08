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

interface IGRPConfigOptions {
  showSidebar?: boolean;
  showBreadcrumb?: boolean;
  showSearch?: boolean;
  showNotifications?: boolean;
  showIGRPHeaderTitle?: boolean;
  showIGRPSidebarTrigger?: boolean;
  showIGRPHeaderLogo?: boolean;
  headerLogo?: string;
  showSettings?: boolean;
  settingsUrl?: string;
  settingsIcon?: string;
}

export function createConfig(
  config: IGRPLayoutConfigArgs,
  options?: IGRPConfigOptions,
): Promise<IGRPConfigArgs> {
  const user = getMockUser().mockUser;
  const menu = getMockMenus().mockMenus;
  const footerMenu = getMockMenusFooter().mockMenusFooter;
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
        showBreadcrumb: options?.showBreadcrumb ?? true,
        showSearch: options?.showSearch ?? true,
        showNotifications: options?.showNotifications ?? true,
        showUser: true,
        showThemeSwitcher: true,
        showIGRPHeaderTitle: options?.showIGRPHeaderTitle ?? false,
        showIGRPSidebarTrigger: options?.showIGRPSidebarTrigger ?? true,
        showIGRPHeaderLogo: options?.showIGRPHeaderLogo ?? false,
        headerLogo: "/igrp-logo.svg",
        showSettings: options?.showSettings ?? false,
        settingsUrl: options?.settingsUrl || "/settings",
        settingsIcon: options?.settingsIcon || "Settings",
      }),
      getSidebarData: async () => ({
        menuItems: menu,
        footerItems: footerMenu,
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
