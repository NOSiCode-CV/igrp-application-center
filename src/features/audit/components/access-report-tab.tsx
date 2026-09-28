"use client";

import { useEffect, useMemo } from "react";

import { IGRPDataTable } from "@igrp/igrp-framework-react-design-system";

import { InlineError } from "@/components/inline-error";
import { useApplications } from "@/features/applications/use-applications";
import { useUsers } from "@/features/users/use-users";

import { ACCESS_STATUS_OPTIONS } from "../lib/audit-labels";
import {
  clearFilters,
  hasFilters,
  PAGE_SIZES,
  type ReportFilterKey,
  type ReportQuery,
  withFilter,
  withPage,
  withSize,
} from "../lib/report-query";
import { useAccessReport, useRedirectOnUnauthorized } from "../use-audit";
import { ACCESS_COLUMNS } from "./access-report-columns";
import {
  ExactMatchInput,
  FilterCombobox,
  FilterSelect,
} from "./filter-controls";
import { ReportEmptyState } from "./report-empty-state";
import { ReportPager } from "./report-pager";
import { ReportTableSkeleton } from "./report-table-skeleton";

/* IGRPDataTable always applies getPaginationRowModel() and seeds its internal
   pageSize from pageSizePagination[0] (default 50), regardless of
   showPagination={false}. Our own ReportPager already sizes the page server
   side, so the table's internal page must be at least as large as the
   biggest page we can receive, or rows past its default 50 never render. */
const TABLE_PAGE_SIZE = [Math.max(...PAGE_SIZES)];

interface ReportTabProps {
  query: ReportQuery;
  onQueryChange: (next: ReportQuery) => void;
}

function AccessReportFilterBar({ query, onQueryChange }: ReportTabProps) {
  const { data: users } = useUsers();
  const { data: applications } = useApplications();

  /* Values must equal what the report stores, exactly (§9.8/§9.9): the login
     name for users, the application code for modules. */
  const userOptions = useMemo(
    () =>
      (users ?? []).map((u) => ({
        label: u.name ? `${u.name} (${u.email})` : u.email,
        value: u.username ?? u.email,
      })),
    [users],
  );
  const applicationOptions = useMemo(
    () => (applications ?? []).map((a) => ({ label: a.name, value: a.code })),
    [applications],
  );

  const set = (key: ReportFilterKey) => (value: string | undefined) =>
    onQueryChange(withFilter(query, key, value));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <FilterCombobox
        id="access-username"
        label="Utilizador"
        options={userOptions}
        value={query.filters.username}
        onChange={set("username")}
      />
      <FilterCombobox
        id="access-module"
        label="Módulo"
        options={applicationOptions}
        value={query.filters.module}
        onChange={set("module")}
      />
      {/* The server matches `role` by substring over the held-Roles list,
          so "USER" also finds "POWER_USER"; the hint says so. */}
      <ExactMatchInput
        id="access-role"
        label="Perfis detidos"
        placeholder="Código do perfil"
        hint="Contém o código indicado"
        value={query.filters.role}
        onCommit={set("role")}
      />
      <FilterSelect
        id="access-status"
        label="Estado"
        options={ACCESS_STATUS_OPTIONS}
        value={query.filters.status}
        onChange={set("status")}
      />
    </div>
  );
}

export function AccessReportTab({ query, onQueryChange }: ReportTabProps) {
  const { data, error, isPending, isError, isFetching, refetch } =
    useAccessReport(query);
  const rows = useMemo(() => data?.content ?? [], [data]);
  useRedirectOnUnauthorized(error);

  /* A shared link can point past the last page once rows age out of the
     window; fall back to the first page instead of an empty table. */
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
      <AccessReportFilterBar query={query} onQueryChange={onQueryChange} />
      {isError ? (
        <InlineError
          title="Não foi possível carregar o relatório de acessos."
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
            columns={ACCESS_COLUMNS}
            data={rows}
            showPagination={false}
            pageSizePagination={TABLE_PAGE_SIZE}
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
