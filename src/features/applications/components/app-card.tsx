"use client";

import type { IGRPApplicationArgs } from "@igrp/framework-next-types";
import {
  IGRPBadgePrimitive,
  IGRPCardContentPrimitive,
  IGRPCardDescriptionPrimitive,
  IGRPCardFooterPrimitive,
  IGRPCardHeaderPrimitive,
  IGRPCardPrimitive,
  IGRPCardTitlePrimitive,
  IGRPIcon,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPButtonPrimitive,
  IGRPTooltipPrimitive,
  IGRPTooltipContentPrimitive,
  IGRPTooltipProviderPrimitive,
  IGRPTooltipTriggerPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import { useState } from "react";

import { ButtonLinkTooltip } from "@/components/button-link-tooltip";
import { formatSlug } from "@/features/applications/app-utils";
import { ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { ApplicationArgs } from "../app-schemas";
import { ApplicationEditForm } from "./app-edit-form";

export function ApplicationCard({ app }: { app: IGRPApplicationArgs }) {
  const { name, code, status, description, slug, url } = app;
  const href = slug ? formatSlug(slug) : url;
  const [open, setOpen] = useState(false);

  return (
    <>
      <IGRPCardPrimitive className="@container/card overflow-hidden card-hover gap-3 py-4 justify-between">
        <IGRPCardHeaderPrimitive className="px-4 pb-0">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="mr-2 rounded-md bg-primary/10 p-2">
                <IGRPIcon iconName="AppWindow" className="text-primary" />
              </div>
              <div>
                <IGRPCardTitlePrimitive className="text-base line-clamp-2">
                  {name}
                </IGRPCardTitlePrimitive>
                <IGRPCardDescriptionPrimitive className="text-xs">
                  {code}
                </IGRPCardDescriptionPrimitive>
              </div>
            </div>
          </div>
        </IGRPCardHeaderPrimitive>
        <IGRPCardContentPrimitive className="px-4">
          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {description || "Sem descrição."}
          </p>
        </IGRPCardContentPrimitive>
        <IGRPCardFooterPrimitive className="flex items-center justify-between px-4">
          <div className="flex items-center">
            <IGRPBadgePrimitive
              className={cn(getStatusColor(status), "capitalize")}
            >
              {showStatus(status)}
            </IGRPBadgePrimitive>
          </div>
          <div className="flex items-center gap-1">
            <ButtonLinkTooltip
              href={`${ROUTES.APPLICATIONS}/${code}`}
              icon="Eye"
              label="Ver"
              size="icon"
              variant="ghost"
              btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
            />

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
                <IGRPTooltipContentPrimitive>Editar</IGRPTooltipContentPrimitive>
              </IGRPTooltipPrimitive>
            </IGRPTooltipProviderPrimitive>

            <ButtonLinkTooltip
              href={href || ""}
              icon="ExternalLink"
              label="Abrir"
              size="icon"
              variant="ghost"
              btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
            />
          </div>
        </IGRPCardFooterPrimitive>
      </IGRPCardPrimitive>

      <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
        <IGRPDialogContentPrimitive className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <IGRPDialogHeaderPrimitive>
            <IGRPDialogTitlePrimitive>Editar Aplicação</IGRPDialogTitlePrimitive>
          </IGRPDialogHeaderPrimitive>
          <ApplicationEditForm application={app as ApplicationArgs} onSuccess={() => setOpen(false)} />
        </IGRPDialogContentPrimitive>
      </IGRPDialogPrimitive>
    </>
  );
}