"use client";

import {
  Badge,
  Button,
  IGRPIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import type { Route } from "next";
import Image from "next/image";
import { ButtonLinkTooltip } from "@/components/button-link-tooltip";
import { formatSlug, isSystemApp } from "@/features/applications/app-utils";
import { config, ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";

interface ApplicationCardProps {
  app: ApplicationDTO;
  onEdit?: (app: ApplicationDTO) => void;
}

export function ApplicationCard({ app, onEdit }: ApplicationCardProps) {
  const { name, code, status, description, slug, url } = app;
  const href = slug ? formatSlug(slug) : url;
  const isSystem = isSystemApp(app);
  const appImage = app.picture;

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative size-12 rounded-md overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
            {appImage ? (
              <Image
                src={config.minioUrl + appImage}
                alt={name}
                fill
                className="object-cover"
                sizes="48px"
              />
            ) : (
              <IGRPIcon iconName="AppWindow" className="size-6 text-primary" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{code}</p>
          </div>
        </div>

        <Badge className={cn(getStatusColor(status), "shrink-0")}>
          {showStatus(status)}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground line-clamp-2 min-h-10">
        {description || "Sem descrição."}
      </p>

      <div className="flex items-center justify-end gap-1 pt-4 border-t">
        <ButtonLinkTooltip
          href={`${ROUTES.APPLICATIONS}/${code}` as Route}
          icon="Eye"
          label="Ver"
          size="icon"
          variant="ghost"
          btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
        />

        {!isSystem && onEdit && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => onEdit(app)}
                className="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
                aria-label={`Editar ${name}`}
              >
                <IGRPIcon iconName="SquarePen" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar</TooltipContent>
          </Tooltip>
        )}

        <ButtonLinkTooltip
          href={(href || "") as Route}
          icon="ExternalLink"
          label="Abrir"
          size="icon"
          variant="ghost"
          btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
        />
      </div>
    </div>
  );
}
