import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import {
  IGRPRootLayout,
  igrpBrandingMetadata,
  igrpResolveRequestBranding,
} from "@igrp/framework-next";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";

import { createConfig } from "@/igrp.template.config";
import { getLayoutConfig } from "@/lib/dal";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The favicon follows the organization Brand when `IGRP_BRANDING_ENABLED=true`;
// otherwise (and on any failure) the app's own icon.
export async function generateMetadata(): Promise<Metadata> {
  const config = await createConfig(await getLayoutConfig());
  const branding = await igrpResolveRequestBranding(config);
  return {
    title: "IGRP | Template Aplicações",
    description: "IGRP | Template Aplicações",
    icons: igrpBrandingMetadata(branding, `${basePath}/logo-no-text.png`),
  };
}

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const layoutConfig = await getLayoutConfig();
  const config = await createConfig(layoutConfig);

  return <IGRPRootLayout config={config}>{children}</IGRPRootLayout>;
}
