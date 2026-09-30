"use client";

import Link from "next/link";

import {
  type ColumnDef,
  DropdownMenuItem,
  IGRPIcon,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { getStatusColor } from "@/lib/utilities";

import { type UsersTranslator, userStatusLabel } from "../lib/i18n";
import {
  actionsColumn,
  IdentityCell,
  RowActionsMenu,
  sortableHeader,
  statusColumn,
} from "./columns-shared";

function ActiveRowActionsCell({
  row,
  onStatusClick,
  isSelf,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
  isSelf: boolean;
}) {
  const t = useTranslations("users.columns");
  const state = String(row.getValue("status"));

  return (
    <RowActionsMenu
      ariaLabel={`Ações para ${row.original.name || row.original.email}`}
    >
      <DropdownMenuItem variant="default" asChild>
        <Link
          className="flex gap-2"
          href={`/settings/users/${row.original.id}`}
        >
          <IGRPIcon iconName="UserCog" />
          {t("manage")}
        </Link>
      </DropdownMenuItem>

      {isSelf ? null : state === "ACTIVE" ? (
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => onStatusClick(row.original, "INACTIVE")}
          variant="destructive"
        >
          <IGRPIcon iconName="CircleOff" />
          {t("deactivate")}
        </DropdownMenuItem>
      ) : (
        <DropdownMenuItem
          className="text-success-subtle-foreground focus:text-success-subtle-foreground focus:bg-success-subtle"
          onSelect={() => onStatusClick(row.original, "ACTIVE")}
          variant="default"
        >
          <IGRPIcon iconName="CircleCheck" className="text-success" />
          {t("activate")}
        </DropdownMenuItem>
      )}
    </RowActionsMenu>
  );
}

export function getTableColumns(
  t: UsersTranslator,
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void,
  options?: { currentUserId?: string },
): ColumnDef<IGRPUserDTO>[] {
  const currentUserId = options?.currentUserId;
  return [
    {
      header: sortableHeader<IGRPUserDTO>(t("columns.name")),
      accessorKey: "name",
      filterFn: (row, _columnId, value: string) => {
        const search = value.toLowerCase();
        const name = String(row.original.name ?? "").toLowerCase();
        const email = String(row.original.email ?? "").toLowerCase();
        return name.includes(search) || email.includes(search);
      },
      cell: ({ row }) => {
        const email = String(row.original.email ?? "");
        const nameValue = row.original.name;
        const name =
          nameValue && String(nameValue) !== "null" ? String(nameValue) : email;
        return <IdentityCell label={name || email} secondary={email} />;
      },
    },
    {
      header: sortableHeader<IGRPUserDTO>(t("columns.email")),
      accessorKey: "email",
      cell: ({ row }) => row.getValue("email") || t("notAvailable"),
    },
    statusColumn<IGRPUserDTO>(t, (status) => ({
      className: getStatusColor(status),
      label: userStatusLabel(t, status),
    })),
    actionsColumn<IGRPUserDTO>(t, (row) => (
      <ActiveRowActionsCell
        row={row}
        onStatusClick={onStatusClick}
        isSelf={
          currentUserId !== undefined && row.original.id === currentUserId
        }
      />
    )),
  ];
}
