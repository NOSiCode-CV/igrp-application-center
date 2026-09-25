"use client";

import Link from "next/link";

import {
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPDataTableHeaderDefault,
  IGRPDataTableHeaderSortToggle,
  IGRPIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { ROUTES } from "@/lib/constants";

import {
  formatAccessSummary,
  permissionIdsOf,
  roleIdsOf,
} from "../lib/service-account-utils";

interface RowHandlers {
  onToggleActive: (row: ServiceAccountDTO) => void;
  onDelete: (row: ServiceAccountDTO) => void;
  onCopy: (clientId: string) => void;
}

export function ServiceAccountRowActions({
  row,
  onToggleActive,
  onDelete,
  onCopy,
}: { row: ServiceAccountDTO } & RowHandlers) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${row.name}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max max-w-64">
        <DropdownMenuItem asChild>
          <Link
            href={`${ROUTES.SERVICE_ACCOUNTS}/${row.id}`}
            className="flex gap-2"
          >
            <IGRPIcon iconName="Settings2" aria-hidden="true" />
            Ver detalhes
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy(row.clientId)}>
          <IGRPIcon iconName="Copy" aria-hidden="true" />
          Copiar client ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.active ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onToggleActive(row)}
          >
            <IGRPIcon iconName="CircleOff" aria-hidden="true" />
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onToggleActive(row)}>
            <IGRPIcon iconName="CircleCheck" aria-hidden="true" />
            Ativar
          </DropdownMenuItem>
        )}
        <DropdownMenuItem variant="destructive" onSelect={() => onDelete(row)}>
          <IGRPIcon iconName="Trash" aria-hidden="true" />
          Eliminar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Role and direct counts; the popover names the roles (spec §5.2). */
/**
 * Role codes are unique only within a department, so name the department
 * when the backend sends `roles` pairs. Older backends only have the flat,
 * independently de-duplicated `roleCodes`.
 */
function roleLabels(row: ServiceAccountDTO): { key: string; label: string }[] {
  if (row.roles) {
    return row.roles.map((r) => ({
      key: String(r.id),
      label: r.departmentCode ? `${r.code} · ${r.departmentCode}` : r.code,
    }));
  }
  return (row.roleCodes ?? []).map((code) => ({ key: code, label: code }));
}

function AccessCell({ row }: { row: ServiceAccountDTO }) {
  const roles = roleLabels(row);
  const summary = formatAccessSummary(
    roleIdsOf(row).length,
    permissionIdsOf(row).length,
  );
  if (roles.length === 0) return <span>{summary}</span>;
  return (
    <Popover>
      <PopoverTrigger className="rounded-sm underline decoration-dotted underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {summary}
      </PopoverTrigger>
      <PopoverContent className="w-max max-w-80">
        <p className="mb-2 text-sm font-medium">Perfis</p>
        <ul className="flex flex-col gap-1 font-mono text-xs">
          {roles.map((role) => (
            <li key={role.key}>{role.label}</li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

export function getServiceAccountColumns(
  handlers: RowHandlers,
): ColumnDef<ServiceAccountDTO>[] {
  return [
    {
      id: "name",
      accessorFn: (r) => r.name,
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle title="Nome" column={column} />
      ),
      cell: ({ row }) => (
        <Link
          href={`${ROUTES.SERVICE_ACCOUNTS}/${row.original.id}`}
          className="font-medium underline"
        >
          {row.original.name}
        </Link>
      ),
      size: 260,
    },
    {
      id: "clientId",
      accessorFn: (r) => r.clientId,
      header: () => <IGRPDataTableHeaderDefault title="Client ID" />,
      cell: ({ row }) => (
        <Link
          href={`${ROUTES.OAUTH_CLIENTS}/${row.original.oauthClientId}`}
          className="font-mono text-xs underline"
        >
          {row.original.clientId}
        </Link>
      ),
    },
    {
      id: "application",
      accessorFn: (r) => r.applicationCode ?? "—",
      header: () => <IGRPDataTableHeaderDefault title="Aplicação" />,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    {
      id: "access",
      header: () => <IGRPDataTableHeaderDefault title="Permissões" />,
      cell: ({ row }) => <AccessCell row={row.original} />,
    },
    {
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle title="Estado" column={column} />
      ),
      cell: ({ row }) => <ActiveBadge active={row.original.active} feminine />,
      size: 80,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <ServiceAccountRowActions row={row.original} {...handlers} />
      ),
      enableSorting: false,
      size: 50,
    },
  ];
}
