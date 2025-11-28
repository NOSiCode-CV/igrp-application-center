"use client";

import {
  IGRPIcon,
  IGRPUserAvatar,
  useIGRPToast,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPButton,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPAlertDialogTitlePrimitive,
  IGRPAlertDialogDescriptionPrimitive,
  IGRPAlertDialogFooterPrimitive,
  cn,
  IGRPTabItem,
  IGRPTabs,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useCurrentUser, useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";
import { UserEditForm } from "./user-edit-form";
import UserSignature from "./user-signature";
import UserRoleList from "./user-role-list";
import { useQueryClient } from "@tanstack/react-query";
import UserApplications from "./user-applications";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import { Status } from "@igrp/platform-access-management-client-ts";

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useUploadPublicFiles();
  const [uploadedAvatarPath, setUploadedAvatarPath] = useState<string | null>(
    null,
  );

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || uploadedAvatarPath || "",
  );

  useEffect(() => {
    if (avatarUrl) {
      setAvatarPreview(avatarUrl.url);
      setUploadedAvatarPath(null);
    }
  }, [avatarUrl]);

  useEffect(() => {
    if (user && isEditingName) {
      setEditedName(user.name);
    }
  }, [user, isEditingName]);

  if (isLoading) {
    return <AppCenterLoading descrption="Carregando utilizador..." />;
  }

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrada."
      />
    );
  }

  if (userError) throw userError;

  const isActive = user.status === "ACTIVE";

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile.mutateAsync({
        file: file,
        options: {
          folder: `users/${user.id}/avatar`,
        },
      });

      setUploadedAvatarPath(result);

      const res = await updateUser({
        id: user.id,
        user: {
          ...user,
          picture: result,
        },
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      refetch();
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

  const currentAvatarUrl = avatarPreview || avatarUrl?.url || null;

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
      content: <UserRoleList user={user} />,
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

        <IGRPCardPrimitive className="py-2 border-0 shadow-sm">
          <IGRPCardContentPrimitive className="px-4 py-1">
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
              <div
                className="relative group cursor-pointer"
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
                      getInitials(user.name)
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
                      isLoadingFile || (uploadFile.isPending && "animate-spin"),
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
              </div>

              <div className="flex-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2 mb-1">
                    <IGRPInputText
                      value={editedName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedName(e.target.value)}
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
                      {user.name}
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
          </IGRPCardContentPrimitive>
        </IGRPCardPrimitive>
      </div>

      <IGRPTabs
        defaultValue="departments"
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
        orientation="horizontal"
      />

      <IGRPAlertDialogPrimitive
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
      >
        <IGRPAlertDialogContentPrimitive>
          <IGRPAlertDialogHeaderPrimitive>
            <IGRPAlertDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              {isActive ? "Desativar" : "Ativar"} Utilizador
            </IGRPAlertDialogTitlePrimitive>
            <IGRPAlertDialogDescriptionPrimitive>
              Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
              utilizador <strong className="text-foreground">{user.name}</strong>
              ?
            </IGRPAlertDialogDescriptionPrimitive>
          </IGRPAlertDialogHeaderPrimitive>
          <IGRPAlertDialogFooterPrimitive>
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
                <>
                  <IGRPIcon
                    iconName="LoaderCircle"
                    className="w-4 h-4 animate-spin"
                    strokeWidth={2}
                  />
                  Processando...
                </>
              ) : (
                <>
                  <IGRPIcon
                    iconName={isActive ? "Ban" : "Check"}
                    className="w-4 h-4"
                    strokeWidth={2}
                  />
                  {isActive ? "Desativar" : "Ativar"}
                </>
              )}
            </IGRPButton>
          </IGRPAlertDialogFooterPrimitive>
        </IGRPAlertDialogContentPrimitive>
      </IGRPAlertDialogPrimitive>
    </div>
  );
}