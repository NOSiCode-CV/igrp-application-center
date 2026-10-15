"use client";

import {
  IGRPIcon,
  IGRPPageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";

import { PAGE_HEADER_PROPS } from "@/lib/page-header";

import {
  type AuditTab,
  isAuditTab,
  withRange,
  withTab,
} from "../lib/report-query";
import { useReportQuery } from "../use-audit";
import { AccessReportTab } from "./access-report-tab";
import { ReportDateRange } from "./report-date-range";
import { SettingsReportTab } from "./settings-report-tab";

/* Choosing the report is the page's first decision, so each option says in
   plain words what it covers. Still Tabs underneath: arrow keys, roles and
   aria-selected come from the primitive. The selected tile gets a filled icon
   badge and a ring; its background stays the card's. Ring, not border, and
   `!` on the background: the primitive's own dark-mode active border and
   background would otherwise win, and `dark:` colour overrides are
   off-limits (check:ui). */
const REPORTS: {
  value: AuditTab;
  title: string;
  description: string;
  icon: string;
}[] = [
  {
    value: "access",
    title: "Acessos",
    description: "Quem entrou na plataforma e o que fez em cada módulo.",
    icon: "LogIn",
  },
  {
    value: "settings",
    title: "Configurações",
    description:
      "Alterações a aplicações, utilizadores, perfis, permissões e menus.",
    icon: "SlidersHorizontal",
  },
];

export function AuditScreen() {
  const [query, setQuery] = useReportQuery();
  const period = (
    <ReportDateRange
      range={query.range}
      onChange={(range) => setQuery(withRange(query, range))}
    />
  );

  return (
    <div className="flex flex-col gap-8">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title="Auditoria e Relatórios"
        description="Consulte os acessos e as alterações de configuração registados na plataforma."
        showBackButton
        urlBackButton="/settings"
      />

      <Tabs
        className="flex flex-col gap-6"
        value={query.tab}
        onValueChange={(tab) => {
          if (isAuditTab(tab)) setQuery(withTab(query, tab));
        }}
      >
        <TabsList
          aria-label="Relatórios"
          className="grid w-full grid-cols-1 gap-3 bg-transparent p-0 group-data-horizontal/tabs:h-auto md:grid-cols-2"
        >
          {REPORTS.map((report) => (
            <TabsTrigger
              key={report.value}
              value={report.value}
              className="group/tile h-auto items-start justify-start gap-3 whitespace-normal rounded-xl border-border bg-card p-4 text-left text-muted-foreground not-data-active:hover:bg-muted data-active:bg-card! data-active:text-foreground data-active:shadow-none data-active:ring-2 data-active:ring-primary"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors motion-reduce:transition-none group-data-active/tile:bg-primary group-data-active/tile:text-primary-foreground">
                <IGRPIcon
                  iconName={report.icon}
                  className="size-4.5"
                  aria-hidden="true"
                />
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-base font-semibold text-foreground">
                  {report.title}
                </span>
                <span className="text-sm font-normal">
                  {report.description}
                </span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* One period for every report: it survives tab switches; the
            filters under it don't. */}
        {REPORTS.map((report) => (
          <TabsContent key={report.value} value={report.value}>
            {query.tab === report.value &&
              (report.value === "access" ? (
                <AccessReportTab
                  query={query}
                  onQueryChange={setQuery}
                  period={period}
                />
              ) : (
                <SettingsReportTab
                  query={query}
                  onQueryChange={setQuery}
                  period={period}
                />
              ))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
