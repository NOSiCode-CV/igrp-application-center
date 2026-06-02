import { igrpBuildConfig } from "@igrp/framework-next";
import type {
  IGRPConfigArgs,
  IGRPLayoutConfigArgs,
} from "@igrp/framework-next-types";
import { fontVariables } from "@/lib/fonts";
import { isPreviewMode } from "@/lib/utils";
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
  const preview = isPreviewMode();

  const routes = getRoutes();
  const appRoutes = routes?.appRoutes ?? [];
  const paramMapBody = routes?.paramMapBody ?? "";

  return igrpBuildConfig({
    appCode: process.env.IGRP_APP_CODE || "",
    previewMode: preview,
    syncAccess: process.env.IGRP_SYNC_ACCESS === "true",
    appInformation: getPackageJson(),
    layoutMockData: {
      getHeaderData: async () => {
        const user = preview ? getMockUser().mockUser : undefined;
        return {
          user: user,
          userProfileUrl: process.env.NEXT_PUBLIC_IGRP_PROFILE_URL || "",
          notificationsUrl: process.env.NEXT_PUBLIC_IGRP_NOTIFICATION_URL || "",
          showBreadcrumb: true,
          showSearch: true,
          showNotifications: true,
          showUser: true,
          showThemeSwitcher: true,
          showIGRPSidebarTrigger: false,
          showIGRPHeaderTitle: false,
          showIGRPHeaderLogo: true,
          showSettings: true,
          settingsUrl: process.env.NEXT_PUBLIC_IGRP_SETTINGS_URL || "",
        };
      },
      getSidebarData: async () => {
        const user = preview ? getMockUser().mockUser : undefined;
        const menu = preview ? getMockMenus().mockMenus : undefined;
        const apps = preview ? getMockApps().mockApps : undefined;
        return {
          menuItems: menu ?? [],
          user: user,
          defaultOpen: true,
          showAppSwitcher: true,
          apps: apps ?? [],
          appCenterUrl: process.env.NEXT_IGRP_APP_CENTER_URL || "",
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
