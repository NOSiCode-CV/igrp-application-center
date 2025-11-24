"use client";

import {
  IGRPBadgePrimitive,
  IGRPIcon,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPButtonPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { ButtonLinkTooltip } from "@/components/button-link-tooltip";
import { formatSlug } from "@/features/applications/app-utils";
import { config, ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { ApplicationForm } from "./app-form";
import {
  ApplicationDTO,
  ApplicationType,
} from "@igrp/platform-access-management-client-ts";

export function ApplicationCard({ app }: { app: ApplicationDTO }) {
  const { name, code, status, description, slug, url, type } = app;
  const href = slug ? formatSlug(slug) : url;
  const [open, setOpen] = useState(false);

  const appImage = app.picture;

  return (
    <>
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
                  quality={100}
                  sizes="56px"
                  priority
                />
              ) : (
                <IGRPIcon
                  iconName="AppWindow"
                  className="size-6 text-primary"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base line-clamp-1">{name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{code}</p>
            </div>
          </div>

          <IGRPBadgePrimitive
            className={cn(getStatusColor(status), "shrink-0")}
          >
            {showStatus(status)}
          </IGRPBadgePrimitive>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
          {description || "Sem descrição."}
        </p>

        <div className="flex items-center justify-end gap-1 pt-4 border-t">
          <ButtonLinkTooltip
            href={`${ROUTES.APPLICATIONS}/${code}`}
            icon="Eye"
            label="Ver"
            size="icon"
            variant="ghost"
            btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
          />

          {type !== ("SYSTEM" as ApplicationType) && (
            <IGRPTooltipProviderPrimitive>
              <IGRPTooltipPrimitive>
                <IGRPTooltipTriggerPrimitive asChild>
                  <IGRPButtonPrimitive
                    size="icon"
                    variant="ghost"
                    onClick={() => setOpen(true)}
                    className="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
                  >
                    <IGRPIcon iconName="SquarePen" />
                  </IGRPButtonPrimitive>
                </IGRPTooltipTriggerPrimitive>
                <IGRPTooltipContentPrimitive>
                  Editar
                </IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </IGRPTooltipProviderPrimitive>
          )}

          <ButtonLinkTooltip
            href={href || ""}
            icon="ExternalLink"
            label="Abrir"
            size="icon"
            variant="ghost"
            btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
          />
        </div>
      </div>

      <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
        <IGRPDialogContentPrimitive className="sm:min-w-2xl max-h-[90vh]">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive>
              Editar Aplicação
            </IGRPDialogTitlePrimitive>
          </IGRPDialogHeaderPrimitive>
          <ApplicationForm application={app} onSuccess={() => setOpen(false)} />
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>
    </>
  );
}
