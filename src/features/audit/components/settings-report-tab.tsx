"use client";

import { useEffect, useMemo } from "react";

import { IGRPDataTable } from "@igrp/igrp-framework-react-design-system";

import { InlineError } from "@/components/inline-error";
import { useUsers } from "@/features/users/use-users";

import {
  SETTINGS_AREA_OPTIONS,
  SETTINGS_ENTITY_TYPE_OPTIONS,
  SETTINGS_OPERATION_OPTIONS,
} from "../lib/audit-labels";
import {
  clearFilters,
  hasFilters,
  type ReportFilterKey,
  type ReportQuery,
  withFilter,
  withPage,
  withSize,
} from "../lib/report-query";
import { useRedirectOnUnauthorized, useSettingsReport } from "../use-audit";
import {
  ExactMatchInput,
  FilterCombobox,
  FilterSelect,
} from "./filter-controls";
import { ReportEmptyState } from "./report-empty-state";
import { ReportPager } from "./report-pager";
import { ReportTableSkeleton } from "./report-table-skeleton";
import {
  renderSettingsDetail,
  SETTINGS_COLUMNS,
  settingsRowCanExpand,
} from "./settings-report-columns";

interface ReportTabProps {
  query: ReportQuery;
  onQueryChange: (next: ReportQuery) => void;
}

function SettingsReportFilterBar({ query, onQueryChange }: ReportTabProps) {
  const { data: users } = useUsers();
  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        label: u.name ? `${u.name} (${u.email})` : u.email,
        value: u.username ?? u.email,
      })),
    [users],
  );

  const set = (key: ReportFilterKey) => (value: string | undefined) =>
    onQueryChange(withFilter(query, key, value));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <FilterCombobox
        id="settings-performed-by"
        label="Realizado por"
        options={userOptions}
        value={query.filters.performedBy}
        onChange={set("performedBy")}
      />
      <FilterSelect
        id="settings-area"
        label="Área"
        options={SETTINGS_AREA_OPTIONS}
        value={query.filters.area}
        onChange={set("area")}
      />
      <FilterSelect
        id="settings-entity-type"
        label="Tipo"
        options={SETTINGS_ENTITY_TYPE_OPTIONS}
        value={query.filters.entityType}
        onChange={set("entityType")}
      />
      <FilterSelect
        id="settings-operation"
        label="Operação"
        options={SETTINGS_OPERATION_OPTIONS}
        value={query.filters.operation}
        onChange={set("operation")}
      />
      <ExactMatchInput
        id="settings-entity-name"
        label="Entidade"
        placeholder="Nome exato"
        value={query.filters.entityName}
        onCommit={set("entityName")}
      />
    </div>
  );
}

export function SettingsReportTab({ query, onQueryChange }: ReportTabProps) {
  const { data, error, isPending, isError, isFetching, refetch } =
    useSettingsReport(query);
  const rows = useMemo(() => data?.content ?? [], [data]);
  useRedirectOnUnauthorized(error);

  useEffect(() => {
    if (
      data &&
      data.content.length === 0 &&
      data.totalElements > 0 &&
      query.page > 0
    ) {
      onQueryChange(withPage(query, 0));
    }
  }, [data, query, onQueryChange]);

  return (
    <div className="flex flex-col gap-4">
      <SettingsReportFilterBar query={query} onQueryChange={onQueryChange} />
      {isError ? (
        <InlineError
          title="Não foi possível carregar o relatório de configurações."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={() => refetch()}
        />
      ) : isPending ? (
        <ReportTableSkeleton />
      ) : rows.length === 0 ? (
        <ReportEmptyState
          filtered={hasFilters(query)}
          onClearFilters={() => onQueryChange(clearFilters(query))}
        />
      ) : (
        <>
          <IGRPDataTable
            columns={SETTINGS_COLUMNS}
            data={rows}
            showPagination={false}
            getRowCanExpand={settingsRowCanExpand}
            renderSubComponent={renderSettingsDetail}
          />
          <ReportPager
            page={query.page}
            size={query.size}
            totalPages={data?.totalPages ?? 0}
            totalElements={data?.totalElements ?? 0}
            disabled={isFetching}
            onPageChange={(page) => onQueryChange(withPage(query, page))}
            onSizeChange={(size) => onQueryChange(withSize(query, size))}
          />
        </>
      )}
    </div>
  );
}
