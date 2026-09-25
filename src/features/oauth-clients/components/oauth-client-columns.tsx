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
} from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ROUTES } from "@/lib/constants";

import {
  getClientKind,
  getDeleteBlockedReason,
  LINK_UNKNOWN_REASON,
} from "../lib/oauth-client-utils";
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
  const canDelete = !getDeleteBlockedReason(row.linkedAccount, linkUnknown);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${name}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-max max-w-64">
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
        {/* Only offered when it can succeed: a linked service account (or an
            unknown link state) leaves nothing to delete from here. */}
        {canDelete ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onDelete(row)}
          >
            <IGRPIcon iconName="Trash" aria-hidden="true" />
            Eliminar
          </DropdownMenuItem>
        ) : null}
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
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle title="Cliente" column={column} />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`${ROUTES.OAUTH_CLIENTS}/${row.original.id}`}
            className="font-medium underline hover:cursor-pointer"
          >
            {row.original.clientName || row.original.clientId}
          </Link>
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.clientId}
          </span>
          {row.original.linkedAccount ? (
            <span className="text-xs text-muted-foreground">
              Conta de serviço:{" "}
              <Link
                href={`${ROUTES.SERVICE_ACCOUNTS}/${row.original.linkedAccount.id}`}
                className="underline"
              >
                {row.original.linkedAccount.name}
              </Link>
            </span>
          ) : null}
        </div>
      ),
      size: 350,
    },
    {
      id: "kind",
      accessorFn: (r) => getClientKind(r.grantTypes),
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle title="Tipo" column={column} />
      ),
      cell: ({ row }) => (
        <ClientKindBadge grantTypes={row.original.grantTypes} />
      ),
    },
    {
      id: "grantTypes",
      accessorFn: (r) => r.grantTypes.join(", "),
      header: () => <IGRPDataTableHeaderDefault title="Grant types" />,
      cell: ({ row }) =>
        row.original.grantTypes.length ? (
          <ul className="flex flex-col gap-0.5 font-mono text-xs">
            {row.original.grantTypes.map((grant) => (
              <li key={grant} className="truncate">
                {grant}
              </li>
            ))}
          </ul>
        ) : (
          <span className="text-muted-foreground">—</span>
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
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle title="Estado" column={column} />
      ),
      cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      size: 70,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <OAuthClientRowActions row={row.original} {...handlers} />
      ),
      enableSorting: false,
      size: 50,
    },
  ];
}
