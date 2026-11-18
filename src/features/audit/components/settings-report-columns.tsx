"use client";

import {
  Button,
  type ColumnDef,
  IGRPIcon,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";

import {
  type AuditTranslator,
  areaLabel,
  entityTypeLabel,
  operationLabel,
} from "../lib/i18n";
import { DEFAULT_SORT, type ReportSort } from "../lib/report-query";
import { AuditDateTime } from "./audit-date-time";
import { AuditStatusBadge } from "./audit-status-badge";
import { SettingsChangeDetail } from "./settings-change-detail";
import { SortableHeader } from "./sortable-header";

const text = (value?: string | null) => value || "—";

export const settingsRowCanExpand = (row: Row<SettingsReportRowDTO>) =>
  Boolean(
    row.original.previousValue ||
      row.original.newValue ||
      row.original.relatedEntity ||
      row.original.ipAddress,
  );

export const renderSettingsDetail = (row: Row<SettingsReportRowDTO>) => (
  <SettingsChangeDetail row={row.original} />
);

/* Built per sort state and memoized by the caller: IGRPDataTable needs a
   referentially stable column array between renders. Sorting is server-side
   (see SortableHeader), so the table's own sorting stays off. The IP lives in
   the expanded detail, not in a column. */
export function settingsColumns(
  t: AuditTranslator,
  sort: ReportSort | undefined,
  onSort: (field: string) => void,
): ColumnDef<SettingsReportRowDTO>[] {
  const sortable = (title: string, field: string) => () => (
    <SortableHeader
      title={title}
      field={field}
      sort={sort ?? DEFAULT_SORT}
      onSort={onSort}
    />
  );

  return [
    {
      id: "expand",
      // The table sets every header to getSize() (150px by default); this
      // column only holds the 36px chevron button plus the cell's 12px padding.
      size: 48,
      header: () => <span className="sr-only">{t("fields.details")}</span>,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={row.getIsExpanded()}
            aria-label={
              row.getIsExpanded() ? t("row.hideDetails") : t("row.showDetails")
            }
            onClick={row.getToggleExpandedHandler()}
          >
            <IGRPIcon
              iconName={row.getIsExpanded() ? "ChevronDown" : "ChevronRight"}
              aria-hidden="true"
            />
          </Button>
        ) : null,
    },
    {
      accessorKey: "timestamp",
      header: sortable(t("fields.timestamp"), "timestamp"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          <AuditDateTime value={row.original.timestamp} />
        </span>
      ),
    },
    {
      accessorKey: "performedBy",
      header: sortable(t("fields.performedBy"), "performedBy"),
      cell: ({ row }) => text(row.original.performedBy),
    },
    {
      accessorKey: "area",
      header: sortable(t("fields.area"), "area"),
      cell: ({ row }) => areaLabel(t, row.original.area),
    },
    {
      accessorKey: "operation",
      header: sortable(t("fields.operation"), "operation"),
      cell: ({ row }) => operationLabel(t, row.original.operation),
    },
    {
      accessorKey: "entityType",
      header: sortable(t("fields.type"), "entityType"),
      cell: ({ row }) => entityTypeLabel(t, row.original.entityType),
    },
    {
      accessorKey: "entityName",
      header: sortable(t("fields.entity"), "entityName"),
      cell: ({ row }) => text(row.original.entityName),
    },
    {
      accessorKey: "status",
      header: sortable(t("fields.status"), "status"),
      cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
    },
  ];
}
