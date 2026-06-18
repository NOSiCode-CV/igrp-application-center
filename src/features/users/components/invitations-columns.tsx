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

import { useResendUserInvitation } from "@/features/users/use-users";
import { geInviteTitle, getInitials, statusInviteClass } from "@/lib/utilities";
import { cn } from "@/lib/utils";

const isTerminalInviteStatus = (s: string) =>
  s === "CANCELED" || s === "REJECTED";

function PendingRowActionsCell({
  row,
  onCancelClick,
}: {
  row: Row<InvitationDTO>;
  onCancelClick: (invitation: InvitationDTO) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const resendMutation = useResendUserInvitation();

  const handleCopyUrl = () => {
    const invitationUrl = row.original.invitationUrl;
    if (invitationUrl) {
      navigator.clipboard.writeText(invitationUrl);
      igrpToast({
        type: "success",
        title: "URL copiado",
        description: "URL do convite copiado para a área de transferência.",
        duration: 6000,
      });
    } else {
      igrpToast({
        type: "error",
        title: "Convite não disponível",
        description: "URL do convite não disponível.",
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
            title: "Convite reenviado",
            description: "O convite foi reenviado com sucesso.",
            duration: 6000,
          });
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: "Convite não reenviado",
            description: "Não foi possível reenviar o convite.",
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
              Copiar URL
            </DropdownMenuItem>

            <DropdownMenuItem onSelect={handleResend}>
              <IGRPIcon iconName="Mail" />
              Reenviar Convite
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              variant="destructive"
              onSelect={() => onCancelClick(row.original)}
            >
              <IGRPIcon iconName="Trash2" />
              Cancelar Convite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}

export function getInvitationColumns(
  onCancelClick: (invitation: InvitationDTO) => void,
): ColumnDef<InvitationDTO>[] {
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
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
      header: "Data do Convite",
      accessorKey: "invitationDate",
      cell: ({ row }) => {
        const date = row.getValue("invitationDate");
        return (
          <div>
            {date ? new Date(String(date)).toLocaleDateString() : "N/A"}
          </div>
        );
      },
    },
    {
      header: () => (
        <IGRPDataTableHeaderDefault title="Estado" className="text-center" />
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = String(row.getValue("status") ?? "");
        return (
          <div className="text-center">
            <Badge className={cn(statusInviteClass(status), "capitalize")}>
              {geInviteTitle(status)}
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
        <PendingRowActionsCell row={row} onCancelClick={onCancelClick} />
      ),
      size: 60,
      enableHiding: false,
    },
  ];
}
