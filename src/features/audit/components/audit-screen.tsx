"use client";

import {
  IGRPPageHeader,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@igrp/igrp-framework-react-design-system";

import { PAGE_HEADER_PROPS } from "@/lib/page-header";

import { isAuditTab, withRange, withTab } from "../lib/report-query";
import { useReportQuery } from "../use-audit";
import { AccessReportTab } from "./access-report-tab";
import { ReportDateRange } from "./report-date-range";
import { SettingsReportTab } from "./settings-report-tab";

export function AuditScreen() {
  const [query, setQuery] = useReportQuery();

  return (
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title="Auditoria e Relatórios"
        description="Consulte os acessos e as alterações de configuração registados na plataforma."
        showBackButton
        urlBackButton="/settings"
      />

      {/* One range for every tab: it survives tab switches; filters don't. */}
      <ReportDateRange
        range={query.range}
        onChange={(range) => setQuery(withRange(query, range))}
      />

      <Tabs
        value={query.tab}
        onValueChange={(tab) => {
          if (isAuditTab(tab)) setQuery(withTab(query, tab));
        }}
      >
        <TabsList>
          <TabsTrigger value="access">Acessos</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        <TabsContent value="access">
          {query.tab === "access" && (
            <AccessReportTab query={query} onQueryChange={setQuery} />
          )}
        </TabsContent>
        <TabsContent value="settings">
          {query.tab === "settings" && (
            <SettingsReportTab query={query} onQueryChange={setQuery} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
