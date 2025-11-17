"use client";

import type { IGRPApplicationArgs } from "@igrp/framework-next-types";
import {
  IGRPBadgePrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import Image from "next/image";

import { ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { ButtonLinkTooltip } from "@/components/button-link-tooltip";

export function ApplicationCardHOme({ app }: { app: IGRPApplicationArgs }) {
  const { name, status, description, code } = app;
  const href = `${ROUTES.APPLICATIONS}/${code}`;
  const appImage = app.picture;

  return (
    <Link href={href} className="group block">
      <div className="relative overflow-hidden rounded-lg border bg-card p-6 transition-all duration-300 hover:shadow-lg">
        
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative size-12 rounded-lg overflow-hidden bg-primary/10 flex items-center justify-center shrink-0">
              {appImage ? (
                <Image
                  src={appImage}
                  alt={name}
                  fill
                  className="object-cover"
                />
              ) : (
                <IGRPIcon iconName="AppWindow" className="size-6 text-primary" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-base line-clamp-1 group-hover:text-primary transition-colors">
                {name}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Aplicação</p>
            </div>
          </div>
          
          <IGRPBadgePrimitive
            className={cn(getStatusColor(status), "shrink-0")}
          >
            {showStatus(status)}
          </IGRPBadgePrimitive>
        </div>

        <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[2.5rem]">
          {description || "Sem descrição disponível."}
        </p>

        <div className="flex items-center justify-end pt-4 border-t">
          {/* <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">
            Ver detalhes
          </span> */}
          <ButtonLinkTooltip
                      href={href || ""}
                      icon="ExternalLink"
                      label="Acessar"
                      size="icon"
                      variant="ghost"
                      btnClassName="hover:bg-primary/90 hover:text-primary-foreground/90 dark:hover:text-accent-foreground dark:hover:bg-accent/50"
                    />
        </div>
      </div>
    </Link>
  );
}