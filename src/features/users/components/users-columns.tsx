"use client";

import Link from "next/link";

import {
  Badge,
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableHeaderDefault,
  IGRPDataTableHeaderSortToggle,
  IGRPIcon,
  IGRPUserAvatar,
  type Row,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import {
  getInitials,
  getStatusColor,
  statusInviteClass,
} from "@/lib/utilities";
import { cn } from "@/lib/utils";

import {
  inviteStatusLabel,
  type UsersTranslator,
  userStatusLabel,
} from "../lib/i18n";

// ─── Module-level helpers ────────────────────────────────────────────────────

const isInviteStatus = (s: string) =>
  ["PENDING", "CANCELED", "REJECTED", "ACCEPTED"].includes(s);

function ActiveRowActionsCell({
  row,
  onStatusClick,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
}) {
  const t = useTranslations("users.columns");
  const state = String(row.getValue("status"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded-sm">
        <IGRPIcon iconName="Ellipsis" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        {state === "ACTIVE" ? (
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
            className="text-success focus:text-success focus:bg-success/10"
            onSelect={() => onStatusClick(row.original, "ACTIVE")}
            variant="default"
          >
            <IGRPIcon iconName="CircleCheck" className="text-success" />
            {t("activate")}
          </DropdownMenuItem>
        )}

        <DropdownMenuItem variant="default" asChild>
          <Link
            className="flex gap-2"
            href={`/settings/users/${row.original.id}`}
          >
            <IGRPIcon iconName="UserCog" />
            {t("manage")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Column factory ──────────────────────────────────────────────────────────

export function getTableColumns(
  t: UsersTranslator,
  formatDate: (value: string) => string,
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void,
  options?: { showInvitationDate?: boolean },
): ColumnDef<IGRPUserDTO>[] {
  const showInvitationDate = options?.showInvitationDate !== false;
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          column={column}
          title={t("columns.name")}
        />
      ),
      accessorKey: "name",
      filterFn: (row, _columnId, value: string) => {
        const search = value.toLowerCase();
        const name = String(row.getValue("name") ?? "").toLowerCase();
        const email = String(row.getValue("email") ?? "").toLowerCase();
        return name.includes(search) || email.includes(search);
      },
      cell: ({ row }) => {
        const email = String(row.getValue("email") ?? "");
        const nameValue = row.getValue("name");
        const name =
          nameValue && String(nameValue) !== "null" ? String(nameValue) : email;
        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={name || email}
              fallbackContent={getInitials(name || email)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div>
              <div className="text-sm leading-none">{name || email}</div>
              <span className="text-muted-foreground text-xs">{email}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          column={column}
          title={t("columns.email")}
        />
      ),
      accessorKey: "email",
      cell: ({ row }) => (
        <div>{row.getValue("email") || t("notAvailable")}</div>
      ),
    },
    ...(showInvitationDate
      ? [
          {
            header: t("columns.invitationDate"),
            accessorKey: "invitationDate",
            cell: ({ row }: { row: Row<IGRPUserDTO> }) => {
              const date = row.getValue("invitationDate");
              return (
                <div>{date ? formatDate(String(date)) : t("notAvailable")}</div>
              );
            },
          } as ColumnDef<IGRPUserDTO>,
        ]
      : []),
    {
      header: () => (
        <IGRPDataTableHeaderDefault
          title={t("columns.status")}
          className="text-center"
        />
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = String(row.getValue("status") ?? "");
        const isInvite = isInviteStatus(status);
        return (
          <div className="text-center">
            <Badge
              className={cn(
                isInvite ? statusInviteClass(status) : getStatusColor(status),
                "capitalize",
              )}
            >
              {isInvite
                ? inviteStatusLabel(t, status)
                : userStatusLabel(t, status)}
            </Badge>
          </div>
        );
      },
      filterFn: IGRPDataTableFacetedFilterFn,
      size: 70,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">{t("columns.actions")}</span>,
      cell: ({ row }) => (
        <ActiveRowActionsCell row={row} onStatusClick={onStatusClick} />
      ),
      size: 60,
      enableHiding: false,
    },
  ];
}
