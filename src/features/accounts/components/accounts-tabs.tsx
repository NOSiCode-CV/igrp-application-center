"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { ROUTES } from "@/lib/constants";

const TABS = [
  { href: ROUTES.OAUTH_CLIENTS, labelKey: "oauthClients" },
  { href: ROUTES.SERVICE_ACCOUNTS, labelKey: "serviceAccounts" },
] as const;

/**
 * Same `Tabs` control as `/settings/users`, but each tab is a route: the
 * triggers render as links, so the section keeps its own URL (deep links,
 * middle-click, back button) and the layout's children fill the one panel.
 */
export function AccountsTabs({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("accounts.tabs");
  const pathname = usePathname();
  const current =
    TABS.find(
      (tab) => pathname === tab.href || pathname.startsWith(`${tab.href}/`),
    )?.href ?? TABS[0].href;

  return (
    <Tabs
      value={current}
      activationMode="manual"
      className="flex flex-col gap-6"
    >
      <TabsList aria-label={t("label")}>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} asChild>
            <Link
              href={tab.href}
              aria-current={tab.href === current ? "page" : undefined}
            >
              {t(tab.labelKey)}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={current}>{children}</TabsContent>
    </Tabs>
  );
}
