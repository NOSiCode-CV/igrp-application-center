import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { IGRPRootLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";
import { createConfig } from "@igrp/template-config";

import { getLayoutConfig } from "@/lib/dal";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "IGRP | Centro de Aplicações",
  description: "IGRP | Centro de Aplicações",
  icons: { icon: `${basePath}/logo-no-text.png` },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await getLayoutConfig();
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
