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
  IGRPSeparatorPrimitive,
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useApplicationByCode } from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { getStatusColor } from "@/lib/utils";
import { BackButton } from "@/components/back-button";
import { ROUTES } from "@/lib/constants";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";
import { ApplicationForm } from "./app-form";

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

    // const formData = new FormData();
    // formData.append("file", file);

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
    <section className="flex flex-col gap-6">
      <IGRPCardPrimitive className="py-2 border-0 shadow-sm rounded-lg">
        <IGRPCardContentPrimitive className="px-4 py-1">
          <div className="flex items-center pb-2 justify-between">
            <BackButton label="Voltar" href={ROUTES.APPLICATIONS} />
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
                    Editar Aplicação
                  </IGRPDialogTitlePrimitive>
                </IGRPDialogHeaderPrimitive>
                <ApplicationForm
                  application={app}
                  onSuccess={() => setOpen(false)}
                />
              </IGRPDialogContentPrimitive>
            </IGRPDialogPrimitive>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <IGRPUserAvatarPrimitive className="w-28! h-28! border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {pictureUrl ? (
                    <IGRPUserAvatarImagePrimitive
                      src={pictureUrl}
                      alt={app.name}
                    />
                  ) : (
                    <IGRPUserAvatarFallbackPrimitive className="text-3xl bg-primary/10">
                      <IGRPIcon
                        iconName="AppWindow"
                        className="w-12 h-12 text-primary"
                      />
                    </IGRPUserAvatarFallbackPrimitive>
                  )}
                </IGRPUserAvatarPrimitive>

                <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                  <IGRPIcon
                    iconName={
                      uploadPicture.isPending ? "LoaderCircle" : "Camera"
                    }
                    className={cn(
                      "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
                      uploadPicture.isPending && "animate-spin",
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

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {app.name}
                  </h1>
                  <IGRPBadgePrimitive
                    className={getStatusColor(app.status || "ACTIVE")}
                  >
                    {app.status}
                  </IGRPBadgePrimitive>
                </div>

                <div className="flex items-center mb-2">
                  <span className="text-muted-foreground text-sm">
                    #{app.code}
                  </span>
                  <CopyToClipboard value={app.code} />
                </div>

                <p className="text-sm text-muted-foreground">
                  {app.description || "Sem descrição."}
                </p>
              </div>
            </div>
          </div>
        </IGRPCardContentPrimitive>
      </IGRPCardPrimitive>

      <MenuList app={app} />
    </section>
  );
}
