"use client";

import {
  Badge,
  type ColumnDef,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { ButtonLink } from "@/components/button-link";
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

function ActiveRowActionsCell({
  row,
  onStatusClick,
}: {
  row: Row<IGRPUserDTO>;
  onStatusClick: (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => void;
}) {
  const state = String(row.getValue("status"));
  const router = useRouter();

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

        <DropdownMenuItem
          variant="default"
          onClick={() => router.push(`/settings/users/${row.original.id}`)}
        >
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
        {String(row.original.status) !== "CANCELED" &&
          String(row.original.status) !== "REJECTED" && (
            <DropdownMenuItem onSelect={handleCopyUrl}>
              <IGRPIcon iconName="Copy" />
              Copiar URL
            </DropdownMenuItem>
          )}

        <DropdownMenuItem onSelect={handleResend}>
          <IGRPIcon iconName="Mail" />
          Reenviar Convite
        </DropdownMenuItem>

        {String(row.original.status) !== "CANCELED" &&
          String(row.original.status) !== "REJECTED" && (
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

export function UserListTable({
  initialUsers,
  initialInvitations,
}: UserListTableProps) {
  const { igrpToast } = useIGRPToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [userToUpdate, setUserToUpdate] = useState<{
    user: IGRPUserDTO;
    newStatus: "ACTIVE" | "INACTIVE";
  } | null>(null);
  const [userToCancel, setUserToCancel] = useState<InvitationDTO | null>(null);

  const updateStatusMutation = useUpdateUserStatus();
  const cancelUserInvitationMutation = useCancelUserInvitation();

  const { data: users = initialUsers, error } = useUsers(undefined, {
    initialData: initialUsers,
  });
  const { data: invites, isLoading: isLoadingInvites } = useGetUserInvitations(
    undefined,
    { initialData: initialInvitations },
  );

  const data = useMemo(() => users ?? [], [users]);
  const pendingData = useMemo(
    () => invites?.filter((invite) => invite.status === "PENDING") ?? [],
    [invites],
  );
  const canceledData = useMemo(
    () => invites?.filter((invite) => invite.status === "CANCELED") ?? [],
    [invites],
  );

  const handleStatusClick = useCallback(
    (user: IGRPUserDTO, newStatus: "ACTIVE" | "INACTIVE") => {
      setUserToUpdate({ user, newStatus });
      setStatusDialogOpen(true);
    },
    [],
  );

  const handleCancelClick = useCallback((invitation: InvitationDTO) => {
    setUserToCancel(invitation);
    setCancelDialogOpen(true);
  }, []);

  const activeColumns = useMemo(
    () => getTableColumns(handleStatusClick, { showInvitationDate: false }),
    [handleStatusClick],
  );
  const pendingColumns = useMemo(
    () => getInvitationColumns(handleCancelClick),
    [handleCancelClick],
  );
  const canceledColumns = useMemo(
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
    if (userToUpdate?.user.id) {
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
            data={data}
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
              columns={pendingColumns}
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
              columns={canceledColumns}
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
