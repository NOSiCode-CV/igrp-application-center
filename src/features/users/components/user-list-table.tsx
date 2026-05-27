"use client";

import {
  IGRPButton,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
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
import { useCallback, useMemo, useState } from "react";
import { ConfirmDialog } from "@/components/confirmation-modal";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { getInvitationColumns } from "@/features/users/components/invitations-columns";
import { UserInviteDialog } from "@/features/users/components/user-invite-dialog";
import { getTableColumns } from "@/features/users/components/users-columns";
import {
  useCancelUserInvitation,
  useGetUserInvitations,
  useUpdateUserStatus,
  useUsers,
} from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";

interface UserListTableProps {
  initialUsers: IGRPUserDTO[];
  initialInvitations: InvitationDTO[];
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
