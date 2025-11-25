"use client";

import {
  IGRPBadgePrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import Link from "next/link";
import Image from "next/image";

import { config, ROUTES } from "@/lib/constants";
import { cn, getStatusColor, showStatus } from "@/lib/utils";
import { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export function ApplicationCardHOme({ app }: { app: ApplicationDTO }) {
  const { name, status, code } = app;
  const href = `${ROUTES.APPLICATIONS}/${code}`;
  const appImage = app.picture;

  const minioUrl = config?.minioUrl;

  return (
    <Link href={href} className="group block h-full">
      <div className="relative h-full overflow-hidden rounded-sm border-2 border-border/40 bg-card p-5 hover:shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative size-14 rounded-md overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/50">
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
              <IGRPIcon iconName="AppWindow" className="size-7 text-primary" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors mb-1">
              {name}
            </h3>
            <IGRPBadgePrimitive
              className={cn(getStatusColor(status), "text-xs")}
            >
              {showStatus(status)}
            </IGRPBadgePrimitive>
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
            <span className="font-medium">{code === "APP_IGRP_CENTER" ? "Acessar" : "Abrir" }</span>
            <IGRPIcon
              iconName="ArrowRight"
              className="size-4 group-hover:translate-x-1 transition-transform"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
