"use client";

import {
  Card,
  CardContent,
  IGRPButton,
  type IGRPTabItem,
  IGRPTabs,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import ProfileRoleList from "@/features/profile/components/profile-role-list";
import { useCurrentUser, useUpdateUser } from "@/features/users/use-users";
import { UserProfileAvatar } from "./user-profile-avatar";
import { UserProfileEditableName } from "./user-profile-editable-name";
import { UserProfileStatusDialog } from "./user-profile-status-dialog";
import UserApplications from "./user-applications";
import UserSignature from "./user-signature";

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();

  const [showStatusDialog, setShowStatusDialog] = useState(false);

  const uploadFile = useUploadPublicFiles();

  const { data: avatarFile, isLoading: isLoadingFile } = useFiles(
    user?.picture ?? "",
  );

  if (userError) throw userError;

  if (isLoading) {
    return <AppCenterLoading description="Carregando utilizador..." />;
  }

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrado."
      />
    );
  }

  const isActive = user.status === "ACTIVE";

  const tabs: IGRPTabItem[] = [
    {
      label: "Departamentos",
      value: "departments",
      content: <DepartmentListSimple />,
    },
    {
      label: "Aplicações",
      value: "applications",
      content: <UserApplications />,
    },
    {
      label: "Roles",
      value: "roles",
      content: <ProfileRoleList />,
    },
    {
      label: "Assinatura",
      value: "signature",
      content: <UserSignature refetch={refetch} user={user} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-xl -z-10" />

        <Card className="py-2 border-0 shadow-sm">
          <CardContent className="px-4 py-1">
            <div className="flex items-center mb-2 justify-end gap-2">
              <IGRPButton
                showIcon
                variant={isActive ? "destructive" : "default"}
                iconName={isActive ? "Ban" : "Check"}
                size="sm"
                className="cursor-pointer"
                onClick={() => setShowStatusDialog(true)}
              >
                {isActive ? "Desativar" : "Ativar"}
              </IGRPButton>
            </div>
            <div className="flex items-center gap-6">
              <UserProfileAvatar
                user={user}
                resolvedUrl={avatarFile?.url ?? null}
                isResolvingUrl={isLoadingFile}
                isUploading={uploadFile.isPending}
                onUpload={async (file) => {
                  const path = await uploadFile.mutateAsync({
                    file,
                    options: { folder: `users/${user.id}/avatar` },
                  });
                  const res = await updateUser({
                    id: user.id,
                    user: { ...user, picture: path },
                  });
                  if (!res.success) {
                    igrpToast({
                      type: "error",
                      title: "Erro ao atualizar avatar",
                      description: res.error,
                      duration: 4000,
                    });
                    throw new Error(res.error);
                  }
                  igrpToast({
                    type: "success",
                    title: "Avatar atualizado com sucesso",
                    duration: 4000,
                  });
                }}
              />

              <div className="flex-1">
                <UserProfileEditableName
                  name={user.name || user.username || ""}
                  fallback="N/A"
                  onSave={async (next) => {
                    const res = await updateUser({
                      id: user.id,
                      user: { ...user, name: next },
                    });
                    if (!res.success) {
                      igrpToast({
                        type: "error",
                        title: "Erro ao atualizar nome",
                        description: res.error,
                        duration: 4000,
                      });
                      throw new Error(res.error);
                    }
                    igrpToast({
                      type: "success",
                      title: "Nome atualizado com sucesso",
                      duration: 4000,
                    });
                  }}
                />
                <p className="text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <IGRPTabs
        defaultValue="departments"
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
        orientation="horizontal"
      />

      <UserProfileStatusDialog
        open={showStatusDialog}
        isActive={isActive}
        userName={user.name}
        onOpenChange={setShowStatusDialog}
        onConfirm={async (next) => {
          const res = await updateUser({
            id: user.id,
            user: { ...user, status: next },
          });
          if (!res.success) {
            igrpToast({
              type: "error",
              title: "Erro ao alterar estado",
              description: res.error,
              duration: 4000,
            });
            throw new Error(res.error);
          }
          setShowStatusDialog(false);
          igrpToast({
            type: "success",
            title: `Utilizador ${next === "ACTIVE" ? "ativado" : "desativado"} com sucesso`,
            duration: 4000,
          });
        }}
      />
    </div>
  );
}
