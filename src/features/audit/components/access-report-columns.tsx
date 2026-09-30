"use client";

import {
  type ColumnDef,
  IGRPDataTableHeaderDefault,
} from "@igrp/igrp-framework-react-design-system";
import type { AccessReportRowDTO } from "@igrp/platform-access-management-client-ts";

import { formatAuditDateTime } from "../lib/platform-time";
import { DEFAULT_SORT, type ReportSort } from "../lib/report-query";
import { AuditStatusBadge } from "./audit-status-badge";
import { SortableHeader } from "./sortable-header";

const text = (value?: string | null) => value || "—";

/* Built per sort state and memoized by the caller: IGRPDataTable needs a
   referentially stable column array between renders. Sorting is server-side
   (see SortableHeader), so the table's own sorting stays off. */
export function accessColumns(
  sort: ReportSort | undefined,
  onSort: (field: string) => void,
): ColumnDef<AccessReportRowDTO>[] {
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
      accessorKey: "timestamp",
      header: sortable("Data e hora", "timestamp"),
      cell: ({ row }) => (
        <span className="whitespace-nowrap tabular-nums">
          {formatAuditDateTime(row.original.timestamp)}
        </span>
      ),
    },
    {
      accessorKey: "username",
      header: sortable("Utilizador", "username"),
      cell: ({ row }) => text(row.original.username),
    },
    {
      /* Today the backend stores EVERY Role the user held, comma-joined — not
         the Active Role (AUDIT_BACKEND_RESPONSES §4). Label the data as it is;
         rename to "Perfil" when the backend writes the Active Role. */
      accessorKey: "role",
      header: sortable("Perfis detidos", "role"),
      cell: ({ row }) => (
        <span className="break-words">{text(row.original.role)}</span>
      ),
    },
    {
      accessorKey: "module",
      header: () => <IGRPDataTableHeaderDefault title="Módulo" />,
      cell: ({ row }) => text(row.original.module),
    },
    {
      accessorKey: "action",
      header: sortable("Ação", "action"),
      cell: ({ row }) => text(row.original.action),
    },
    {
      accessorKey: "ipAddress",
      header: sortable("IP", "ipAddress"),
      cell: ({ row }) => (
        <span className="tabular-nums">{text(row.original.ipAddress)}</span>
      ),
    },
    {
      accessorKey: "status",
      header: sortable("Estado", "status"),
      cell: ({ row }) => <AuditStatusBadge status={row.original.status} />,
    },
  ];
}
