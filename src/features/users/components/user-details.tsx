"use client";

import {
  IGRPIcon,
  IGRPUserAvatar,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPButton,
  IGRPAlertDialogPrimitive,
  IGRPAlertDialogContentPrimitive,
  IGRPAlertDialogHeaderPrimitive,
  IGRPAlertDialogTitlePrimitive,
  IGRPAlertDialogDescriptionPrimitive,
  IGRPAlertDialogFooterPrimitive,
  useIGRPToast,
  cn,
  IGRPTabItem,
  IGRPTabs,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useUser, useUpdateUser } from "@/features/users/use-users";
import { getInitials } from "@/lib/utils";
import { useFiles } from "@/features/files/use-files";
import UserSignature from "./user-signature";
import UserRoleList from "./user-role-list";
import UserApplications from "./user-applications";
import { DepartmentListSimple } from "@/features/departments/components/dept-list-simple-container";
import { useQueryClient } from "@tanstack/react-query";
import { Status } from "@igrp/platform-access-management-client-ts";

export function UserDetails({ id }: { id: string }) {
  const {
    data: user,
    isLoading,
    error: userError,
    refetch,
  } = useUser(Number(id));
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: avatarUrl, isLoading: isLoadingFile } = useFiles(
    user?.picture || "",
  );

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
        queryKey: ["user", Number(id)],
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

  const currentAvatarUrl = avatarUrl?.url || null;

  const tabs: IGRPTabItem[] = [
    {
      label: "Departamentos",
      value: "departments",
      content: <DepartmentListSimple user={user} />,
    },
    {
      label: "Aplicações",
      value: "applications",
      content: <UserApplications user={user} />,
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
        queryKey: ["user"],
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

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-xl -z-10" />

        <IGRPCardPrimitive className="py-2 border-0 shadow-sm">
          <IGRPCardContentPrimitive className="px-4 py-1">
            <div className="flex items-center mb-2 justify-end">
              <IGRPButton
                showIcon
                variant={isActive ? "destructive" : "default"}
                iconName={isActive ? "Ban" : "Check"}
                size="sm"
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
                  alt={user?.name}
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
                      getInitials(user?.name || user?.email || "")
                    )
                  }
                  className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
                  fallbackClass="text-3xl"
                />

                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                  <IGRPIcon
                    iconName={isLoadingFile ? "LoaderCircle" : "Camera"}
                    className={cn(
                      "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
                    )}
                  />
                </div>
              </div>

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
                      {user.name || "N/A"}
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
        defaultValue="roles"
        items={tabs}
        className="min-w-0"
        tabContentClassName="px-0"
      />

      <IGRPAlertDialogPrimitive
        open={showStatusDialog}
        onOpenChange={setShowStatusDialog}
      >
        <IGRPAlertDialogContentPrimitive>
          <IGRPAlertDialogHeaderPrimitive>
            <IGRPAlertDialogTitlePrimitive className="flex items-center gap-2">
              <IGRPIcon
                iconName="TriangleAlert"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              {isActive ? "Desativar" : "Ativar"} Utilizador
            </IGRPAlertDialogTitlePrimitive>
            <IGRPAlertDialogDescriptionPrimitive>
              Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
              utilizador{" "}
              <strong className="text-foreground">{user.name}</strong>?
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
                isActive ? "bg-destructive hover:bg-destructive/90" : "",
                "gap-2",
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
