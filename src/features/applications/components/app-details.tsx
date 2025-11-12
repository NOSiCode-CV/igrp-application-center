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
} from "@igrp/igrp-framework-react-design-system";
import { useState, useRef } from "react";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useApplicationByCode } from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { getStatusColor } from "@/lib/utils";
import { ApplicationEditForm } from "./app-edit-form";
import { ScrollArea } from "@igrp/igrp-framework-react-design-system/dist/components/primitives/scroll-area";
import { BackButton } from "@/components/back-button";
import { ROUTES } from "@/lib/constants";

export function ApplicationDetails({ code }: { code: string }) {
  const { data: app, isLoading, error, refetch } = useApplicationByCode(code);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook de upload
  const uploadPicture = {} //useUploadPicture(code);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

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

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);

    // try {
    //   await uploadPicture.mutateAsync(file);
    //   refetch(); // Atualiza a app com nova pictureUrl
    //   setPreviewUrl(null); // Remove preview após sucesso
    // } catch (err) {
    //   console.error("Erro ao fazer upload:", err);
    //   setPreviewUrl(null);
    // }
  };

  //const pictureUrl = previewUrl || app.pictureUrl || null;

  return (
    <section>
      
      <div className="flex items-start mt-4 justify-between mb-6">
        <div className="flex items-start gap-4">
          
          {/* <div className="relative group">
            <IGRPButton
              variant="ghost"
              size="icon"
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity z-10"
              // onClick={() => fileInputRef.current?.click()}
              // disabled={uploadPicture.isPending}
            >
              <IGRPIcon
                iconName={uploadPicture.isPending ? "LoaderCircle" : "Camera"}
                className={cn("w-5 h-5", uploadPicture.isPending && "animate-spin")}
              />
            </IGRPButton>

            <IGRPUserAvatarPrimitive className="w-20! h-20!">
              {pictureUrl ? (
                <IGRPUserAvatarImagePrimitive src={pictureUrl} alt={app.name} />
              ) : (
                <IGRPUserAvatarFallbackPrimitive className="text-2xl bg-primary/10">
                  <IGRPIcon iconName="AppWindow" className="w-10 h-10 text-primary" />
                </IGRPUserAvatarFallbackPrimitive>
              )}
            </IGRPUserAvatarPrimitive>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div> */}

          <div>
            <div className="flex items-center gap-3">
              <BackButton href={ROUTES.APPLICATIONS} />
              <h1 className="text-2xl font-bold">{app.name}</h1>
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

        {/* Botão Editar */}
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