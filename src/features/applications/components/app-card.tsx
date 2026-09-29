"use client";

import type { Route } from "next";
import Image from "next/image";

import {
  Badge,
  cn,
  IGRPButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { ButtonLinkTooltip } from "@/components/button-link-tooltip";
import {
  APP_DESCRIPTION_FALLBACK,
  formatSlug,
  isSystemApp,
} from "@/features/applications/app-utils";
import { getAppTileColor } from "@/features/workspace/lib/app-utils";
import { config, ROUTES } from "@/lib/constants";
import { getStatusColor, showStatus } from "@/lib/utilities";

interface ApplicationCardProps {
  app: ApplicationDTO;
  onEdit?: (app: ApplicationDTO) => void;
}

const ACTION_BUTTON_HOVER =
  "hover:bg-primary-subtle hover:text-primary-subtle-foreground";

export function ApplicationCard({ app, onEdit }: ApplicationCardProps) {
  const { name, code, status, description, slug, url } = app;
  const href = slug ? formatSlug(slug) : url;
  const isSystem = isSystemApp(app);
  const color = getAppTileColor(code ?? "");
  const initial = (name ?? code ?? "").charAt(0).toUpperCase();
  const appImage = app.picture;
  const imageSrc = appImage
    ? appImage.startsWith("http")
      ? appImage
      : new URL(appImage, config.minioUrl).toString()
    : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 min-w-0">
      <div className="flex gap-3 min-w-0">
        <div
          className={cn(
            "relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-lg font-bold text-sm",
            color.bg,
            color.text,
          )}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          ) : (
            initial
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {name}
          </h2>
          <span className="truncate text-xs text-muted-foreground">{code}</span>
        </div>
      </div>

      <p
        className={cn(
          "text-xs text-muted-foreground line-clamp-2 leading-relaxed text-pretty",
          !description && "italic",
        )}
      >
        {description || APP_DESCRIPTION_FALLBACK}
      </p>

      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Badge className={cn(getStatusColor(status), "shrink-0")}>
          {showStatus(status)}
        </Badge>

        <div className="flex items-center gap-1">
          <ButtonLinkTooltip
            href={`${ROUTES.APPLICATIONS}/${code}` as Route}
            icon="Eye"
            label={`Ver ${name}`}
            size="icon"
            variant="ghost"
            btnClassName={ACTION_BUTTON_HOVER}
          />

          {!isSystem && onEdit && (
            <Tooltip>
              <TooltipTrigger asChild>
                <IGRPButton
                  size="icon"
                  variant="ghost"
                  showIcon
                  iconName="SquarePen"
                  onClick={() => onEdit(app)}
                  className={ACTION_BUTTON_HOVER}
                  aria-label={`Editar ${name}`}
                />
              </TooltipTrigger>
              <TooltipContent>Editar</TooltipContent>
            </Tooltip>
          )}

          {href && (
            <ButtonLinkTooltip
              href={href as Route}
              icon="ExternalLink"
              label={`Abrir ${name}`}
              size="icon"
              variant="ghost"
              btnClassName={ACTION_BUTTON_HOVER}
            />
          )}
        </div>
      </div>
    </div>
  );
}
