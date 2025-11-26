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
  cn,
  IGRPTabItem,
  IGRPTabs,
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

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();
  const { mutateAsync: updateUser } = useUpdateUser();
  const { igrpToast } = useIGRPToast();
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
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
            <div className="flex items-center mb-2 justify-end ">
              {/* <BackButton label="Voltar" href={ROUTES.USERS} /> */}

              <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
                <IGRPDialogTriggerPrimitive asChild>
                  <IGRPButton
                    showIcon
                    variant="outline"
                    iconName="Pencil"
                    size="sm"
                  >
                    Editar
                  </IGRPButton>
                </IGRPDialogTriggerPrimitive>
                <IGRPDialogContentPrimitive className="max-w-2xl">
                  <IGRPDialogHeaderPrimitive>
                    <IGRPDialogTitlePrimitive>
                      Editar Perfil
                    </IGRPDialogTitlePrimitive>
                  </IGRPDialogHeaderPrimitive>
                  <UserEditForm
                    user={user}
                    onSuccess={async () => {
                      await queryClient.invalidateQueries({
                        queryKey: ["current-user"],
                      });
                      setOpen(false);
                    }}
                  />
                </IGRPDialogContentPrimitive>
              </IGRPDialogPrimitive>
            </div>
            <div className="flex items-center gap-6">
              <div
                className="relative group cursor-pointer"
                onClick={() => avatarInputRef.current?.click()}
              >
                <div className="absolute -inset-1  rounded-full blur opacity-75 group-hover:opacity-100 transition" />

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
                <h1 className="text-2xl font-bold tracking-tight mb-1">
                  {user.name}
                </h1>
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
    </div>
  );
}
