"use client";

import {
  Button,
  type ColumnDef,
  IGRPDataTableHeaderDefault,
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
import { AuditStatusBadge } from "./audit-status-badge";
import { SettingsChangeDetail } from "./settings-change-detail";

const text = (value?: string | null) => value || "—";

export const settingsRowCanExpand = (row: Row<SettingsReportRowDTO>) =>
  Boolean(
    row.original.previousValue ||
      row.original.newValue ||
      row.original.relatedEntity,
  );

export const renderSettingsDetail = (row: Row<SettingsReportRowDTO>) => (
  <SettingsChangeDetail row={row.original} />
);

export const SETTINGS_COLUMNS: ColumnDef<SettingsReportRowDTO>[] = [
  {
    id: "expand",
    header: () => <span className="sr-only">Detalhes</span>,
    cell: ({ row }) =>
      row.getCanExpand() ? (
        <Button
          variant="ghost"
          size="icon"
          aria-expanded={row.getIsExpanded()}
          aria-label={row.getIsExpanded() ? "Ocultar detalhes" : "Ver detalhes"}
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
    header: () => <IGRPDataTableHeaderDefault title="Data e hora" />,
    cell: ({ row }) => (
      <span className="whitespace-nowrap tabular-nums">
        {formatAuditDateTime(row.original.timestamp)}
      </span>
    ),
  },
  {
    accessorKey: "performedBy",
    header: () => <IGRPDataTableHeaderDefault title="Realizado por" />,
    cell: ({ row }) => text(row.original.performedBy),
  },
  {
    accessorKey: "area",
    header: () => <IGRPDataTableHeaderDefault title="Área" />,
    cell: ({ row }) => labelFor(SETTINGS_AREA_LABELS, row.original.area),
  },
  {
    accessorKey: "operation",
    header: () => <IGRPDataTableHeaderDefault title="Operação" />,
    cell: ({ row }) =>
      labelFor(SETTINGS_OPERATION_LABELS, row.original.operation),
  },
  {
    accessorKey: "entityType",
    header: () => <IGRPDataTableHeaderDefault title="Tipo" />,
    cell: ({ row }) =>
      labelFor(SETTINGS_ENTITY_TYPE_LABELS, row.original.entityType),
  },
  {
    accessorKey: "entityName",
    header: () => <IGRPDataTableHeaderDefault title="Entidade" />,
    cell: ({ row }) => text(row.original.entityName),
  },
  {
    accessorKey: "ipAddress",
    header: () => <IGRPDataTableHeaderDefault title="IP" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{text(row.original.ipAddress)}</span>
    ),
  },
  {
    accessorKey: "status",
    header: () => <IGRPDataTableHeaderDefault title="Estado" />,
    cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
  },
];
