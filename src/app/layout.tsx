import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";

import {
  IGRPRootLayout,
  igrpBrandingMetadata,
  igrpResolveRequestBranding,
} from "@igrp/framework-next";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";
import { getTranslations } from "next-intl/server";

import { createConfig } from "@/igrp.template.config";
import { getLayoutConfig } from "@/lib/dal";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

// The favicon follows the organization Brand when `IGRP_BRANDING_ENABLED=true`;
// otherwise (and on any failure) the app's own icon.
export async function generateMetadata(): Promise<Metadata> {
  const config = await createConfig(await getLayoutConfig());
  const branding = await igrpResolveRequestBranding(config);
  const title = (await getTranslations("app"))("title");
  return {
    title,
    description: title,
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
  // Set per request by the middleware; it also goes in the CSP's script-src.
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <IGRPRootLayout config={config} nonce={nonce}>
      {children}
    </IGRPRootLayout>
  );
}
