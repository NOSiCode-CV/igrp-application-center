"use client";

import {
  Badge,
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IGRPButton,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableHeaderDefault,
  IGRPDataTableHeaderSortToggle,
  IGRPIcon,
  IGRPUserAvatar,
  type Row,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  InvitationDTO,
} from "@igrp/platform-access-management-client-ts";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirmation-modal";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { UserInviteDialog } from "@/features/users/components/user-invite-dialog";
import {
  useCancelUserInvitation,
  useGetUserInvitations,
  useResendUserInvitation,
  useUpdateUserStatus,
  useUsers,
} from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";
import {
  cn,
  geInviteTitle,
  getInitials,
  getStatusColor,
  showStatus,
  statusInviteClass,
} from "@/lib/utils";

interface UserListTableProps {
  initialUsers: IGRPUserDTO[];
  initialInvitations: InvitationDTO[];
}

// ─── Module-level helpers (stable references across renders) ────────────────

const isInviteStatus = (s: string) =>
  ["PENDING", "CANCELED", "REJECTED", "ACCEPTED"].includes(s);

const isTerminalInviteStatus = (s: string) =>
  s === "CANCELED" || s === "REJECTED";

function ActiveRowActionsCell({
  row,
  onStatusClick,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
}) {
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
            Desativar
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onSelect={() => onStatusClick(row.original, "ACTIVE")}
            variant="default"
          >
            <IGRPIcon iconName="CircleCheck" />
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
        description: "URL do convite copiado para a área de transferência",
        duration: 4000,
      });
    } else {
      igrpToast({
        type: "error",
        title: "Erro",
        description: "URL do convite não disponível",
        duration: 4000,
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
            description: "O convite foi reenviado com sucesso",
            duration: 4000,
          });
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: "Erro",
            description: "Não foi possível reenviar o convite",
            duration: 4000,
          });
        },
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="p-1 rounded-sm">
        <IGRPIcon iconName="Ellipsis" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="min-w-44">
        {!isTerminalInviteStatus(String(row.original.status)) && (
          <DropdownMenuItem onSelect={handleCopyUrl}>
            <IGRPIcon iconName="Copy" />
            Copiar URL
          </DropdownMenuItem>
        )}

        {!isTerminalInviteStatus(String(row.original.status)) && (
          <DropdownMenuItem onSelect={handleResend}>
            <IGRPIcon iconName="Mail" />
            Reenviar Convite
          </DropdownMenuItem>
        )}

        {!isTerminalInviteStatus(String(row.original.status)) && (
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            variant="destructive"
            onSelect={() => onCancelClick(row.original)}
          >
            <IGRPIcon iconName="Trash2" />
            Cancelar Convite
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getTableColumns(
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void,
  options?: { showInvitationDate?: boolean },
): ColumnDef<IGRPUserDTO>[] {
  const showInvitationDate = options?.showInvitationDate !== false;
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
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
        <IGRPDataTableHeaderSortToggle column={column} title="Email" />
      ),
      accessorKey: "email",
      cell: ({ row }) => <div>{row.getValue("email") || "N/A"}</div>,
    },
    ...(showInvitationDate
      ? [
          {
            header: "Data do Convite",
            accessorKey: "invitationDate",
            cell: ({ row }: { row: Row<IGRPUserDTO> }) => {
              const date = row.getValue("invitationDate");
              return (
                <div>
                  {date ? new Date(String(date)).toLocaleDateString() : "N/A"}
                </div>
              );
            },
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
        <ActiveRowActionsCell row={row} onStatusClick={onStatusClick} />
      ),
      size: 60,
      enableHiding: false,
    },
  ];
}

