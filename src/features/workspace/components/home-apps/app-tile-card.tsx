"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  Badge,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import {
  getAppHref,
  getAppTileColor,
  isExternalAppHref,
  isRecentlyAdded,
} from "@/features/workspace/lib/app-utils";
import { showStatus, statusClass } from "@/lib/app-utilities";

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

  /* `z-10` is load-bearing: it lifts the button above the name link's
     stretched `after:` overlay, which otherwise swallows the click. */
  const star = (
    <IGRPButton
      variant="ghost"
      size="icon"
      /* `iconName`, NOT children: IGRPButton throws children away for every
         `icon*` size and renders `iconName`, which defaults to "ArrowLeft". */
      iconName="Star"
      iconClassName={isFavorite ? "fill-favorite text-favorite" : undefined}
      aria-label={
        isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
      }
      aria-pressed={isFavorite}
      /* `after:` lifts the 36px control to a ~44px target without drawing a
         bigger button. `favorite` rather than `warning`: --warning is 2.15:1
         on a card, which made a FILLED star less visible than an empty one. */
      className="relative z-10 shrink-0 text-muted-foreground hover:text-favorite after:absolute after:-inset-1 after:content-['']"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggleFavorite(app, isFavorite);
      }}
    />
  );

  const statusBadge =
    app.status !== "ACTIVE" ? (
      <Badge className={statusClass(app.status) as string}>
        {showStatus(app.status)}
      </Badge>
    ) : isRecentlyAdded(app.createdDate) ? (
      <Badge className="bg-success-subtle text-success-subtle-foreground">
        Nova
      </Badge>
    ) : null;

  const nameClass = `font-semibold text-sm text-foreground truncate ${
    href ? "group-hover:text-primary" : ""
  }`;

  /**
   * The link is on the name, stretched over the whole card by an `after:`
   * overlay — so hovering or clicking anywhere in the card opens the app, while
   * the accessibility tree still sees ONE link named after the app rather than
   * a card-sized anchor swallowing the favourite button. The star sits above
   * the overlay on `z-10`, which is what keeps it clickable.
   */
  const stretchedLink =
    "outline-none after:absolute after:inset-0 after:rounded-xl after:content-['']";

  const linkedName = !href ? (
    <span className={nameClass}>{app.name}</span>
  ) : isExternal ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`${nameClass} ${stretchedLink}`}
    >
      {app.name}
    </a>
  ) : (
    <Link href={href as Route} className={`${nameClass} ${stretchedLink}`}>
      {app.name}
    </Link>
  );

  /* Rendered by BOTH variants. It used to be grid-only, so a recents card for
     an app with no launch URL looked exactly like a working one and silently
     did nothing when clicked. */
  const noLaunchUrl = (
    <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground">
      <IGRPIcon iconName="Info" size={12} />
      Sem URL definido
    </span>
  );

  if (compact) {
    return (
      <div
        className={`group relative h-full rounded-xl border border-border bg-card p-3.5 flex items-center gap-3 transition-all has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring ${
          href ? "hover:border-primary/50 hover:shadow-md" : ""
        }`}
      >
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {linkedName}
          {lastOpenedLabel ? (
            <span className="truncate text-xs text-muted-foreground">
              {lastOpenedLabel}
            </span>
          ) : (
            description && (
              <span className="truncate text-xs text-muted-foreground">
                {description}
              </span>
            )
          )}
        </div>
        {statusBadge}
        {!href && noLaunchUrl}
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
  return (
    <div
      className={`group relative rounded-xl border border-border bg-card p-4 transition-all flex flex-col gap-3 min-w-0 has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring ${
        href ? "hover:border-primary/50 hover:shadow-md" : ""
      }`}
    >
      <div className="flex gap-3 pr-7">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
          {linkedName}
          {/* The code is how the app is referred to in Gestão de Aplicações
              and in a support call, so it belongs next to the name rather
              than only in the admin tables. */}
          <span className="truncate text-xs text-muted-foreground">
            {app.code}
          </span>
          {lastOpenedLabel && (
            <span className="truncate text-xs text-muted-foreground">
              {lastOpenedLabel}
            </span>
          )}
        </div>
      </div>

      {/* Full width rather than indented into the text column: the description
          is the card's body copy, not a third line of the header. Always
          rendered, so cards keep one height in a row — an absent description
          says so instead of silently collapsing the card. */}
      <p
        className={`text-xs text-muted-foreground line-clamp-2 leading-relaxed text-pretty ${
          description ? "" : "italic"
        }`}
      >
        {description || "Sem descrição"}
      </p>

      {/* After the content in DOM order so the app name is the first tab stop
          on the card, matching the compact variant and the visual order.
          Absolute positioning keeps it in the top-right corner regardless. */}
      <div className="absolute top-4 right-4 z-10">{star}</div>

      {/* Only rendered when it carries something — an always-present footer row
          left every ordinary card with a strip of dead space under it. */}
      {(statusBadge || !href) && (
        <div className="flex items-center gap-2 mt-auto">
          {statusBadge}
          {!href && noLaunchUrl}
        </div>
      )}
    </div>
  );
}
