import "@/styles/globals.css";

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";

import { IGRPRootLayout } from "@igrp/framework-next";
import type { IGRPLayoutConfigArgs } from "@igrp/framework-next-types";
import { IGRP_META_THEME_COLORS } from "@igrp/igrp-framework-react-design-system";
import { createConfig } from "@igrp/template-config";
import { getLocale, getMessages } from "next-intl/server";

import { I18nProvider } from "@/i18n/components/i18n-provider";
import { getLayoutConfig } from "@/lib/dal";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "IGRP | Centro de Aplicações",
  description: "IGRP | Centro de Aplicações",
  icons: { icon: "/logo-no-text.png" },
};

export const viewport: Viewport = {
  themeColor: IGRP_META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [layoutConfig, locale, messages] = await Promise.all([
    getLayoutConfig(),
    getLocale(),
    getMessages(),
  ]);
  const config = await createConfig(layoutConfig as IGRPLayoutConfigArgs);

  // TODO(i18n): pass lang={locale} once @igrp/framework-next with IGRPRootLayout lang prop is released
  return (
    <IGRPRootLayout config={config}>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </IGRPRootLayout>
  );
}
