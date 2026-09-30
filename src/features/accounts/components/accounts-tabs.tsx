"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";

import { ROUTES } from "@/lib/constants";

const TABS = [
  { href: ROUTES.OAUTH_CLIENTS, label: "Clientes OAuth" },
  { href: ROUTES.SERVICE_ACCOUNTS, label: "Contas de Serviço" },
] as const;

/**
 * Same `Tabs` control as `/settings/users`, but each tab is a route: the
 * triggers render as links, so the section keeps its own URL (deep links,
 * middle-click, back button) and the layout's children fill the one panel.
 */
export function AccountsTabs({ children }: { children?: React.ReactNode }) {
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
      <TabsList aria-label="Secções de Contas e Serviços">
        {TABS.map((tab) => (
          <TabsTrigger key={tab.href} value={tab.href} asChild>
            <Link
              href={tab.href}
              aria-current={tab.href === current ? "page" : undefined}
            >
              {tab.label}
            </Link>
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={current}>{children}</TabsContent>
    </Tabs>
  );
}
