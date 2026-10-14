"use client";

import type { Route } from "next";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import {
  Badge,
  cn,
  IGRPButton,
  IGRPIcon,
  Separator,
  Skeleton,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useFormatter, useNow, useTranslations } from "next-intl";

import { BackButton } from "@/components/back-button";
import { ButtonLink } from "@/components/button-link";
import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { InlineError } from "@/components/inline-error";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { formatSlug, isSystemApp } from "@/features/applications/app-utils";
import {
  useApplicationByCode,
  useUpdateApplication,
} from "@/features/applications/use-applications";
import { useFiles, useUploadPublicFiles } from "@/features/files/use-files";
import { MenuList } from "@/features/menus/components/menu-list";
import { useRegisterCurrentUserApplicationAccess } from "@/features/users/use-users";
import { getAppTileColor } from "@/features/workspace/lib/app-utils";
import { useStatusLabel } from "@/i18n/status";
import { ROUTES } from "@/lib/constants";
import { getStatusColor } from "@/lib/utilities";

import { ApplicationFormDialog } from "./application-form-dialog";

const TYPE_KEYS = {
  INTERNAL: "internal",
  EXTERNAL: "external",
  SYSTEM: "system",
} as const;

function appAddress(app: ApplicationDTO): string | null {
  if (app.slug) return formatSlug(app.slug);
  return app.url || null;
}

export function ApplicationDetails({ code }: { code: string }) {
  const t = useTranslations("applications");
  const tc = useTranslations("common.actions");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const statusLabel = useStatusLabel();
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
    return <AppCenterLoading description={t("details.loading")} />;
  }

  if (error)
    return (
      <InlineError
        title={t("details.loadErrorTitle")}
        message={error.message}
        onRetry={() => refetch()}
      />
    );

  if (!app) {
    return (
      <AppCenterNotFound iconName="AppWindow" title={t("details.notFound")} />
    );
  }

  const isSystem = isSystemApp(app);
  const isBusy = uploadPicture.isPending || isLoadingFile;
  const tile = getAppTileColor(app.code ?? "");
  const address = appAddress(app);
  const typeKey = TYPE_KEYS[app.type as keyof typeof TYPE_KEYS];
  const updatedAt = app.lastModifiedDate ?? app.createdDate;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      igrpToast({
        type: "error",
        title: t("details.uploadErrorTitle"),
        description: t("details.uploadInvalidType"),
        duration: 6000,
      });
      return;
    }

    try {
      const path = await uploadPicture.mutateAsync({
        file,
        options: { folder: code },
      });

      const saved = await updateApplication({
        code: app.code,
        data: { picture: path },
      });
      if (!saved.success) {
        throw new Error(saved.error || t("details.uploadSaveError"));
      }

      setUploadedFilePath(path);
      igrpToast({
        type: "success",
        title: t("details.uploadSuccessTitle"),
        description: t("details.uploadSuccess"),
        duration: 6000,
      });
    } catch (err) {
      console.error("[applications/:code] picture upload failed", err);
      igrpToast({
        type: "error",
        title: t("details.uploadErrorTitle"),
        description: err instanceof Error ? err.message : String(err),
        duration: 6000,
      });
    }
  };

  const facts = [
    typeKey && {
      key: "type",
      label: t("details.facts.type"),
      value: t(`details.types.${typeKey}`),
    },
    address && {
      key: "address",
      label: t("details.facts.address"),
      value: address,
    },
    app.owner && {
      key: "owner",
      label: t("details.facts.owner"),
      value: app.owner,
    },
    updatedAt && {
      key: "updated",
      label: t("details.facts.updated"),
      value: (
        <time
          dateTime={updatedAt}
          title={format.dateTime(new Date(updatedAt), {
            dateStyle: "long",
            timeStyle: "short",
          })}
        >
          {format.relativeTime(new Date(updatedAt), now)}
        </time>
      ),
    },
  ].filter(Boolean) as { key: string; label: string; value: React.ReactNode }[];

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <BackButton
            label={t("details.backToList")}
            href={ROUTES.APPLICATIONS}
            className="-ml-2 text-muted-foreground hover:text-foreground"
          />
          <div className="flex items-center gap-2">
            {address && (
              <ButtonLink
                href={address as Route}
                target={app.url && !app.slug ? "_blank" : undefined}
                rel={app.url && !app.slug ? "noreferrer" : undefined}
                icon="ExternalLink"
                label={t("details.openApp")}
                variant="ghost"
                size="sm"
              />
            )}
            {!isSystem && (
              <>
                <IGRPButton
                  showIcon
                  variant="secondary"
                  iconName="Pencil"
                  size="sm"
                  onClick={() => setOpen(true)}
                >
                  {tc("edit")}
                </IGRPButton>
                <ApplicationFormDialog
                  open={open}
                  onOpenChange={setOpen}
                  application={app}
                />
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
          <div className="relative w-fit shrink-0" aria-busy={isBusy}>
            <button
              type="button"
              className="group relative block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-default"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSystem || uploadPicture.isPending}
              aria-label={t("details.changeImage")}
            >
              <span
                className={cn(
                  "relative flex size-20 items-center justify-center overflow-hidden rounded-xl text-2xl font-bold",
                  tile.bg,
                  tile.text,
                )}
              >
                {isLoadingFile && filePath ? (
                  <Skeleton className="size-full rounded-none" />
                ) : fileUrl?.url ? (
                  <Image
                    src={fileUrl.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="bg-background object-contain"
                  />
                ) : (
                  (app.name ?? app.code ?? "").charAt(0).toUpperCase()
                )}
              </span>

              {!isSystem && (
                <span className="absolute -right-1.5 -bottom-1.5 flex size-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors group-hover:border-primary group-hover:text-primary">
                  <IGRPIcon
                    iconName={isBusy ? "LoaderCircle" : "Camera"}
                    className={cn("size-3.5", isBusy && "animate-spin")}
                  />
                </span>
              )}
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <span className="sr-only" aria-live="polite">
              {uploadPicture.isPending
                ? t("details.uploadingImage")
                : isLoadingFile
                  ? t("details.loadingImage")
                  : ""}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h1 className="text-2xl font-semibold tracking-tight text-balance">
                {app.name}
              </h1>
              <Badge className={getStatusColor(app.status || "ACTIVE")}>
                {statusLabel(app.status || "ACTIVE")}
              </Badge>
            </div>

            <div className="flex items-center text-sm text-muted-foreground">
              <span className="truncate">{app.code}</span>
              <CopyToClipboard value={app.code} />
            </div>

            <p
              className={cn(
                "max-w-prose text-sm text-pretty",
                app.description
                  ? "text-foreground/80"
                  : "italic text-muted-foreground",
              )}
            >
              {app.description ||
                (isSystem
                  ? t("card.noDescription")
                  : t("details.noDescription"))}
            </p>
          </div>
        </div>

        {facts.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:flex sm:flex-wrap sm:gap-x-10">
            {facts.map((fact) => (
              <div key={fact.key} className="flex min-w-0 flex-col gap-0.5">
                <dt className="text-xs text-muted-foreground">{fact.label}</dt>
                <dd className="truncate text-sm font-medium">{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </header>

      <Separator />

      <MenuList app={app} />
    </section>
  );
}
