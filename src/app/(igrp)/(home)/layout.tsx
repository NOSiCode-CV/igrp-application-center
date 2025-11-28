import { IGRPLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { createConfig } from "@igrp/template-config";
import { configLayout } from "@/actions/igrp/layout";

export default async function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs, {
    showBreadcrumb: false,
    showSidebar: false,
    showNotifications: true,
    showSearch: false,
    showIGRPHeaderLogo: true,
    showIGRPHeaderTitle: true,
    showIGRPSidebarTrigger: false,
    headerLogo: "https://minio-demoigrp.nosi.cv/igrp/public/QQ/a467f627-5602-4ac2-4ac2-1fb6072c71c8/da380d9d-c137-431d-a191-67a11307425a_logo.webp",
  });

  return <IGRPLayout config={config}>{children}</IGRPLayout>;
}