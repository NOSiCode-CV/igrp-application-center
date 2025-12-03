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
  const footerMwnu = getMockMenusFooter().mockMenusFooter;
  const apps = getMockApps().mockApps;

  function basePath(bp: string) {
    if (!bp) return "/api/auth";

    if (bp.startsWith("/") && bp.endsWith("/")) return `${bp}api/auth`;
    if (bp.startsWith("/") && !bp.endsWith("/")) return `${bp}/api/auth/`;
    if (!bp.startsWith("/") && bp.endsWith("/")) return `/${bp}api/auth`;
    return `${bp}/api/auth`;
  }

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: process.env.IGRP_PREVIEW_MODE === "true",
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
        footerItems: footerMwnu,
        user: user,
        defaultOpen: true,
        showAppSwitcher: true,
        apps: apps,
        appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "",
      }),
    },
    font: fontVariables,
    showSidebar: options?.showSidebar ?? true,
    showHeader: true,

    layout: {
      ...config,
    },
    apiManagementConfig: {
      baseUrl: process.env.IGRP_APP_MANAGER_API || "",
    },
    toasterConfig: {
      showToaster: true,
      position: "bottom-right",
      richColors: true,
      closeButton: true,
    },
    showSettings: true,
    sessionArgs: {
      refetchInterval: 5 * 60,
      refetchOnWindowFocus: true,
      basePath: basePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
    },
  });
}
