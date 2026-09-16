"use client";

import type { Route } from "next";
import Link from "next/link";

import { Badge } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { Info, Star } from "lucide-react";

import {
  getAppHref,
  getAppTileColor,
  isExternalAppHref,
  isRecentlyAdded,
} from "@/features/workspace/lib/app-utils";
import { getStatusColor, showStatus } from "@/lib/app-utilities";

type Props = {
  app: ApplicationDTO;
  isFavorite: boolean;
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void;
  lastOpenedLabel?: string;
  description?: string;
  compact?: boolean;
};

export function AppTileCard({
  app,
  isFavorite,
  onToggleFavorite,
  lastOpenedLabel,
  description,
  compact = false,
}: Props) {
  const color = getAppTileColor(app.code);
  const initial = (app.name ?? app.code).charAt(0).toUpperCase();
  const href = getAppHref(app);
  const isExternal = href ? isExternalAppHref(app, href) : false;

  const star = (
    <button
      type="button"
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={isFavorite}
      className="relative z-10 shrink-0 text-muted-foreground/50 hover:text-warning focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors after:absolute after:-inset-3.5 after:content-['']"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(app, isFavorite);
      }}
    >
      <Star
        size={16}
        className={isFavorite ? "fill-warning text-warning" : ""}
      />
    </button>
  );

  const statusBadge =
    app.status !== "ACTIVE" ? (
      <Badge className={getStatusColor(app.status)}>
        {showStatus(app.status)}
      </Badge>
    ) : isRecentlyAdded(app.createdDate) ? (
      <Badge className="bg-success-subtle text-success-subtle-foreground">
        New
      </Badge>
    ) : null;

  const nameClass = `font-semibold text-sm text-foreground truncate ${
    href ? "group-hover:text-primary" : ""
  }`;

  if (compact) {
    const inner = (
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={nameClass}>{app.name}</span>
          {lastOpenedLabel && (
            <span className="truncate text-xs text-muted-foreground">
              {lastOpenedLabel}
            </span>
          )}
        </div>
      </div>
    );

    return (
      <div
        className={`group relative h-full rounded-xl border border-border bg-card p-3.5 flex items-center gap-3 transition-all ${
          href ? "hover:border-primary/50 hover:shadow-md" : ""
        }`}
      >
        {href ? (
          isExternal ? (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-0 outline-none"
            >
              {inner}
            </a>
          ) : (
            <Link href={href as Route} className="flex-1 min-w-0 outline-none">
              {inner}
            </Link>
          )
        ) : (
          inner
        )}
        {star}
      </div>
    );
  }

  /**
   * The link is on the name, stretched over the whole card by an `after:`
   * overlay — so hovering or clicking anywhere in the card opens the app, while
   * the accessibility tree still sees ONE link named after the app rather than
   * a card-sized anchor swallowing the favourite button. The star sits above
   * the overlay on `z-10`, which is what keeps it clickable.
   */
  const linkedName = !href ? (
    <span className={nameClass}>{app.name}</span>
  ) : isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${nameClass} outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']`}
    >
      {app.name}
    </a>
  ) : (
    <Link
      href={href as Route}
      className={`${nameClass} outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']`}
    >
      {app.name}
    </Link>
  );

  return (
    <div
      className={`group relative rounded-xl border border-border bg-card p-4 transition-all flex flex-col gap-3 min-w-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring ${
        href ? "hover:border-primary/50 hover:shadow-md" : ""
      }`}
    >
      <div className="absolute top-4 right-4 z-10">{star}</div>

      <div className="flex gap-3 pr-7">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          {linkedName}
          {lastOpenedLabel && (
            <span className="truncate text-xs text-muted-foreground">
              {lastOpenedLabel}
            </span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed text-pretty">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Only rendered when it carries something — an always-present footer row
          left every ordinary card with a strip of dead space under it. */}
      {(statusBadge || !href) && (
        <div className="flex items-center gap-2 mt-auto">
          {statusBadge}
          {!href && (
            /* Without this the card looked identical to a working one but did
               nothing when clicked. */
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              <Info size={12} />
              No launch URL
            </span>
          )}
        </div>
      )}
    </div>
  );
}
