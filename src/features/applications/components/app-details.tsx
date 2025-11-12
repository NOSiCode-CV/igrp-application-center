"use client";

import {
  IGRPBadgePrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPButton,
  IGRPIcon,
  cn,
  IGRPUserAvatarPrimitive,
  IGRPUserAvatarImagePrimitive,
  IGRPUserAvatarFallbackPrimitive,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useApplicationByCode } from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { getStatusColor } from "@/lib/utils";
import { ApplicationEditForm } from "./app-edit-form";
import { BackButton } from "@/components/back-button";
import { ROUTES } from "@/lib/constants";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";

export function ApplicationDetails({ code }: { code: string }) {
  const { igrpToast } = useIGRPToast();
  const { data: app, isLoading, error, refetch } = useApplicationByCode(code);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadPicture = useUploadPublicFiles();
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: fileUrl } = useFiles(uploadedFilePath || "");

  useEffect(() => {
    if (fileUrl) {
      setPreviewUrl(fileUrl.url);
      setUploadedFilePath(null);
    }
  }, [fileUrl]);

  if (isLoading) {
    return <AppCenterLoading descrption="A carregar aplicação..." />;
  }

  if (error) throw error;

  if (!app) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      />
    );
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadPicture.mutateAsync({
        file,
        options: {
          folder: code,
        },
      });

      setUploadedFilePath(result);
      refetch();
      igrpToast({
        type: "success",
        title: "Upload Sucesso",
        description: `A imagem foi carregada com sucesso`,
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro no upload.",
        description: (err as Error).message,
        duration: 4000,
      });
      console.error("Erro ao fazer upload:", err);
    }
  };

  const pictureUrl = previewUrl || app.picture || null;

  return (
    <section>
      <div className="flex items-start mt-4 justify-between mb-6">
        <div className="flex items-start gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <IGRPUserAvatarPrimitive className="w-20! h-20! transition-all duration-300 group-hover:brightness-75">
              {pictureUrl ? (
                <IGRPUserAvatarImagePrimitive src={pictureUrl} alt={app.name} />
              ) : (
                <IGRPUserAvatarFallbackPrimitive className="text-2xl bg-primary/10">
                  <IGRPIcon iconName="AppWindow" className="w-10 h-10 text-primary" />
                </IGRPUserAvatarFallbackPrimitive>
              )}
            </IGRPUserAvatarPrimitive>

            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <IGRPIcon
                iconName={uploadPicture.isPending ? "LoaderCircle" : "Camera"}
                className={cn(
                  "w-6 h-6 text-white",
                  uploadPicture.isPending && "animate-spin"
                )}
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              disabled={uploadPicture.isPending}
            />
          </div>

          <div>
            <div className="flex items-center gap-3">
              <BackButton href={ROUTES.APPLICATIONS} />
              <h1 className="text-xl font-bold">{app.name}</h1>
              <IGRPBadgePrimitive className={getStatusColor(app.status || "ACTIVE")}>
                {app.status}
              </IGRPBadgePrimitive>
            </div>

            <div className="flex items-center">
              <span className="text-muted-foreground text-xs">#{app.code}</span>
              <CopyToClipboard value={app.code} />
            </div>

            <p className="text-muted-foreground text-sm">
              {app.description || "Sem descrição."}
            </p>
          </div>
        </div>

        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
          <IGRPDialogTriggerPrimitive asChild>
            <IGRPButton showIcon variant="outline" iconName="Pencil">
              Editar
            </IGRPButton>
          </IGRPDialogTriggerPrimitive>
          <IGRPDialogContentPrimitive className="max-w-3xl max-h-[90vh]">
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Editar Aplicação</IGRPDialogTitlePrimitive>
            </IGRPDialogHeaderPrimitive>
            <ApplicationEditForm application={app} onSuccess={() => setOpen(false)} />
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
      </div>

      <MenuList app={app} />
    </section>
  );
}