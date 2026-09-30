"use client";

import {
  type ColumnDef,
  DropdownMenuItem,
  DropdownMenuSeparator,
  IGRPIcon,
  type Row,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { InvitationDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { useResendUserInvitation } from "@/features/users/use-users";
import { statusInviteClass } from "@/lib/utilities";

import { inviteStatusLabel, type UsersTranslator } from "../lib/i18n";
import {
  actionsColumn,
  dateColumn,
  IdentityCell,
  RowActionsMenu,
  sortableHeader,
  statusColumn,
} from "./columns-shared";

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

  const handleCopyUrl = async () => {
    const invitationUrl = row.original.invitationUrl;
    if (invitationUrl) {
      try {
        await navigator.clipboard.writeText(invitationUrl);
      } catch {
        igrpToast({
          type: "error",
          title: "Não foi possível copiar",
          description:
            "O browser bloqueou o acesso à área de transferência. Copie o URL manualmente.",
          duration: 6000,
        });
        return;
      }
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
        <RowActionsMenu
          ariaLabel={`Ações para o convite de ${row.original.identifierValue}`}
        >
          <DropdownMenuItem onSelect={handleCopyUrl}>
            <IGRPIcon iconName="Copy" />
            {t("actions.copyUrl")}
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={handleResend}>
            <IGRPIcon iconName="Mail" />
            {t("actions.resend")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            variant="destructive"
            onSelect={() => onCancelClick(row.original)}
          >
            <IGRPIcon iconName="Trash2" />
            {t("actions.cancel")}
          </DropdownMenuItem>
        </RowActionsMenu>
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
      header: sortableHeader<InvitationDTO>(t("columns.name")),
      accessorKey: "identifierValue",
      cell: ({ row }) => (
        <IdentityCell label={String(row.getValue("identifierValue") ?? "")} />
      ),
    },
    dateColumn<InvitationDTO>(t, formatDate, "invitationDate"),
    statusColumn<InvitationDTO>(t, (status) => ({
      className: statusInviteClass(status),
      label: inviteStatusLabel(t, status),
    })),
    actionsColumn<InvitationDTO>(t, (row) => (
      <PendingRowActionsCell row={row} onCancelClick={onCancelClick} />
    )),
  ];
}
