"use client";

import type { ReactNode } from "react";

import {
  Badge,
  type Column,
  type ColumnDef,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableHeaderDefault,
  IGRPDataTableHeaderSortToggle,
  IGRPIcon,
  IGRPUserAvatar,
  type Row,
} from "@igrp/igrp-framework-react-design-system";

import { getInitials } from "@/lib/utilities";

import type { UsersTranslator } from "../lib/i18n";

export function IdentityCell({
  label,
  secondary,
}: {
  label: string;
  secondary?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <IGRPUserAvatar
        alt={label}
        fallbackContent={getInitials(label)}
        className="size-10"
        fallbackClass="text-base bg-primary text-primary-foreground"
      />
      <div>
        <div className="text-sm leading-none">{label}</div>
        {secondary && (
          <span className="text-muted-foreground text-xs">{secondary}</span>
        )}
      </div>
    </div>
  );
}

export function RowActionsMenu({
  ariaLabel,
  children,
}: {
  ariaLabel: string;
  children: ReactNode;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={ariaLabel}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const sortableHeader =
  <T,>(title: string) =>
  ({ column }: { column: Column<T, unknown> }) => (
    <IGRPDataTableHeaderSortToggle column={column} title={title} />
  );

export function dateColumn<T>(
  t: UsersTranslator,
  formatDate: (value: string) => string,
  accessorKey: string,
): ColumnDef<T> {
  return {
    header: t("columns.invitationDate"),
    accessorKey,
    cell: ({ row }: { row: Row<T> }) => {
      const date = row.getValue(accessorKey);
      return <div>{date ? formatDate(String(date)) : t("notAvailable")}</div>;
    },
  } as ColumnDef<T>;
}

export function statusColumn<T>(
  t: UsersTranslator,
  getBadge: (status: string) => { className?: Parameters<typeof cn>[0]; label: ReactNode },
): ColumnDef<T> {
  return {
    header: () => (
      <IGRPDataTableHeaderDefault
        title={t("columns.status")}
        className="text-center"
      />
    ),
    accessorKey: "status",
    cell: ({ row }: { row: Row<T> }) => {
      const { className, label } = getBadge(
        String(row.getValue("status") ?? ""),
      );
      return (
        <div className="text-center">
          <Badge className={cn(className, "capitalize")}>{label}</Badge>
        </div>
      );
    },
    filterFn: IGRPDataTableFacetedFilterFn,
    size: 100,
  } as ColumnDef<T>;
}

export function actionsColumn<T>(
  t: UsersTranslator,
  renderCell: (row: Row<T>) => ReactNode,
): ColumnDef<T> {
  return {
    id: "actions",
    header: () => <span className="sr-only">{t("columns.actions")}</span>,
    cell: ({ row }: { row: Row<T> }) => renderCell(row),
    size: 30,
    enableHiding: false,
  } as ColumnDef<T>;
}
