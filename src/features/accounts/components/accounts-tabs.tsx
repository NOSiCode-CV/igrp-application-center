"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const TABS = [
  { href: ROUTES.OAUTH_CLIENTS, label: "Clientes OAuth" },
  { href: ROUTES.SERVICE_ACCOUNTS, label: "Contas de Serviço" },
] as const;

export function AccountsTabs() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Secções de Contas e Serviços"
      className="border-b border-border"
    >
      <ul className="flex gap-7">
        {TABS.map((tab) => {
          const current =
            pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "-mb-px inline-flex h-10 items-center border-b-2 font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  current
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
