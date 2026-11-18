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
import { useTranslations } from "next-intl";

import {
  ApplicationCell,
  ClientIdText,
  IdentityName,
  LinkedIdentity,
} from "@/features/accounts/components/account-cells";
import { ROUTES } from "@/lib/constants";

import {
  getClientKind,
  getDeleteBlockedReason,
  type OAuthClientsTranslator,
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
  const t = useTranslations("oauthClients");
  const name = row.clientName || row.clientId;
  const canDelete = !getDeleteBlockedReason(t, row.linkedAccount, linkUnknown);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={t("columns.rowActions", { name })}
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
            {t("actions.viewDetails")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCopy(row.clientId)}>
          <IGRPIcon iconName="Copy" aria-hidden="true" />
          {t("actions.copyClientId")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {linkUnknown && !row.linkedAccount ? (
          <BlockedMenuItem
            label={row.active ? t("actions.deactivate") : t("actions.activate")}
            reason={t("linkUnknown")}
          />
        ) : row.active ? (
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => onToggleActive(row)}
          >
            <IGRPIcon iconName="CircleOff" aria-hidden="true" />
            {t("actions.deactivate")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onToggleActive(row)}>
            <IGRPIcon iconName="CircleCheck" aria-hidden="true" />
            {t("actions.activate")}
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
            {t("actions.delete")}
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getOAuthClientColumns({
  t,
  applicationName,
  ...handlers
}: RowHandlers & {
  t: OAuthClientsTranslator;
  /** Application name by code; the cell falls back to the code. */
  applicationName: (code: string) => string | undefined;
}): ColumnDef<ClientRow>[] {
  return [
    {
      id: "client",
      accessorFn: (r) => r.clientName || r.clientId,
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          title={t("columns.client")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <div className="flex min-w-0 flex-col gap-0.5">
          <IdentityName href={`${ROUTES.OAUTH_CLIENTS}/${row.original.id}`}>
            {row.original.clientName || row.original.clientId}
          </IdentityName>
          <ClientIdText
            clientId={row.original.clientId}
            onCopy={handlers.onCopy}
          />
        </div>
      ),
      size: 300,
    },
    {
      id: "kind",
      accessorFn: (r) => getClientKind(r.grantTypes),
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          title={t("columns.kind")}
          column={column}
        />
      ),
      cell: ({ row }) => (
        <ClientKindBadge grantTypes={row.original.grantTypes} />
      ),
      size: 140,
    },
    {
      id: "serviceAccount",
      accessorFn: (r) => r.linkedAccount?.name ?? "",
      header: () => (
        <IGRPDataTableHeaderDefault title={t("columns.serviceAccount")} />
      ),
      cell: ({ row }) => {
        const account = row.original.linkedAccount;
        if (account) {
          return (
            <LinkedIdentity
              href={`${ROUTES.SERVICE_ACCOUNTS}/${account.id}`}
              iconName="Bot"
              label={account.name}
            />
          );
        }
        // Only a client_credentials client can back a service account.
        if (getClientKind(row.original.grantTypes) === "web") {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <span className="text-muted-foreground">
            {handlers.linkUnknown
              ? t("columns.toVerify")
              : t("columns.noAccount")}
          </span>
        );
      },
      size: 220,
    },
    {
      id: "application",
      accessorFn: (r) => r.applicationCode ?? "",
      header: () => (
        <IGRPDataTableHeaderDefault title={t("columns.application")} />
      ),
      cell: ({ row }) => {
        const code = row.original.applicationCode;
        return (
          <ApplicationCell
            code={code}
            name={code ? applicationName(code) : undefined}
          />
        );
      },
      size: 180,
    },
    {
      id: "status",
      accessorFn: (r) => (r.active ? "ACTIVE" : "INACTIVE"),
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          title={t("columns.status")}
          column={column}
        />
      ),
      cell: ({ row }) => <ActiveBadge active={row.original.active} />,
      size: 100,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      cell: ({ row }) => (
        <OAuthClientRowActions row={row.original} {...handlers} />
      ),
      enableSorting: false,
      size: 56,
    },
  ];
}
