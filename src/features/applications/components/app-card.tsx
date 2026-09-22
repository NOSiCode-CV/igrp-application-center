"use client";

import type { Route } from "next";
import Image from "next/image";

import {
  Badge,
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
/* The same helper the launcher uses, so an application carries ONE colour and
   one initial across the product: an admin recognises here the tile they saw
   on the home page instead of re-learning a generic icon. */
import { getAppTileColor } from "@/features/workspace/lib/app-utils";
import { getStatusColor, showStatus } from "@/lib/app-utilities";
import { config, ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface ApplicationCardProps {
  app: ApplicationDTO;
  onEdit?: (app: ApplicationDTO) => void;
}

/**
 * A quiet tint, not a solid `bg-primary` fill. A ghost icon button that turns
 * into a full primary swatch on hover is louder than the card it sits in, and
 * three of them in a row read as a toolbar of default buttons. This pair is
 * token-backed (>= 4.5:1 in both themes) rather than `bg-primary/90` over
 * `text-primary-foreground/90`, whose ratio nobody has measured.
 */
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
    /**
     * The launcher's card shell, with one deliberate difference: the card
     * itself is not a link and carries no hover state. Every way into an
     * application is an explicit, labelled control in the footer — a card that
     * lit up on hover would be promising a click it does not accept.
     */
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
            /* `alt=""`: the name sits right beside it, so announcing the image
               too would read the application's name twice. */
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
          {/* The code is how the application is referred to in a support call,
              so it belongs next to the name and not only in the detail page. */}
          <span className="truncate text-xs text-muted-foreground">{code}</span>
        </div>
      </div>

      {/* Always rendered, so cards keep one height in a row — an absent
          description says so instead of silently collapsing the card. */}
      <p
        className={cn(
          "text-xs text-muted-foreground line-clamp-2 leading-relaxed text-pretty",
          !description && "italic",
        )}
      >
        {description || APP_DESCRIPTION_FALLBACK}
      </p>

      {/* `mt-auto` pins the footer to the bottom so the action row lines up
          across a row of cards whose descriptions run to different lengths. */}
      <div className="mt-auto flex items-center justify-between gap-2 pt-1">
        <Badge className={cn(getStatusColor(status), "shrink-0")}>
          {showStatus(status)}
        </Badge>

        {/* Each label names its target: a grid of twelve cards used to expose
            twelve links all called "Ver" and twelve called "Abrir". */}
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
