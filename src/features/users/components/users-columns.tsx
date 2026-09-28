"use client";

import Link from "next/link";

import {
  Badge,
  type ColumnDef,
  cn,
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

import {
  formatDateShort,
  geInviteTitle,
  getInitials,
  getStatusColor,
  showStatus,
  statusInviteClass,
} from "@/lib/app-utilities";

const isInviteStatus = (s: string) =>
  ["PENDING", "CANCELED", "REJECTED", "ACCEPTED"].includes(s);

function ActiveRowActionsCell({
  row,
  onStatusClick,
  isSelf,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
  isSelf: boolean;
}) {
  const state = String(row.getValue("status"));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="inline-flex size-9 items-center justify-center rounded-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Ações para ${row.original.name || row.original.email}`}
      >
        <IGRPIcon iconName="Ellipsis" aria-hidden="true" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">        
        {isSelf ? null : state === "ACTIVE" ? (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => onStatusClick(row.original, "INACTIVE")}
            variant="destructive"
          >
            <IGRPIcon iconName="CircleOff" />
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem            
            className="text-success-subtle-foreground focus:text-success-subtle-foreground focus:bg-success-subtle"
            onSelect={() => onStatusClick(row.original, "ACTIVE")}
            variant="default"
          >
            <IGRPIcon
              iconName="CircleCheck"
              className="text-success-subtle-foreground"
            />
            Ativar
          </DropdownMenuItem>
        )}

        <DropdownMenuItem variant="default" asChild>
          <Link
            className="flex gap-2"
            href={`/settings/users/${row.original.id}`}
          >
            <IGRPIcon iconName="UserCog" />
            Gerir
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getTableColumns(
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void,
  options?: { showInvitationDate?: boolean; currentUserId?: string },
): ColumnDef<IGRPUserDTO>[] {
  const showInvitationDate = options?.showInvitationDate !== false;
  const currentUserId = options?.currentUserId;
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
      ),
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
    ...(showInvitationDate
      ? [
          {
            header: "Data do Convite",
            accessorKey: "invitationDate",
            cell: ({ row }: { row: Row<IGRPUserDTO> }) => (
              <div>{formatDateShort(row.getValue("invitationDate"))}</div>
            ),
          } as ColumnDef<IGRPUserDTO>,
        ]
      : []),
    {
      header: () => (
        <IGRPDataTableHeaderDefault title="Estado" className="text-center" />
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
              {isInvite ? geInviteTitle(status) : showStatus(status)}
            </Badge>
          </div>
        );
      },
      filterFn: IGRPDataTableFacetedFilterFn,
      size: 70,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => (
        <ActiveRowActionsCell
          row={row}
          onStatusClick={onStatusClick}
          isSelf={
            currentUserId !== undefined && row.original.id === currentUserId
          }
        />
      ),
      size: 60,
      enableHiding: false,
    },
  ];
}
