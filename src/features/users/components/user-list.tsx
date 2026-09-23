"use client";

import { useCallback, useMemo, useState } from "react";

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
import { useTranslations } from "next-intl";

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
import { useFormat } from "@/i18n/format";

import { useUserStatusOptions } from "../lib/i18n";

interface UserListProps {
  initialUsers: IGRPUserDTO[];
  initialInvitations: InvitationDTO[];
}

type DialogState =
  | { kind: "none" }
  | { kind: "status"; user: IGRPUserDTO; newStatus: "ACTIVE" | "INACTIVE" }
  | { kind: "cancel"; invitation: InvitationDTO };

export function UserList({ initialUsers, initialInvitations }: UserListProps) {
  const t = useTranslations("users");
  const { formatDate } = useFormat();
  const statusOptions = useUserStatusOptions();
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
    () =>
      getTableColumns(t, formatDate, handleStatusClick, {
        showInvitationDate: false,
      }),
    [t, formatDate, handleStatusClick],
  );
  const inviteColumns = useMemo(
    () => getInvitationColumns(t, formatDate, handleCancelClick),
    [t, formatDate, handleCancelClick],
  );

  const activeFilters: IGRPDataTableClientFilterListProps<IGRPUserDTO>[] =
    useMemo(
      () => [
        {
          columnId: "name",
          component: ({ column }) => (
            <IGRPDataTableFilterInput
              column={column}
              placeholder={t("list.filters.searchByNameOrEmail")}
            />
          ),
        },
        {
          columnId: "status",
          component: ({ column }) => (
            <IGRPDataTableFilterFaceted
              column={column}
              options={statusOptions}
              placeholder={t("list.filters.status")}
            />
          ),
        },
      ],
      [t, statusOptions],
    );

  const inviteFilters: IGRPDataTableClientFilterListProps<InvitationDTO>[] =
    useMemo(
      () => [
        {
          columnId: "identifierValue",
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
            title: t("list.toasts.statusChanged"),
            description: t("list.toasts.statusChangedDescription"),
            duration: 6000,
          });
          closeDialog();
        },
        onError: () => {
          igrpToast({
            type: "error",
            title: t("list.toasts.error"),
            description: t("list.toasts.statusChangeFailed"),
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
          title: t("list.toasts.invitationCanceled"),
          description: t("list.toasts.invitationCanceledDescription"),
          duration: 6000,
        });
        closeDialog();
      },
      onError: () => {
        igrpToast({
          type: "error",
          title: t("list.toasts.error"),
          description: t("list.toasts.invitationCancelFailed"),
          duration: 6000,
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={t("list.title")}
        description={t("list.description")}
        showActions
      >
        <IGRPButton
          showIcon
          iconName="UserRoundPlus"
          onClick={() => setInviteDialogOpen(true)}
        >
          {t("list.inviteUser")}
        </IGRPButton>
      </PageHeader>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t("list.tabs.active")}</TabsTrigger>
          <TabsTrigger value="pending">
            {t("list.tabs.pending", { count: pendingData.length })}
          </TabsTrigger>
          <TabsTrigger value="canceled">
            {t("list.tabs.canceled", { count: canceledData.length })}
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
            <AppCenterLoading description={t("list.loadingInvitations")} />
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
            <AppCenterLoading description={t("list.loadingInvitations")} />
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
            ? t("list.statusDialog.deactivateTitle")
            : t("list.statusDialog.activateTitle")
        }
        description={
          dialog.kind === "status"
            ? t.rich(
                dialog.newStatus === "INACTIVE"
                  ? "list.statusDialog.deactivateDescription"
                  : "list.statusDialog.activateDescription",
                {
                  name: dialog.user.name || dialog.user.email,
                  strong: (chunks) => <strong>{chunks}</strong>,
                },
              )
            : null
        }
        onConfirm={handleConfirmStatusChange}
        confirmText={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? t("list.statusDialog.deactivate")
            : t("list.statusDialog.activate")
        }
        loadingText={
          dialog.kind === "status" && dialog.newStatus === "INACTIVE"
            ? t("list.statusDialog.deactivating")
            : t("list.statusDialog.activating")
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
        title={t("list.cancelDialog.title")}
        description={
          dialog.kind === "cancel"
            ? t.rich("list.cancelDialog.description", {
                identifier: dialog.invitation.identifierValue,
                strong: (chunks) => <strong>{chunks}</strong>,
              })
            : null
        }
        onConfirm={handleConfirmCancel}
        confirmText={t("list.cancelDialog.confirm")}
        loadingText={t("list.cancelDialog.canceling")}
        iconName="Trash"
        variant="destructive"
        isLoading={cancelUserInvitationMutation.isPending}
      />
    </div>
  );
}
