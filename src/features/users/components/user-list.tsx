"use client";

import {
  type ColumnDef,
  IGRPBadgePrimitive,
  IGRPDataTable,
  type IGRPDataTableClientFilterListProps,
  IGRPDataTableFacetedFilterFn,
  IGRPDataTableFilterFaceted,
  IGRPDataTableFilterInput,
  IGRPDataTableHeaderDefault,
  IGRPDataTableHeaderSortToggle,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPUserAvatar,
  type Row,
  IGRPTabsPrimitive,
  IGRPTabsListPrimitive,
  IGRPTabsTriggerPrimitive,
  IGRPTabsContentPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useEffect, useState } from "react";

import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { UserInviteDialog } from "@/features/users/components/user-invite-dialog";
import {
  useUsers,
  useGetUserInvitations,
  useResendUserInvitation,
  useUpdateUserStatus,
  useCancelUserInvitation,
} from "@/features/users/use-users";
import { STATUS_OPTIONS } from "@/lib/constants";
import { cn, geInviteTitle, getInitials, getStatusColor, showStatus, statusInviteClass } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/confirmation-modal";

export function UserList() {
  const [data, setData] = useState<IGRPUserDTO[]>([]);
  const [pendingData, setPendingData] = useState<IGRPUserDTO[]>([]);
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<{
    user: IGRPUserDTO;
    newStatus: "ACTIVE" | "INACTIVE";
  } | null>(null);
  const [userToCancel, setUserToCancel] = useState<IGRPUserDTO | null>(null);

  const resendMutation = useResendUserInvitation();
  const updateStatusMutation = useUpdateUserStatus();

  const cancelUserInvitationMutation = useCancelUserInvitation();

  const { data: users, isLoading, error } = useUsers();
  const { data: invites, isLoading: isLoadingInvites } =
    useGetUserInvitations();

  useEffect(() => {
    setData(users ?? []);
  }, [users]);

  useEffect(() => {
    setPendingData(invites ?? []);
  }, [invites]);

  const activeColumns: ColumnDef<IGRPUserDTO>[] = [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Nome" />
      ),
      accessorKey: "name",
      cell: ({ row }) => {
        const email = String(row.getValue("email"));
        const nameValue = row.getValue("name");
        const name =
          nameValue && String(nameValue) !== "null" ? String(nameValue) : email;
        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={name}
              fallbackContent={getInitials(name)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div>
              <div className="text-sm leading-none">{name}</div>
              <span className="text-muted-foreground text-xs">{email}</span>
            </div>
          </div>
        );
      },
    },
    {
      header: "Email",
      accessorKey: "email",
      cell: ({ row }) => <div>{row.getValue("email") || "N/A"}</div>,
    },
    {
      header: () => (
        <IGRPDataTableHeaderDefault title="Estado" className="text-center" />
      ),
      accessorKey: "status",
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        return (
          <div className="text-center">
            <IGRPBadgePrimitive
              className={cn(getStatusColor(status), "capitalize")}
            >
              {showStatus(status)}
            </IGRPBadgePrimitive>
          </div>
        );
      },
      filterFn: IGRPDataTableFacetedFilterFn,
      size: 70,
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <ActiveRowActions row={row} />,
      size: 60,
      enableHiding: false,
    },
  ];

  const pendingColumns: ColumnDef<IGRPUserDTO>[] = [
    {
      header: ({ column }) => (
        <IGRPDataTableHeaderSortToggle column={column} title="Email" />
      ),
      accessorKey: "email",
      cell: ({ row }) => {
        const email = String(row.getValue("email"));
        return (
          <div className="flex items-center gap-3">
            <IGRPUserAvatar
              alt={email}
              fallbackContent={getInitials(email)}
              className="size-10"
              fallbackClass="text-base bg-primary text-primary-foreground"
            />
            <div className="text-sm">{email}</div>
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
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => {
        const status = row.getValue("status");
        return (
          <div>
            <IGRPBadgePrimitive
              className={cn(statusInviteClass(status as string), "capitalize")}
            >
              {geInviteTitle(status as string)}
            </IGRPBadgePrimitive>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Ações</span>,
      cell: ({ row }) => <PendingRowActions row={row} />,
      size: 60,
    },
  ];

  function ActiveRowActions({ row }: { row: Row<IGRPUserDTO> }) {
    const state = String(row.getValue("status"));

    const handleStatusClick = (newStatus: "ACTIVE" | "INACTIVE") => {
      setUserToUpdate({
        user: row.original,
        newStatus,
      });
      setStatusDialogOpen(true);
    };

    return (
      <IGRPDropdownMenuPrimitive>
        <IGRPDropdownMenuTriggerPrimitive className="p-1 rounded-sm">
          <IGRPIcon iconName="Ellipsis" />
        </IGRPDropdownMenuTriggerPrimitive>

        <IGRPDropdownMenuContentPrimitive align="end" className="min-w-44">
          {state === "ACTIVE" ? (
            <IGRPDropdownMenuItemPrimitive
              className="text-destructive focus:text-destructive"
              onSelect={() => handleStatusClick("INACTIVE")}
              variant="destructive"
            >
              <IGRPIcon iconName="CircleOff" />
              Desativar
            </IGRPDropdownMenuItemPrimitive>
          ) : (
            <IGRPDropdownMenuItemPrimitive
              onSelect={() => handleStatusClick("ACTIVE")}
              variant="default"
            >
              <IGRPIcon iconName="CircleCheck" />
              Ativar
            </IGRPDropdownMenuItemPrimitive>
          )}

          <IGRPDropdownMenuItemPrimitive
            variant="default"
            onClick={() => router.push(`/settings/users/${row.original.id}`)}
          >
            <Link className="flex gap-2" href={`/settings/users/${row.original.id}`}>
              <IGRPIcon iconName="UserCog" />
              Gerir
            </Link>
          </IGRPDropdownMenuItemPrimitive>
        </IGRPDropdownMenuContentPrimitive>
      </IGRPDropdownMenuPrimitive>
    );
  }

  function PendingRowActions({ row }: { row: Row<IGRPUserDTO> }) {
    const handleCopyUrl = () => {
      const invitationUrl = (row.original as any).invitationUrl;
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

    const handleCancelClick = () => {
      setUserToCancel(row.original);
      setCancelDialogOpen(true);
    };

    return (
      <IGRPDropdownMenuPrimitive>
        <IGRPDropdownMenuTriggerPrimitive className="p-1 rounded-sm">
          <IGRPIcon iconName="Ellipsis" />
        </IGRPDropdownMenuTriggerPrimitive>

        <IGRPDropdownMenuContentPrimitive align="end" className="min-w-44">
          {String(row.original.status) !== "CANCELED" && String(row.original.status) !== "REJECTED" && (
            <IGRPDropdownMenuItemPrimitive onSelect={handleCopyUrl}>
            <IGRPIcon iconName="Copy" />
            Copiar URL
          </IGRPDropdownMenuItemPrimitive>
          )}

          <IGRPDropdownMenuItemPrimitive onSelect={handleResend}>
            <IGRPIcon iconName="Mail" />
            Reenviar Convite
          </IGRPDropdownMenuItemPrimitive>

          {String(row.original.status) !== "CANCELED" && String(row.original.status) !== "REJECTED" && (
            <IGRPDropdownMenuItemPrimitive
            className="text-destructive focus:text-destructive"
            variant="destructive"
            onSelect={handleCancelClick}
          >
            <IGRPIcon iconName="Trash2" />
            Cancelar Convite
          </IGRPDropdownMenuItemPrimitive>
          )}
        </IGRPDropdownMenuContentPrimitive>
      </IGRPDropdownMenuPrimitive>
    );
  }

  const activeFilters: IGRPDataTableClientFilterListProps<IGRPUserDTO>[] = [
    {
      columnId: "name",
      component: (column) => <IGRPDataTableFilterInput column={column} />,
    },
    {
      columnId: "status",
      component: (column) => (
        <IGRPDataTableFilterFaceted
          column={column}
          options={STATUS_OPTIONS}
          placeholder="Estado"
        />
      ),
    },
  ];

  if (isLoading || !users) {
    return <AppCenterLoading descrption="Carregando utilizadores..." />;
  }

  if (error) throw error;

  const handleConfirmStatusChange = () => {
    if (userToUpdate && userToUpdate.user.id) {
      updateStatusMutation.mutate(
        { id: userToUpdate.user.id, value: userToUpdate.newStatus },
        {
          onSuccess: () => {
            igrpToast({
              type: "success",
              title: "Estado alterado",
              description: "O estado do utilizador foi alterado com sucesso",
              duration: 4000,
            });
            setStatusDialogOpen(false);
            setUserToUpdate(null);
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
    }
  };

  const handleConfirmCancel = () => {
    if (userToCancel) {
      cancelUserInvitationMutation.mutate(userToCancel.id, {
        onSuccess: () => {
          igrpToast({
            type: "success",
            title: "Convite cancelado",
            description: "O convite foi cancelado com sucesso",
            duration: 4000,
          });
          setCancelDialogOpen(false);
          setUserToCancel(null);
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
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Gestão de Utilizadores"
        description="Ver e gerir todos os utilizadores do sistema."
        showActions
      >
        <ButtonLink
          onClick={() => setInviteDialogOpen(true)}
          icon="UserRoundPlus"
          href="#"
          label="Convidar Utilizador"
        />
      </PageHeader>

      <IGRPTabsPrimitive defaultValue="active">
        <IGRPTabsListPrimitive>
          <IGRPTabsTriggerPrimitive value="active">
            Utilizadores Ativos
          </IGRPTabsTriggerPrimitive>
          <IGRPTabsTriggerPrimitive value="pending">
            Convites Pendentes ({pendingData.length})
          </IGRPTabsTriggerPrimitive>
        </IGRPTabsListPrimitive>

        <IGRPTabsContentPrimitive value="active">
          <IGRPDataTable<IGRPUserDTO, IGRPUserDTO>
            showFilter
            showPagination
            tableClassName="table-fixed"
            columns={activeColumns}
            data={data}
            clientFilters={activeFilters}
          />
        </IGRPTabsContentPrimitive>

        <IGRPTabsContentPrimitive value="pending">
          {isLoadingInvites ? (
            <AppCenterLoading descrption="Carregando convites..." />
          ) : (
            <IGRPDataTable<IGRPUserDTO, IGRPUserDTO>
              showFilter
              showPagination
              tableClassName="table-fixed"
              columns={pendingColumns}
              data={pendingData}
            />
          )}
        </IGRPTabsContentPrimitive>
      </IGRPTabsPrimitive>

      {inviteDialogOpen && (
        <UserInviteDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
        />
      )}

      <ConfirmDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        title={
          userToUpdate?.newStatus === "INACTIVE"
            ? "Desativar Utilizador"
            : "Ativar Utilizador"
        }
        description={
          <>
            Tem certeza que deseja{" "}
            {userToUpdate?.newStatus === "INACTIVE" ? "desativar" : "ativar"}
            <strong>
              {userToUpdate?.user.name || userToUpdate?.user.email}
            </strong>
            ?
          </>
        }
        onConfirm={handleConfirmStatusChange}
        confirmText={
          userToUpdate?.newStatus === "INACTIVE" ? "Desativar" : "Ativar"
        }
        loadingText={
          userToUpdate?.newStatus === "INACTIVE"
            ? "Desativando..."
            : "Ativando..."
        }
        iconName={
          userToUpdate?.newStatus === "INACTIVE" ? "CircleOff" : "CircleCheck"
        }
        variant={
          userToUpdate?.newStatus === "INACTIVE" ? "destructive" : "default"
        }
        isLoading={updateStatusMutation.isPending}
      />

      <ConfirmDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        title="Cancelar Convite"
        description={
          <>
            Tem certeza que deseja cancelar o convite para{" "}
            <strong>{userToCancel?.email}</strong>? Esta ação não pode ser
            desfeita.
          </>
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
