"use client";

import {
  IGRPButtonPrimitive,
  IGRPIcon,
  IGRPUserAvatar,
  useIGRPToast,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPButton,
  cn,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import {
  useCurrentUser,
  useRemoveUserRole,
  useUserRoles,
} from "@/features/users/use-users";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";
import { BackButton } from "@/components/back-button";
import { UserEditForm } from "./user-edit-form";

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();

  if (!user) {
    return (
      <AppCenterNotFound
        iconName="User"
        title="Nenhum utilizador encontrada."
      />
    );
  }

  const { data: userRoles } = useUserRoles(user.id);
  const { mutateAsync: removeUserRole } = useRemoveUserRole();
  const { igrpToast } = useIGRPToast();

  const [open, setOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useUploadPublicFiles();
  const [uploadedAvatarPath, setUploadedAvatarPath] = useState<string | null>(
    null
  );
  const [uploadedSignaturePath, setUploadedSignaturePath] = useState<
    string | null
  >(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const { data: avatarUrl } = useFiles(uploadedAvatarPath || "");
  const { data: signatureUrl } = useFiles(uploadedSignaturePath || "");

  useEffect(() => {
    if (avatarUrl) {
      setAvatarPreview(avatarUrl.url);
      setUploadedAvatarPath(null);
    }
  }, [avatarUrl]);

  useEffect(() => {
    if (signatureUrl) {
      setSignaturePreview(signatureUrl.url);
      setUploadedSignaturePath(null);
    }
  }, [signatureUrl]);

  if (isLoading && !user) {
    return <AppCenterLoading descrption="Carregando utilizador..." />;
  }

  if (userError) throw userError;

  const handleName = (value: string) => {
    const SENTINEL = "§§§";
    return value
      .replace(/iGRP/g, SENTINEL)
      .replace(/[_\-.]+/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
      .replace(/\s+/g, " ")
      .trim()
      .split(" ")
      .map((w) => (w.includes(SENTINEL) ? "iGRP" : w.toLowerCase()))
      .join(" ");
  };

  const handleRevokeRole = async (name: string) => {
    if (!name) return;

    try {
      await removeUserRole({ id: user.id, roleNames: [name] });
      igrpToast({
        type: "success",
        title: "Perfil removido com sucesso.",
      });
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Não foi possivel remover o perfil.",
        description:
          error instanceof Error
            ? error.message
            : "Ocorreu um erro desconhecido.",
      });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile.mutateAsync({
        file,
        options: {
          folder: `users/${user.id}/avatar`,
        },
      });

      setUploadedAvatarPath(result);
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

  const handleSignatureChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile.mutateAsync({
        file,
        options: {
          folder: `users/${user.id}/signature`,
        },
      });

      setUploadedSignaturePath(result);
      refetch();
      igrpToast({
        type: "success",
        title: "Assinatura atualizada com sucesso",
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao atualizar assinatura",
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

  const currentAvatarUrl = avatarPreview || user.picture || null;
  const currentSignatureUrl = signaturePreview || user.signature || null;

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <div className="flex items-start mt-4 justify-between">
        <div className="flex items-start gap-4">
          <div
            className="relative group cursor-pointer"
            onClick={() => avatarInputRef.current?.click()}
          >
            <IGRPUserAvatar
              alt={user.name}
              image={currentAvatarUrl}
              fallbackContent={getInitials(user.name)}
              className="size-20 bg-white/50 transition-all duration-300 group-hover:brightness-75"
              fallbackClass="text-2xl"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <IGRPIcon
                iconName={uploadFile.isPending ? "LoaderCircle" : "Camera"}
                className={cn(
                  "w-6 h-6 text-white",
                  uploadFile.isPending && "animate-spin"
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

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <BackButton href={ROUTES.USERS} />
              <h1 className="text-xl font-bold">{user.name}</h1>
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <p className="text-muted-foreground text-xs">@{user.username}</p>
            </div>

            <div className="flex flex-col gap-2">
              <dt className="font-medium text-muted-foreground text-xs">
                Assinatura
              </dt>
              <dd>
                <div
                  className="relative group cursor-pointer inline-block"
                  onClick={() => signatureInputRef.current?.click()}
                >
                  {currentSignatureUrl ? (
                    <div className="relative">
                      <img
                        src={currentSignatureUrl}
                        alt="Assinatura"
                        className="object-contain h-20 max-w-xs bg-white/80 rounded-md transition-all duration-300 group-hover:brightness-75"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <IGRPIcon
                          iconName={
                            uploadFile.isPending ? "LoaderCircle" : "Camera"
                          }
                          className={cn(
                            "w-6 h-6 text-white",
                            uploadFile.isPending && "animate-spin"
                          )}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-20 w-40 bg-muted/50 rounded-md border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors">
                      <div className="flex flex-col items-center gap-1">
                        <IGRPIcon
                          iconName="Upload"
                          className="w-6 h-6 text-muted-foreground"
                        />
                        <span className="text-xs text-muted-foreground">
                          Carregar
                        </span>
                      </div>
                    </div>
                  )}

                  <input
                    ref={signatureInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureChange}
                    className="hidden"
                    disabled={uploadFile.isPending}
                  />
                </div>
              </dd>
            </div>
          </div>
        </div>

        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
          <IGRPDialogTriggerPrimitive asChild>
            <IGRPButton showIcon variant="outline" iconName="Pencil">
              Editar
            </IGRPButton>
          </IGRPDialogTriggerPrimitive>
          <IGRPDialogContentPrimitive className="max-w-2xl">
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Editar Perfil</IGRPDialogTitlePrimitive>
            </IGRPDialogHeaderPrimitive>
            <UserEditForm user={user} onSuccess={() => setOpen(false)} />
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
      </div>

      {userRoles && userRoles.length > 0 && (
        <div>
          <h2 className="text-xl font-bold my-3">Permissões do Utilizador</h2>

          <div className="grid gap-3">
            {userRoles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-2.5">
                    <IGRPIcon
                      iconName="Shield"
                      className="text-primary size-5"
                    />
                  </div>
                  <div className="flex flex-col">
                    <p className="font-medium capitalize">
                      {handleName(role.description || role.name || "")}
                    </p>
                    {role.code && (
                      <p className="text-xs text-muted-foreground">
                        {role.code}
                      </p>
                    )}
                  </div>
                </div>
                <IGRPButtonPrimitive
                  variant="outline"
                  size="sm"
                  onClick={() => handleRevokeRole(role.code || "")}
                >
                  Revogar
                </IGRPButtonPrimitive>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
