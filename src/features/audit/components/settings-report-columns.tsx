"use client";

import {
  Button,
  type ColumnDef,
  IGRPIcon,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import type { SettingsReportRowDTO } from "@igrp/platform-access-management-client-ts";

import {
  labelFor,
  SETTINGS_AREA_LABELS,
  SETTINGS_ENTITY_TYPE_LABELS,
  SETTINGS_OPERATION_LABELS,
} from "../lib/audit-labels";
import { formatAuditDateTime } from "../lib/platform-time";
import { DEFAULT_SORT, type ReportSort } from "../lib/report-query";
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
      header: () => <span className="sr-only">Detalhes</span>,
      cell: ({ row }) =>
        row.getCanExpand() ? (
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={row.getIsExpanded()}
            aria-label={
              row.getIsExpanded() ? "Ocultar detalhes" : "Ver detalhes"
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
      header: sortable("Data e hora", "timestamp"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatAuditDateTime(row.original.timestamp)}
        </span>
      ),
    },
    {
      accessorKey: "performedBy",
      header: sortable("Realizado por", "performedBy"),
      cell: ({ row }) => text(row.original.performedBy),
    },
    {
      accessorKey: "area",
      header: sortable("Área", "area"),
      cell: ({ row }) => labelFor(SETTINGS_AREA_LABELS, row.original.area),
    },
    {
      accessorKey: "operation",
      header: sortable("Operação", "operation"),
      cell: ({ row }) =>
        labelFor(SETTINGS_OPERATION_LABELS, row.original.operation),
    },
    {
      accessorKey: "entityType",
      header: sortable("Tipo", "entityType"),
      cell: ({ row }) =>
        labelFor(SETTINGS_ENTITY_TYPE_LABELS, row.original.entityType),
    },
    {
      accessorKey: "entityName",
      header: sortable("Entidade", "entityName"),
      cell: ({ row }) => text(row.original.entityName),
    },
    {
      accessorKey: "status",
      header: sortable("Estado", "status"),
      cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
    },
  ];
}
