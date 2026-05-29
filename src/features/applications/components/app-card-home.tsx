"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { config } from "@/lib/constants";
import { relativeTimePt } from "../lib/app-visual";
import { FavoriteToggle } from "./favorite-toggle";

type Variant = "default" | "featured";

export function ApplicationCardHome({
  app,
  variant = "default",
  showLastAccess = false,
}: {
  app: ApplicationDTO;
  variant?: Variant;
  showLastAccess?: boolean;
}) {
  const { name, description, code, picture, type, lastAccess } = app;
  const imageSrc = picture
    ? picture.startsWith("http")
      ? picture
      : new URL(picture, config.minioUrl).toString()
    : null;
  const rawHref =
    code === "APP_IGRP_CENTER" ? "/applications" : (app.url ?? app?.slug ?? "");
  const isDisabled = !rawHref;
  const isExternal = type === "EXTERNAL";
  const isFeatured = variant === "featured";

  const iconSize = isFeatured ? "size-11" : "size-10";
  const ago = showLastAccess ? relativeTimePt(lastAccess) : "";

  const cardClasses = [
    "relative h-full overflow-hidden rounded-lg border bg-card transition-all duration-200",
    "p-3.5",
    isDisabled
      ? "border-dashed border-border/40 opacity-60 cursor-not-allowed"
      : "border-border/60 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm",
  ].join(" ");

  const inner = (
    <div className={cardClasses}>
      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteToggle app={app} size="sm" />
      </div>
      <div className="flex items-start gap-3 pr-7">
        <div
          className={`relative ${iconSize} rounded-md overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/50 bg-muted/30 transition-transform duration-200 group-hover:scale-105`}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <IGRPIcon iconName="AppWindow" className="size-5 text-primary" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="text-sm font-semibold line-clamp-1 group-hover:text-primary transition-colors min-w-0">
              {name}
            </h3>
            {isExternal && !isDisabled && (
              <IGRPIcon
                iconName="ArrowUpRight"
                className="size-3 text-muted-foreground shrink-0"
                aria-label="Aplicação externa"
              />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">
            {description}
          </p>
          {(ago || isDisabled) && (
            <p
              className={`text-[10px] uppercase tracking-wide mt-1.5 ${
                isDisabled ? "text-muted-foreground/70" : "text-primary/70"
              }`}
            >
              {isDisabled ? "Indisponível" : ago}
            </p>
          )}
        </div>
      </div>
    </div>
  );

  if (isDisabled) {
    return (
      <div
        className="group block h-full"
        aria-disabled="true"
        title="Aplicação sem destino configurado"
      >
        {inner}
      </div>
    );
  }

  // External apps (absolute URLs or EXTERNAL type) open in a new tab via a
  // plain <a>. next/link does not reliably handle absolute URLs in Next 15
  // typed-routes mode and would silently no-op the click.
  const isAbsolute = /^https?:\/\//i.test(rawHref);
  if (isExternal || isAbsolute) {
    return (
      <a
        href={rawHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group block h-full"
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={rawHref as Route} className="group block h-full">
      {inner}
    </Link>
  );
}
