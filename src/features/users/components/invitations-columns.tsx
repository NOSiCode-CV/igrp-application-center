"use client";

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
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { InvitationDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { useResendUserInvitation } from "@/features/users/use-users";
import { getInitials, statusInviteClass } from "@/lib/utilities";
import { cn } from "@/lib/utils";

import { inviteStatusLabel, type UsersTranslator } from "../lib/i18n";

const isTerminalInviteStatus = (s: string) =>
  s === "CANCELED" || s === "REJECTED";

function PendingRowActionsCell({
  row,
  onCancelClick,
}: {
  row: Row<InvitationDTO>;
  onCancelClick: (invitation: InvitationDTO) => void;
}) {
  const t = useTranslations("users.invitations");
  const { igrpToast } = useIGRPToast();
  const resendMutation = useResendUserInvitation();

  const handleCopyUrl = () => {
    const invitationUrl = row.original.invitationUrl;
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      igrpToast({
        type: "success",
        title: t("toasts.urlCopied"),
        description: t("toasts.urlCopiedDescription"),
        duration: 6000,
      });
    } else {
      igrpToast({
        type: "error",
        title: t("toasts.urlUnavailable"),
        description: t("toasts.urlUnavailableDescription"),
        duration: 6000,
      });
    }
  };

  const handleResend = () => {
    if (row.original.id) {
      resendMutation.mutate(row.original.id, {
        onSuccess: () => {
          igrpToast({
            type: "success",
            title: t("toasts.resent"),
            description: t("toasts.resentDescription"),
            duration: 6000,
          });
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: t("toasts.resendFailed"),
            description: t("toasts.resendFailedDescription"),
            duration: 6000,
          });
        },
      });
    }
  };

  return (
    <>
      {!isTerminalInviteStatus(String(row.original.status)) && (
        <DropdownMenu>
          <DropdownMenuTrigger className="p-1 rounded-sm">
            <IGRPIcon iconName="Ellipsis" />
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="min-w-44">
            <DropdownMenuItem onSelect={handleCopyUrl}>
              <IGRPIcon iconName="Copy" />
              {t("actions.copyUrl")}
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={handleResend}>
              <IGRPIcon iconName="Mail" />
              {t("actions.resend")}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              variant="destructive"
              onSelect={() => onCancelClick(row.original)}
            >
              <IGRPIcon iconName="Trash2" />
              {t("actions.cancel")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

export function getInvitationColumns(
  t: UsersTranslator,
  formatDate: (value: string) => string,
  onCancelClick: (invitation: InvitationDTO) => void,
): ColumnDef<InvitationDTO>[] {
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle
          column={column}
          title={t("columns.name")}
        />
      ),
      accessorKey: "identifierValue",
      cell: ({ row }) => {
        const identifier = String(row.getValue("identifierValue") ?? "");
        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={identifier}
              fallbackContent={getInitials(identifier)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div>
              <div className="text-sm leading-none">{identifier}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: t("columns.invitationDate"),
      accessorKey: "invitationDate",
      cell: ({ row }) => {
        const date = row.getValue("invitationDate");
        return <div>{date ? formatDate(String(date)) : t("notAvailable")}</div>;
      },
    },
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
        return (
          <div className="text-center">
            <Badge className={cn(statusInviteClass(status), "capitalize")}>
              {inviteStatusLabel(t, status)}
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
        <PendingRowActionsCell row={row} onCancelClick={onCancelClick} />
      ),
      size: 60,
      enableHiding: false,
    },
  ];
}
