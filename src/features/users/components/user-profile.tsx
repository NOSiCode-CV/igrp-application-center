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
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
  IGRPSeparatorPrimitive,
  cn,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useCurrentUser, useRemoveUserRole } from "@/features/users/use-users";
import { ROUTES } from "@/lib/constants";
import { getInitials } from "@/lib/utils";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";
import { BackButton } from "@/components/back-button";
import { UserEditForm } from "./user-edit-form";
import UserRoleList from "./user-role-list";

export function UserProfile() {
  const { data: user, isLoading, error: userError, refetch } = useCurrentUser();

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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadFile.mutateAsync({
        file: formData,
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

    const formData = new FormData();
    formData.append("file", file);

    try {
      const result = await uploadFile.mutateAsync({
        file: formData,
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
      console.log("err - ", JSON.stringify(err));
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
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 rounded-xl -z-10" />

        <IGRPCardPrimitive className="py-2 border-0 shadow-sm">
          <IGRPCardContentPrimitive className="px-4 py-1">
            <div className="flex items-center mb-2 justify-between ">
              <BackButton label="Voltar" href={ROUTES.USERS} />
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
                  <UserEditForm user={user} onSuccess={() => setOpen(false)} />
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
                  fallbackContent={getInitials(user.name)}
                  className="relative size-28 bg-background border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105"
                  fallbackClass="text-3xl"
                />

                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                  <IGRPIcon
                    iconName={uploadFile.isPending ? "LoaderCircle" : "Camera"}
                    className={cn(
                      "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
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

      <IGRPCardPrimitive>
        <IGRPCardContentPrimitive className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <IGRPIcon
                      iconName="PenTool"
                      className="w-4 h-4 text-primary"
                    />
                  </div>
                  Assinatura Digital
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Carregue sua assinatura para documentos oficiais
                </p>
              </div>
            </div>

            <div
              className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-all bg-muted/20 hover:bg-muted/30"
              onClick={() => signatureInputRef.current?.click()}
            >
              {currentSignatureUrl ? (
                <div className="relative p-6 min-h-[100px] flex items-center justify-center">
                  <img
                    src={currentSignatureUrl}
                    alt="Assinatura"
                    className="max-h-20 max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-full p-3 shadow-lg">
                      <IGRPIcon
                        iconName={
                          uploadFile.isPending ? "LoaderCircle" : "Upload"
                        }
                        className={cn(
                          "w-5 h-5 text-primary",
                          uploadFile.isPending && "animate-spin"
                        )}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IGRPIcon
                      iconName="Upload"
                      className="w-6 h-6 text-primary"
                    />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">Clique para carregar</p>
                    <p className="text-xs text-muted-foreground">
                      PNG, JPG até 5MB
                    </p>
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
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <UserRoleList user={user} handleName={handleName} />
    </div>
  );
}
