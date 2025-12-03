import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
import { configLayout } from "@/actions/igrp/layout";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs, {
    showBreadcrumb: true,
    showSidebar: false,
    showNotifications: true,
    showSearch: false,
    showIGRPHeaderLogo: true,
    showIGRPHeaderTitle: true,
    showIGRPSidebarTrigger: false,
    showSettings: true,
    settingsUrl: "/settings",
    settingsIcon: "Settings"
  });

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}