function getInvitationColumns(
  onCancelClick: (invitation: InvitationDTO) => void,
): ColumnDef<InvitationDTO>[] {
  return [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
      ),
      accessorKey: "email",
      cell: ({ row }) => {
        const email = String(row.getValue("email") ?? "");
        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={email}
              fallbackContent={getInitials(email)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div>
              <div className="text-sm leading-none">{email}</div>
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

// ─── Main component ──────────────────────────────────────────────────────────

type DialogState =
  | { kind: "none" }
  | { kind: "status"; user: IGRPUserDTO; newStatus: "ACTIVE" | "INACTIVE" }
  | { kind: "cancel"; invitation: InvitationDTO };

export function UserListTable({
  initialUsers,
  initialInvitations,
}: UserListTableProps) {
  const { igrpToast } = useIGRPToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const updateStatusMutation = useUpdateUserStatus();
  const cancelUserInvitationMutation = useCancelUserInvitation();

  const { data: users = initialUsers, error } = useUsers(undefined, {
    initialData: initialUsers,
  });
  const { data: invites, isLoading: isLoadingInvites } = useGetUserInvitations(
    undefined,
    { initialData: initialInvitations },
  );

  const { pendingData, canceledData } = useMemo(() => {
    const pending: InvitationDTO[] = [];
    const canceled: InvitationDTO[] = [];
    for (const inv of invites ?? []) {
      if (inv.status === "PENDING") pending.push(inv);
      else if (inv.status === "CANCELED") canceled.push(inv);
    }
    return { pendingData: pending, canceledData: canceled };
  }, [invites]);

  const handleStatusClick = useCallback(
    (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => {
      setDialog({ kind: "status", user, newStatus });
    },
    [],
  );

  const handleCancelClick = useCallback((invitation: InvitationDTO) => {
    setDialog({ kind: "cancel", invitation });
  }, []);

  const activeColumns = useMemo(
    () => getTableColumns(handleStatusClick, { showInvitationDate: false }),
    [handleStatusClick],
  );
  const inviteColumns = useMemo(
    () => getInvitationColumns(handleCancelClick),
    [handleCancelClick],
  );

  const activeFilters: IGRPDataTableClientFilterListProps<IGRPUserDTO>[] =
    useMemo(
      () => [
        {
          columnId: "name",
          component: ({ column }) => (
            <IGRPDataTableFilterInput
              column={column}
              placeholder="Pesquisar por nome ou email..."
            />
          ),
        },
        {
          columnId: "status",
          component: ({ column }) => (
            <IGRPDataTableFilterFaceted
              column={column}
              options={STATUS_OPTIONS}
              placeholder="Estado"
            />
          ),
        },
      ],
      [],
    );

  const inviteFilters: IGRPDataTableClientFilterListProps<InvitationDTO>[] =
    useMemo(
      () => [
        {
          columnId: "email",
          component: ({ column }) => (
            <IGRPDataTableFilterInput column={column} />
          ),
        },
      ],
      [],
    );

  if (error) throw error;

  const handleConfirmStatusChange = () => {
    if (dialog.kind !== "status") return;
    updateStatusMutation.mutate(
      { id: dialog.user.id, value: dialog.newStatus },
      {
        onSuccess: () => {
          igrpToast({
            type: "success",
            title: "Estado alterado",
            description: "O estado do utilizador foi alterado com sucesso",
            duration: 4000,
          });
          closeDialog();
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: "Erro",
            description: "Não foi possível alterar o estado do utilizador",
            duration: 4000,
          });
        },
      },
    );
  };

  const handleConfirmCancel = () => {
    if (dialog.kind !== "cancel") return;
    cancelUserInvitationMutation.mutate(dialog.invitation.id, {
      onSuccess: () => {
        igrpToast({
          type: "success",
          title: "Convite cancelado",
          description: "O convite foi cancelado com sucesso",
          duration: 4000,
        });
        closeDialog();
      },
      onError: () => {
        igrpToast({
          type: "error",
          title: "Erro",
          description: "Não foi possível cancelar o convite",
          duration: 4000,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Gestão de Utilizadores"
        description="Ver e gerir todos os utilizadores do sistema."
        showActions
      >
        <IGRPButton
          showIcon
          iconName="UserRoundPlus"
          onClick={() => setInviteDialogOpen(true)}
        >
          Convidar Utilizador
        </IGRPButton>
      </PageHeader>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Utilizadores Ativos</TabsTrigger>
          <TabsTrigger value="pending">
            Convites Pendentes ({pendingData.length})
          </TabsTrigger>
          <TabsTrigger value="canceled">
            Convites Cancelados ({canceledData.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <IGRPDataTable<IGRPUserDTO, IGRPUserDTO>
            showFilter
            showPagination
            tableClassName="table-fixed"
            columns={activeColumns}
            data={users}
            clientFilters={activeFilters}
          />
        </TabsContent>

        <TabsContent value="pending">
          {isLoadingInvites ? (
            <AppCenterLoading description="Carregando convites..." />
          ) : (
            <IGRPDataTable<InvitationDTO, InvitationDTO>
              showFilter
              showPagination
              tableClassName="table-fixed"
              columns={inviteColumns}
              data={pendingData}
              clientFilters={inviteFilters}
            />
          )}
        </TabsContent>

        <TabsContent value="canceled">
          {isLoadingInvites ? (
            <AppCenterLoading description="Carregando convites..." />
          ) : (
            <IGRPDataTable<InvitationDTO, InvitationDTO>
              showFilter
              showPagination
              tableClassName="table-fixed"
              columns={inviteColumns}
              data={canceledData}
              clientFilters={inviteFilters}
            />
          )}
        </TabsContent>
      </Tabs>

      {inviteDialogOpen && (
        <UserInviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}

      <ConfirmDialog
        open={dialog.kind === "status"}
        onOpenChange={(open) => !open && closeDialog()}
        title={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? "Desativar Utilizador"
            : "Ativar Utilizador"
        }
        description={
          dialog.kind === "status" ? (
            <>
              Tem certeza que deseja{" "}
              {dialog.newStatus === "INACTIVE" ? "desativar" : "ativar"}{" "}
              <strong>{dialog.user.name || dialog.user.email}</strong>?
            </>
          ) : null
        }
        onConfirm={handleConfirmStatusChange}
        confirmText={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? "Desativar"
            : "Ativar"
        }
        loadingText={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? "Desativando..."
            : "Ativando..."
        }
        iconName={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? "CircleOff"
            : "CircleCheck"
        }
        variant={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? "destructive"
            : "default"
        }
        isLoading={updateStatusMutation.isPending}
      />

      <ConfirmDialog
        open={dialog.kind === "cancel"}
        onOpenChange={(open) => !open && closeDialog()}
        title="Cancelar Convite"
        description={
          dialog.kind === "cancel" ? (
            <>
              Tem certeza que deseja cancelar o convite para{" "}
              <strong>{dialog.invitation.email}</strong>? Esta ação não pode ser
              desfeita.
            </>
          ) : null
        }
        onConfirm={handleConfirmCancel}
        confirmText="Confirmar"
        loadingText="Cancelando..."
        iconName="Trash"
        variant="destructive"
        isLoading={cancelUserInvitationMutation.isPending}
      />
    </div>
  );
}
