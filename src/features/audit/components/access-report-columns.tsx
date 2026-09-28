"use client";

import {
  type ColumnDef,
  IGRPDataTableHeaderDefault,
} from "@igrp/igrp-framework-react-design-system";
import type { AccessReportRowDTO } from "@igrp/platform-access-management-client-ts";

import { formatAuditDateTime } from "../lib/platform-time";
import { AuditStatusBadge } from "./audit-status-badge";

const text = (value?: string | null) => value || "—";

/* Module scope: IGRPDataTable needs a referentially stable column array. */
export const ACCESS_COLUMNS: ColumnDef<AccessReportRowDTO>[] = [
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
    accessorKey: "username",
    header: () => <IGRPDataTableHeaderDefault title="Utilizador" />,
    cell: ({ row }) => text(row.original.username),
  },
  {
    /* Today the backend stores EVERY Role the user held, comma-joined — not
       the Active Role (AUDIT_BACKEND_RESPONSES §4). Label the data as it is;
       rename to "Perfil" when the backend writes the Active Role. */
    accessorKey: "role",
    header: () => <IGRPDataTableHeaderDefault title="Perfis detidos" />,
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
    header: () => <IGRPDataTableHeaderDefault title="Ação" />,
    cell: ({ row }) => text(row.original.action),
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
