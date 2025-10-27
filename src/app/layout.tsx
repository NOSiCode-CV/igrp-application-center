import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { IGRPRootLayout } from "@igrp/framework-next";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";

import { configLayout } from "@/actions/igrp/layout";
import { createConfig } from "@/igrp.template.config";
import { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";

export const metadata: Metadata = {
  title: "IGRP | Centro de Aplicações",
  description: "IIGRP | Centro de Aplicações",
  icons: { icon: "/igrp/logo-no-text.png" },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await configLayout();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
