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
  IGRPCardPrimitive,
  IGRPCardContentPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef, useEffect } from "react";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import {
  useApplicationByCode,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { getStatusColor } from "@/lib/utils";
import { BackButton } from "@/components/back-button";
import { config, ROUTES } from "@/lib/constants";
import { useUploadPublicFiles, useFiles } from "@/features/files/use-files";
import { ApplicationForm } from "./app-form";
import Image from "next/image";
import { useRegisterCurrentUserApplicationAccess } from "@/features/users/use-users";

export function ApplicationDetails({ code }: { code: string }) {
  const { igrpToast } = useIGRPToast();
  const { data: app, isLoading, error, refetch } = useApplicationByCode(code);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: registerAccess } = useRegisterCurrentUserApplicationAccess();

  const { mutateAsync: updateApplication } = useUpdateApplication();

  const uploadPicture = useUploadPublicFiles();
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: fileUrl, isLoading: isLoadingFile } = useFiles(
    app?.picture || uploadedFilePath || "",
  );

  useEffect(() => {
    if (code) {
      registerAccess(code);
    }
  }, [code, registerAccess]);

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

      await updateApplication({
        code: app.code,
        data: {
          ...app,
          picture: result,
        },
      });

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

  return (
    <section className="flex flex-col gap-6">
      <IGRPCardPrimitive className="py-2 border-0 shadow-sm rounded-lg">
        <IGRPCardContentPrimitive className="px-4 py-1">
          <div className="flex items-center pb-2 justify-between">
            <BackButton label="Voltar" href={ROUTES.APPLICATIONS} />
            {String(app?.type) !== "SYSTEM" && (
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
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="relative group cursor-pointer"
                onClick={() => {
                  {
                    String(app?.type) !== "SYSTEM"
                      ? fileInputRef.current?.click()
                      : null;
                  }
                }}
              >
                <IGRPUserAvatarPrimitive className="w-28! h-28! border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                  {app?.picture ? (
                    <Image
                      src={config.minioUrl + app?.picture}
                      alt={app.name}
                      fill
                      sizes="106px"
                      quality={100}
                      className="object-contain"
                    />
                  ) : isLoadingFile ? (
                    <div className="flex items-center justify-center w-full h-full bg-muted/50 animate-pulse">
                      <IGRPIcon
                        iconName="LoaderCircle"
                        className="w-8 h-8 text-muted-foreground animate-spin"
                      />
                    </div>
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
                      isLoadingFile || uploadPicture.isPending
                        ? "LoaderCircle"
                        : "Camera"
                    }
                    className={cn(
                      "w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors",
                      isLoadingFile ||
                        (uploadPicture.isPending && "animate-spin"),
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
