"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Card,
  CardContent,
  cn,
  IGRPButton,
  IGRPIcon,
  IGRPInputText,
  type IGRPTabItem,
  IGRPTabs,
  IGRPUserAvatar,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { Status } from "@igrp/platform-access-management-client-ts";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import ProfileRoleList from "@/features/profile/components/profile-role-list";
import { useCurrentUser, useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";
import UserApplications from "./user-applications";
import UserSignature from "./user-signature";

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useUploadPublicFiles();

  const { data: avatarFile, isLoading: isLoadingFile } = useFiles(
    user?.picture ?? "",
  );

  const [localPreview, setLocalPreview] = useState<string | null>(null);
  useEffect(
    () => () => {
      if (localPreview) URL.revokeObjectURL(localPreview);
    },
    [localPreview],
  );

  const currentAvatarUrl = localPreview ?? avatarFile?.url ?? null;

  useEffect(() => {
    if (user && isEditingName) {
      setEditedName(user.name);
    }
  }, [user, isEditingName]);

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setLocalPreview(preview);

    try {
      const path = await uploadFile.mutateAsync({
        file,
        options: { folder: `users/${user.id}/avatar` },
      });

      const res = await updateUser({
        id: user.id,
        user: { ...user, picture: path },
      });

      if (!res.success) throw new Error(res.error);

      await queryClient.invalidateQueries({ queryKey: ["current-user"] });

      igrpToast({
        type: "success",
        title: "Avatar atualizado com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar avatar",
        description: (err as Error).message,
        duration: 4000,
      });
    } finally {
      URL.revokeObjectURL(preview);
      setLocalPreview(null);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim() || editedName === user.name) {
      setIsEditingName(false);
      return;
    }

    try {
      const res = await updateUser({
        id: user.id,
        user: {
          ...user,
          name: editedName.trim(),
        },
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      await queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });
      setIsEditingName(false);
      igrpToast({
        type: "success",
        title: "Nome atualizado com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar nome",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdatingStatus(true);
    try {
      const newStatus = isActive ? "INACTIVE" : "ACTIVE";
      const res = await updateUser({
        id: user.id,
        user: {
          ...user,
          status: newStatus as Status,
        },
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      await queryClient.invalidateQueries({
        queryKey: ["current-user"],
      });
      setShowStatusDialog(false);
      igrpToast({
        type: "success",
        title: `Utilizador ${isActive ? "desativado" : "ativado"} com sucesso`,
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao alterar estado",
        description: (err as Error).message,
        duration: 4000,
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

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
              <button
                type="button"
                className="relative group cursor-pointer p-0 border-0 bg-transparent"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="absolute -inset-1 rounded-full blur opacity-75 group-hover:opacity-100 transition" />

                <IGRPUserAvatar
                  alt={user.name}
                  image={currentAvatarUrl}
                  fallbackContent={
                    isLoadingFile ? (
                      <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
                        <IGRPIcon
                          iconName="LoaderCircle"
                          className="w-8 h-8 text-muted-foreground animate-spin"
                        />
                      </div>
                    ) : (
                      getInitials(
                        user?.name || user?.username || user?.email || "",
                      )
                    )
                  }
                  className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
                  fallbackClass="text-3xl"
                />

                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                  <IGRPIcon
                    iconName={
                      isLoadingFile || uploadFile.isPending
                        ? "LoaderCircle"
                        : "Camera"
                    }
                    className={cn(
                      "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
                      (isLoadingFile || uploadFile.isPending) && "animate-spin",
                    )}
                  />
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  disabled={uploadFile.isPending}
                />
              </button>

              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <IGRPInputText
                      value={editedName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditedName(e.target.value)
                      }
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === "Enter") handleSaveName();
                        if (e.key === "Escape") setIsEditingName(false);
                      }}
                      className="text-2xl font-bold tracking-tight h-10"
                      autoFocus
                    />
                    <IGRPButton
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveName}
                    >
                      <IGRPIcon iconName="Check" className="w-4 h-4" />
                    </IGRPButton>
                    <IGRPButton
                      size="sm"
                      variant="ghost"
                      onClick={() => setIsEditingName(false)}
                    >
                      <IGRPIcon iconName="X" className="w-4 h-4" />
                    </IGRPButton>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1 group">
                    <h1 className="text-2xl font-bold tracking-tight">
                      {user.name || user.username || "N/A"}
                    </h1>
                    <IGRPButton
                      size="sm"
                      variant="ghost"
                      className="opacity-100 transition-opacity"
                      onClick={() => setIsEditingName(true)}
                    >
                      <IGRPIcon iconName="Pencil" className="w-4 h-4" />
                    </IGRPButton>
                  </div>
                )}
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

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              {isActive ? "Desativar" : "Ativar"} Utilizador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
              utilizador{" "}
              <strong className="text-foreground">{user.name}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <IGRPButton
              disabled={isUpdatingStatus}
              variant="outline"
              onClick={() => setShowStatusDialog(false)}
              type="button"
              showIcon
              iconPlacement="start"
              iconName="X"
            >
              Cancelar
            </IGRPButton>
            <IGRPButton
              onClick={handleToggleStatus}
              disabled={isUpdatingStatus}
              className={cn(
                isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90",
                "gap-2 text-white",
              )}
            >
              {isUpdatingStatus ? (
                <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
              ) : (
                <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
              )}
              {isActive ? "Confirmar Desativar" : "Confirmar Ativar"}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
