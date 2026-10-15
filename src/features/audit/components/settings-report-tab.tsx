"use client";

import { type ReactNode, useEffect, useMemo } from "react";

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
  nextSort,
  PAGE_SIZES,
  type ReportFilterKey,
  type ReportQuery,
  withFilter,
  withPage,
  withSize,
  withSort,
} from "../lib/report-query";
import { useRedirectOnUnauthorized, useSettingsReport } from "../use-audit";
import {
  ExactMatchInput,
  FilterCombobox,
  FilterSelect,
} from "./filter-controls";
import { ReportEmptyState } from "./report-empty-state";
import { ReportPager } from "./report-pager";
import { ReportQueryPanel } from "./report-query-panel";
import { ReportTableSkeleton } from "./report-table-skeleton";
import {
  renderSettingsDetail,
  settingsColumns,
  settingsRowCanExpand,
} from "./settings-report-columns";

/* IGRPDataTable always applies getPaginationRowModel() and seeds its internal
   pageSize from pageSizePagination[0] (default 50), regardless of
   showPagination={false}. Our own ReportPager already sizes the page server
   side, so the table's internal page must be at least as large as the
   biggest page we can receive, or rows past its default 50 never render. */
const TABLE_PAGE_SIZE = [Math.max(...PAGE_SIZES)];

/* Rows are keyed by index and autoResetExpanded is false (DS default), so with
   keepPreviousData the same table instance survives a page/filter change and
   an expanded row index stays expanded, now showing a different event's diff.
   Remounting the table per selection (same shape as auditKeys.report, plus the sort) resets
   the expanded state along with the data. */
function tableKey(query: ReportQuery): string {
  return JSON.stringify({
    range: query.range,
    page: query.page,
    size: query.size,
    filters: query.filters,
    sort: query.sort,
  });
}

interface ReportTabProps {
  query: ReportQuery;
  onQueryChange: (next: ReportQuery) => void;
}

interface ReportTabViewProps extends ReportTabProps {
  /** The shared period control, shown at the top of the query panel. */
  period?: ReactNode;
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
        id="settings-operation"
        label="Operação"
        options={SETTINGS_OPERATION_OPTIONS}
        value={query.filters.operation}
        onChange={set("operation")}
      />
      <FilterSelect
        id="settings-entity-type"
        label="Tipo"
        options={SETTINGS_ENTITY_TYPE_OPTIONS}
        value={query.filters.entityType}
        onChange={set("entityType")}
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

export function SettingsReportTab({
  query,
  onQueryChange,
  period,
}: ReportTabViewProps) {
  const {
    data,
    error,
    isPending,
    isPlaceholderData,
    isError,
    isFetching,
    refetch,
  } = useSettingsReport(query);
  const rows = useMemo(() => data?.content ?? [], [data]);
  const columns = useMemo(
    () =>
      settingsColumns(query.sort, (field) =>
        onQueryChange(withSort(query, nextSort(query, field))),
      ),
    [query, onQueryChange],
  );
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
      <ReportQueryPanel
        period={period}
        filters={
          <SettingsReportFilterBar
            query={query}
            onQueryChange={onQueryChange}
          />
        }
        range={query.range}
        filterCount={Object.keys(query.filters).length}
        onClearFilters={() => onQueryChange(clearFilters(query))}
      />
      {isError ? (
        <InlineError
          title="Não foi possível carregar o relatório de configurações."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={() => refetch()}
        />
      ) : isPending || isPlaceholderData ? (
        // A new period, filter or page is loading: `keepPreviousData` would
        // otherwise keep the old rows on screen under the new selection.
        // Background refetches of the same selection keep showing the rows.
        <ReportTableSkeleton />
      ) : rows.length === 0 ? (
        <ReportEmptyState
          filtered={hasFilters(query)}
          onClearFilters={() => onQueryChange(clearFilters(query))}
        />
      ) : (
        <>
          <IGRPDataTable
            key={tableKey(query)}
            columns={columns}
            data={rows}
            tableHeaderClassName="bg-muted"
            showPagination={false}
            pageSizePagination={TABLE_PAGE_SIZE}
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
