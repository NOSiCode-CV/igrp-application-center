"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { config } from "@/lib/constants";

import { relativeTimePt } from "../lib/app-visual";
import { FavoriteToggle } from "./favorite-toggle";

type Variant = "default" | "featured";

/**
 * Application launcher tile.
 *
 * Resting state is calm: a clean card with a dim primary accent bar on the
 * left edge. On hover the bar ignites to full primary, a faint primary wash
 * sweeps in from that edge, the card lifts slightly, and the title + icon
 * react — on-brand and tactile without a permanent solid border on every card.
 *
 * - `featured` bumps the icon from 40px to 44px.
 * - `showLastAccess` renders the relative "last opened" time under the body.
 * - Apps with no resolvable destination render disabled (dashed, dimmed).
 */
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
    "relative h-full overflow-hidden rounded-lg border bg-card",
    "transition-[transform,box-shadow,border-color] duration-200 ease-out",
    "shadow-sm p-3.5 pl-4 motion-reduce:transition-none",
    isDisabled
      ? "border-dashed border-border/40 opacity-60 cursor-not-allowed shadow-none"
      : "border-border/60 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md active:translate-y-0 active:shadow-sm motion-reduce:hover:translate-y-0",
  ].join(" ");

  const wrapperClasses =
    "group block h-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

  const inner = (
    <div className={cardClasses}>
      {!isDisabled && (
        <span
          aria-hidden
          className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        />
      )}

      {!isDisabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-r from-primary/[0.07] via-transparent to-transparent"
        />
      )}

      <div className="absolute top-2.5 right-2.5 z-10">
        <FavoriteToggle app={app} size="sm" />
      </div>

      <div className="relative flex items-start gap-3 pr-7">
        <div
          className={`relative ${iconSize} rounded-md overflow-hidden flex items-center justify-center shrink-0 ring-1 ring-border/50 bg-muted/30 transition-[transform,box-shadow] duration-200 group-hover:scale-105 group-hover:ring-primary/30 group-hover:shadow-sm motion-reduce:group-hover:scale-100`}
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
                className="size-3 text-muted-foreground shrink-0 transition-[transform,color] duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0"
                aria-label="Aplicação externa"
              />
            )}
          </div>

          <p className="text-xs text-muted-foreground leading-snug line-clamp-2 mt-0.5">
            {description || "Sem descrição."}
          </p>

          {(ago || isDisabled) && (
            <p
              className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wide mt-1.5 ${
                isDisabled ? "text-muted-foreground/70" : "text-primary/70"
              }`}
            >
              {!isDisabled && <IGRPIcon iconName="Clock" className="size-3" />}
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

  const isAbsolute = /^https?:\/\//i.test(rawHref);
  if (isExternal || isAbsolute) {
    return (
      <a
        href={rawHref}
        target="_blank"
        rel="noopener noreferrer"
        className={wrapperClasses}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={rawHref as Route} className={wrapperClasses}>
      {inner}
    </Link>
  );
}
