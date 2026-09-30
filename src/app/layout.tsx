import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";

import { IGRPRootLayout } from "@igrp/framework-next";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";
import { getLocale, getMessages } from "next-intl/server";

import { I18nProvider } from "@/i18n/components/i18n-provider";
import { createConfig } from "@/igrp.template.config";
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
  const [layoutConfig, locale, messages] = await Promise.all([
    getLayoutConfig(),
    getLocale(),
    getMessages(),
  ]);
  const config = await createConfig(layoutConfig);

  // TODO(i18n): pass lang={locale} once @igrp/framework-next with IGRPRootLayout lang prop is released
  return (
    <IGRPRootLayout config={config}>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </IGRPRootLayout>
  );
}
