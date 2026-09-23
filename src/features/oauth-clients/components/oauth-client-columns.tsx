"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  IGRPDataTableHeaderDefault,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ROUTES } from "@/lib/constants";

import { getClientKind } from "../lib/oauth-client-utils";
import { ActiveBadge, ClientKindBadge } from "./oauth-client-badges";

export type ClientRow = OAuthClientDTO & { linkedAccount?: ServiceAccountDTO };

interface RowHandlers {
  onToggleActive: (row: ClientRow) => void;
  onDelete: (row: ClientRow) => void;
  onCopy: (clientId: string) => void;
  /** True when the SA list failed to load: link state is unknown, so delete fails safe. */
  deleteBlocked?: boolean;
}

export function OAuthClientRowActions({
  row,
  onToggleActive,
  onDelete,
  onCopy,
  deleteBlocked,
}: { row: ClientRow } & RowHandlers) {
  const name = row.clientName || row.clientId;
  const blockedReason = row.linkedAccount
    ? `Remova primeiro a conta de serviço «${row.linkedAccount.name}».`
    : deleteBlocked
      ? "Não foi possível verificar se existe uma conta de serviço."
      : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${name}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-64">
        <DropdownMenuItem asChild>
          <Link
            href={`${ROUTES.OAUTH_CLIENTS}/${row.id}` as Route}
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
        {blockedReason ? (
          <DropdownMenuItem disabled className="flex-col items-start gap-0.5">
            <span>Eliminar</span>
            <span className="text-xs text-muted-foreground">
              {blockedReason}
            </span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(row)}
          >
            <IGRPIcon iconName="Trash" aria-hidden="true" />
            Eliminar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getOAuthClientColumns(
  handlers: RowHandlers,
): ColumnDef<ClientRow>[] {
  return [
    {
      id: "client",
      accessorFn: (r) => `${r.clientName ?? ""} ${r.clientId}`,
      header: () => <IGRPDataTableHeaderDefault title="Cliente" />,
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`${ROUTES.OAUTH_CLIENTS}/${row.original.id}` as Route}
            className="font-medium hover:underline"
          >
            {row.original.clientName || row.original.clientId}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.clientId}
          </span>
        </div>
      ),
    },
    {
      id: "kind",
      accessorFn: (r) => getClientKind(r.grantTypes),
      header: () => <IGRPDataTableHeaderDefault title="Tipo" />,
      cell: ({ row }) => (
        <ClientKindBadge grantTypes={row.original.grantTypes} />
      ),
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
    },
    {
      id: "grantTypes",
      accessorFn: (r) => r.grantTypes.join(", "),
      header: () => <IGRPDataTableHeaderDefault title="Grant types" />,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
    },
    {
      id: "application",
      accessorFn: (r) => r.applicationCode ?? "—",
      header: () => <IGRPDataTableHeaderDefault title="Aplicação" />,
      cell: ({ getValue }) => (
        <span className="font-mono text-xs">{String(getValue())}</span>
      ),
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
    },
    {
      id: "serviceAccount",
      accessorFn: (r) => r.linkedAccount?.name ?? "",
      header: () => <IGRPDataTableHeaderDefault title="Conta de serviço" />,
      cell: ({ row }) =>
        row.original.linkedAccount ? (
          <span className="inline-flex items-center gap-1.5">
            <IGRPIcon iconName="Bot" className="size-3.5" aria-hidden="true" />
            {row.original.linkedAccount.name}
          </span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: () => <IGRPDataTableHeaderDefault title="Estado" />,
      cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      filterFn: (row, id, values: string[]) =>
        values.includes(row.getValue(id)),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <OAuthClientRowActions row={row.original} {...handlers} />
      ),
      enableSorting: false,
    },
  ];
}
