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
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ROUTES } from "@/lib/constants";

import { getClientKind, LINK_UNKNOWN_REASON } from "../lib/oauth-client-utils";
import { ActiveBadge, ClientKindBadge } from "./oauth-client-badges";

export type ClientRow = OAuthClientDTO & { linkedAccount?: ServiceAccountDTO };

interface RowHandlers {
  onToggleActive: (row: ClientRow) => void;
  onDelete: (row: ClientRow) => void;
  onCopy: (clientId: string) => void;
  /**
   * True while the SA list is loading or failed to load: the link state is
   * unknown, so delete and activation fail safe (a linked pair must use the
   * combined action, which needs the link).
   */
  linkUnknown?: boolean;
}

/**
 * A blocked menu item that stays in the keyboard order (Radix skips `disabled`
 * items, which would hide the reason from keyboard and screen-reader users).
 * Selecting it does nothing and keeps the menu open.
 */
function BlockedMenuItem({ label, reason }: { label: string; reason: string }) {
  return (
    <DropdownMenuItem
      aria-disabled="true"
      onSelect={(event) => event.preventDefault()}
      className="cursor-not-allowed flex-col items-start gap-0.5 opacity-50"
    >
      <span>{label}</span>
      <span className="text-xs text-muted-foreground">{reason}</span>
    </DropdownMenuItem>
  );
}

export function OAuthClientRowActions({
  row,
  onToggleActive,
  onDelete,
  onCopy,
  linkUnknown,
}: { row: ClientRow } & RowHandlers) {
  const name = row.clientName || row.clientId;
  const deleteBlockedReason = row.linkedAccount
    ? `Remova primeiro a conta de serviço «${row.linkedAccount.name}».`
    : linkUnknown
      ? LINK_UNKNOWN_REASON
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
            href={`${ROUTES.OAUTH_CLIENTS}/${row.id}`}
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
        {linkUnknown && !row.linkedAccount ? (
          <BlockedMenuItem
            label={row.active ? "Desativar" : "Ativar"}
            reason={LINK_UNKNOWN_REASON}
          />
        ) : row.active ? (
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
        {deleteBlockedReason ? (
          <BlockedMenuItem label="Eliminar" reason={deleteBlockedReason} />
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
            href={`${ROUTES.OAUTH_CLIENTS}/${row.original.id}`}
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
