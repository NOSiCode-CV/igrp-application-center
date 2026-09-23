"use client";

import { useCallback, useMemo, useState } from "react";

import {
  IGRPButton,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
  IGRPPageHeader,
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

import { ConfirmDialog } from "@/components/confirmation-modal";
import { ColumnFacetedFilter } from "@/components/data-table/faceted-filter";
import { ColumnSearchInput } from "@/components/data-table/search-input";
import { AppCenterLoading } from "@/components/loading";
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
import {
  PAGE_HEADER_ACTIONS_CLASS,
  PAGE_HEADER_PROPS,
} from "@/lib/page-header";

interface UserListProps {
  initialUsers: IGRPUserDTO[];
  initialInvitations: InvitationDTO[];
  /** The signed-in administrator, so their own row cannot offer "Desativar". */
  currentUserId?: string;
}

type DialogState =
  | { kind: "none" }
  | { kind: "status"; user: IGRPUserDTO; newStatus: "ACTIVE" | "INACTIVE" }
  | { kind: "cancel"; invitation: InvitationDTO };

export function UserList({
  initialUsers,
  initialInvitations,
  currentUserId,
}: UserListProps) {
  const { igrpToast } = useIGRPToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const updateStatusMutation = useUpdateUserStatus();
  const cancelUserInvitationMutation = useCancelUserInvitation();

  const {
    data: users = initialUsers,
    error,
    refetch,
    isFetching,
  } = useUsers(undefined, {
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
    () =>
      getTableColumns(handleStatusClick, {
        showInvitationDate: false,
        currentUserId,
      }),
    [handleStatusClick, currentUserId],
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
            <ColumnSearchInput
              column={column}
              label="Pesquisar utilizadores"
              placeholder="Pesquisar por nome ou email…"
            />
          ),
        },
        {
          columnId: "status",
          component: ({ column }) => (
            <ColumnFacetedFilter
              column={column}
              label="Estado"
              options={STATUS_OPTIONS}
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
          columnId: "identifierValue",
          component: ({ column }) => (
            <ColumnSearchInput
              column={column}
              label="Pesquisar convites"
              placeholder="Pesquisar por email…"
            />
          ),
        },
      ],
      [],
    );

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
            duration: 6000,
          });
          closeDialog();
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: "Não foi possível alterar o estado",
            description:
              "O estado do utilizador não foi alterado. Tente novamente.",
            duration: 6000,
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
          duration: 6000,
        });
        closeDialog();
      },
      onError: () => {
        igrpToast({
          type: "error",
          title: "Não foi possível cancelar o convite",
          description: "O convite mantém-se ativo. Tente novamente.",
          duration: 6000,
        });
      },
    });
  };

  return (
    /* No `animate-fade-in`: the page fading in on every navigation is motion
       that reports nothing — the content did not change, it arrived. */
    /* gap-6 header -> content, matching `/settings/applications`. */
    <div className="flex flex-col gap-6">
      <IGRPPageHeader
        {...PAGE_HEADER_PROPS}
        title="Gestão de Utilizadores"
        description="Ver e gerir todos os utilizadores do sistema."
        showBackButton
        urlBackButton="/settings"
      >
        <div className={PAGE_HEADER_ACTIONS_CLASS}>
          <IGRPButton
            showIcon
            iconName="UserRoundPlus"
            onClick={() => setInviteDialogOpen(true)}
          >
            Convidar Utilizador
          </IGRPButton>
        </div>
      </IGRPPageHeader>

      {error && (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-lg bg-warning-subtle px-4 py-3 text-sm text-warning-subtle-foreground sm:flex-row sm:items-center sm:justify-between"
        >
          <span>
            Esta lista pode estar desatualizada: a última atualização falhou.
          </span>
          <IGRPButton
            variant="outline"
            size="sm"
            showIcon
            iconName="RotateCw"
            disabled={isFetching}
            onClick={() => refetch()}
          >
            {isFetching ? "A atualizar..." : "Atualizar"}
          </IGRPButton>
        </div>
      )}

      <Tabs defaultValue="active" className="flex flex-col gap-6">
        <TabsList>
          <TabsTrigger value="active">
            Utilizadores ({users.length})
          </TabsTrigger>
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
            <AppCenterLoading description="A carregar convites..." />
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
            <AppCenterLoading description="A carregar convites..." />
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

      <UserInviteDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />

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
            dialog.newStatus === "INACTIVE" ? (
              <>
                <strong>{dialog.user.name || dialog.user.email}</strong> deixa
                de poder entrar na plataforma. O acesso pode ser reposto a
                qualquer momento.
              </>
            ) : (
              <>
                <strong>{dialog.user.name || dialog.user.email}</strong> volta a
                poder entrar na plataforma com os perfis que já tinha.
              </>
            )
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
            ? "A desativar..."
            : "A ativar..."
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
              A ligação enviada a{" "}
              <strong>{dialog.invitation.identifierValue}</strong> deixa de
              funcionar e a pessoa não poderá aceitar o convite. Esta ação não
              pode ser desfeita.
            </>
          ) : null
        }
        onConfirm={handleConfirmCancel}
        confirmText="Cancelar Convite"
        cancelText="Manter Convite"
        loadingText="A cancelar..."
        iconName="Trash"
        variant="destructive"
        isLoading={cancelUserInvitationMutation.isPending}
      />
    </div>
  );
}
