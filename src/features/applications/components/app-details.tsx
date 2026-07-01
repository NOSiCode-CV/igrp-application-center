"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  Avatar,
  AvatarFallback,
  Badge,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  IGRPButton,
  IGRPIcon,
  Skeleton,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

import { BackButton } from "@/components/back-button";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { InlineError } from "@/components/inline-error";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import {
  APP_DESCRIPTION_FALLBACK,
  isSystemApp,
} from "@/features/applications/app-utils";
import {
  useApplicationByCode,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import { MenuList } from "@/features/menus/components/menu-list";
import { useRegisterCurrentUserApplicationAccess } from "@/features/users/use-users";
import { getStatusColor } from "@/lib/app-utilities";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

import { ApplicationForm } from "./app-form";

export function ApplicationDetails({ code }: { code: string }) {
  const { igrpToast } = useIGRPToast();
  const { data: app, isLoading, error, refetch } = useApplicationByCode(code);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const registeredFor = useRef<string | null>(null);

  const { mutate: registerAccess } = useRegisterCurrentUserApplicationAccess();

  const { mutateAsync: updateApplication } = useUpdateApplication();

  const uploadPicture = useUploadPublicFiles();
  const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null);

  const filePath = uploadedFilePath ?? app?.picture;
  const { data: fileUrl, isLoading: isLoadingFile } = useFiles(filePath ?? "", {
    enabled: Boolean(filePath),
  });

  useEffect(() => {
    if (code && registeredFor.current !== code) {
      registeredFor.current = code;
      registerAccess(code);
    }
  }, [code, registerAccess]);

  if (isLoading) {
    return <AppCenterLoading description="A carregar aplicação..." />;
  }

  if (error)
    return <InlineError message={error.message} onRetry={() => refetch()} />;

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
        options: { folder: code },
      });

      setUploadedFilePath(result);

      await updateApplication({
        code: app.code,
        data: { picture: result },
      });

      igrpToast({
        type: "success",
        title: "Upload Sucesso",
        description: "A imagem foi carregada com sucesso",
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
      <Card className="py-2 border-0 shadow-sm rounded-lg">
        <CardContent className="px-4 py-1">
          <div className="flex items-center pb-2 justify-between">
            <BackButton label="Voltar" href={ROUTES.APPLICATIONS} />
            {app && !isSystemApp(app) && (
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <IGRPButton
                    showIcon
                    variant="outline"
                    iconName="Pencil"
                    size="sm"
                  >
                    Editar
                  </IGRPButton>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Editar Aplicação</DialogTitle>
                  </DialogHeader>

                  <ApplicationForm
                    application={app}
                    onSuccess={() => setOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div
                className="relative"
                aria-busy={uploadPicture.isPending || isLoadingFile}
              >
                <button
                  type="button"
                  className="relative group cursor-pointer disabled:cursor-not-allowed rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={
                    (app ? isSystemApp(app) : false) || uploadPicture.isPending
                  }
                  aria-label="Alterar imagem da aplicação"
                >
                  <Avatar className="size-28 border-4 border-background shadow-lg transition-transform duration-300 group-hover:scale-105">
                    {isLoadingFile && (uploadedFilePath || app?.picture) ? (
                      <Skeleton className="size-full" />
                    ) : fileUrl?.url ? (
                      <Image
                        src={fileUrl.url}
                        alt={app.name}
                        fill
                        sizes="106px"
                        quality={100}
                        className="object-contain"
                      />
                    ) : (
                      <AvatarFallback className="text-3xl bg-primary/10">
                        <IGRPIcon
                          iconName="AppWindow"
                          className="size-12 text-primary"
                        />
                      </AvatarFallback>
                    )}
                  </Avatar>

                  <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-2 shadow-md border border-border group-hover:border-primary transition-colors">
                    <IGRPIcon
                      iconName={
                        isLoadingFile || uploadPicture.isPending
                          ? "LoaderCircle"
                          : "Camera"
                      }
                      className={cn(
                        "size-4 text-muted-foreground group-hover:text-primary transition-colors",
                        (isLoadingFile || uploadPicture.isPending) &&
                          "animate-spin",
                      )}
                    />
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <span className="sr-only" aria-live="polite">
                  {uploadPicture.isPending
                    ? "A carregar imagem..."
                    : isLoadingFile
                      ? "A obter imagem..."
                      : ""}
                </span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold tracking-tight">
                    {app.name}
                  </h1>
                  <Badge className={getStatusColor(app.status || "ACTIVE")}>
                    {app.status}
                  </Badge>
                </div>

                <div className="flex items-center mb-2">
                  <span className="text-muted-foreground text-sm">
                    #{app.code}
                  </span>
                  <CopyToClipboard value={app.code} />
                </div>

                <p className="text-sm text-muted-foreground">
                  {app.description || APP_DESCRIPTION_FALLBACK}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MenuList app={app} />
    </section>
  );
}
