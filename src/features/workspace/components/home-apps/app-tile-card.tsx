"use client";

import type { Route } from "next";
import Link from "next/link";

import { Badge, Separator } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ExternalLink, Info, Star } from "lucide-react";

import { getStatusColor, showStatus } from "@/lib/app-utilities";

import {
  getAppHref,
  getAppTileColor,
  isExternalAppHref,
  isRecentlyAdded,
} from "../../lib/app-utils";

type Props = {
  app: ApplicationDTO;
  isFavorite: boolean;
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void;
  lastOpenedLabel?: string;
  description?: string;
  /** Compact horizontal layout for the "Recently Accessed" row. */
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

  /**
   * The glyph stays 16px so the control reads as light, but the target is 44px
   * via the `after:` overlay — the old bare icon was a ~16px hit area on the
   * most-used control in the catalogue.
   */
  const star = (
    <button
      type="button"
      aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
      aria-pressed={isFavorite}
      className="relative z-10 shrink-0 text-muted-foreground/50 hover:text-warning-subtle-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors after:absolute after:-inset-3.5 after:content-['']"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(app, isFavorite);
      }}
    >
      <Star
        size={16}
        className={
          isFavorite
            ? "fill-warning-subtle-foreground text-warning-subtle-foreground"
            : ""
        }
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
   * The name row owns its width: the star sits in the flex row and the status
   * moved to the footer. Previously both were in an absolute overlay and the
   * name had to be shimmed clear with `pr-16`/`pr-5`, which a longer status
   * label overlapped anyway.
   */
  const content = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          <span className={nameClass}>{app.name}</span>
          {lastOpenedLabel && (
            <span className="truncate text-xs text-muted-foreground">
              {lastOpenedLabel}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}
    </>
  );

  return (
    <div
      className={`group relative rounded-xl border border-border bg-card p-4 hover:shadow-md transition-all flex flex-col gap-3 min-w-0 ${
        href ? "hover:border-primary/50" : ""
      }`}
    >
      <div className="absolute top-4 right-4 z-10">{star}</div>

      {href ? (
        isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 pr-7 outline-none"
          >
            {content}
          </a>
        ) : (
          <Link
            href={href as Route}
            className="flex flex-col gap-3 pr-7 outline-none"
          >
            {content}
          </Link>
        )
      ) : (
        <div className="flex flex-col gap-3 pr-7">{content}</div>
      )}

      <Separator className="mt-auto" />
      <div className="flex items-center justify-between gap-2">
        {statusBadge ?? <span className="text-xs text-muted-foreground" />}
        {href ? (
          <span className="flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            Open
            <ExternalLink size={12} />
          </span>
        ) : (
          /* Previously this card rendered identically to a working one but with
             no link, no cursor change and no explanation. */
          <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <Info size={12} />
            No launch URL
          </span>
        )}
      </div>
    </div>
  );
}
