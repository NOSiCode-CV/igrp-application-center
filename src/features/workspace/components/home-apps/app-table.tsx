"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  IGRPButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ArrowUpRight, ExternalLink } from "lucide-react";

import {
  getAppHref,
  isExternalAppHref,
} from "@/features/workspace/lib/app-utils";
import { showStatus } from "@/lib/app-utilities";

type Props = {
  apps: ApplicationDTO[];
  favoriteCodes: Set<string>;
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void;
};

type StatusTone = { dot: string; text: string; label: string };

/**
 * The Estado column answers one question — "can I open this?" — so it folds
 * the record's status together with whether a launch URL exists. An app marked
 * ACTIVE with no URL is not usable, and saying "Ativo" about it would be true
 * of the record and false of the thing the user is looking at.
 *
 * A dot plus text rather than a pill: the `.status-*` classes are `bg-x/15
 * text-x`, which the CSS contract in `app-center.css` rules out because the
 * contrast is a pure function of the token's own lightness. A filled versus
 * hollow dot also survives being read in greyscale.
 */
function statusTone(app: ApplicationDTO, href: string): StatusTone {
  if (!href) {
    return {
      dot: "border border-warning-subtle-foreground",
      text: "text-warning-subtle-foreground",
      // Same words as the grid card, so the two views share one vocabulary.
      label: "Sem URL definido",
    };
  }
  if (app.status === "ACTIVE") {
    return {
      dot: "bg-success",
      text: "text-secondary-foreground",
      label: showStatus(app.status) ?? "",
    };
  }
  if (app.status === "DELETED") {
    return {
      dot: "border border-destructive-subtle-foreground",
      text: "text-destructive-subtle-foreground",
      label: showStatus(app.status) ?? "",
    };
  }
  return {
    dot: "border border-warning-subtle-foreground",
    text: "text-warning-subtle-foreground",
    label: showStatus(app.status) ?? "",
  };
}

const CELL = "py-2.5 align-middle";

/**
 * Column widths, carried by BOTH the header cell and every body cell.
 *
 * The header row is `sr-only`, which means absolutely positioned and out of
 * flow, and `table-fixed` reads its widths from the first row still IN flow —
 * the first body row. Putting the widths in one place and spreading them
 * across both keeps the two from drifting, and keeps a column's `hidden`
 * breakpoint identical in the header and the body: they have to hide as a
 * pair or the remaining cells shift out from under their own column.
 */
const COL = {
  name: "md:w-64",
  code: "hidden sm:table-cell sm:w-40",
  description: "hidden lg:table-cell",
  status: "w-32 md:w-40",
  favorite: "w-12 md:w-14",
} as const;

/* The description is the one column whose value can legitimately be unknown.
   An em dash says "nothing recorded" without italic filler copy asserting it. */
const EMPTY = "—";

export function AppTable({ apps, favoriteCodes, onToggleFavorite }: Props) {
  return (
    /* `overflow-hidden` is what clips the rows to the rounded corners — the
       border lives on this wrapper, not on the table, so the header's bottom
       rule and the row rules all terminate against the same edge. */
    <div className="overflow-hidden rounded-xl border border-border">
      <Table className="table-fixed">
        {/**
         * Kept in the markup, hidden from the eye.
         *
         * The visible header strip is gone by request — with eight rows of
         * apps it was a band of labels over content that mostly explains
         * itself. The `<th>` elements stay because they are what lets a screen
         * reader announce "Estado: Sem URL definido" instead of reading six
         * unlabelled cells, and what makes the columns navigable at all. A
         * table whose columns have no names is a layout grid wearing a
         * table's markup.
         */}
        <TableHeader className="sr-only">
          <TableRow>
            <TableHead className={COL.name}>Aplicação</TableHead>
            <TableHead className={COL.code}>Código</TableHead>
            <TableHead className={COL.description}>Descrição</TableHead>
            <TableHead className={COL.status}>Estado</TableHead>
            <TableHead className={COL.favorite}>Favorito</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {apps.map((app) => {
            const href = getAppHref(app);
            const isExternal = href ? isExternalAppHref(app, href) : false;
            const isFavorite = favoriteCodes.has(app.code);
            const tone = statusTone(app, href);
            const opens = Boolean(href) && app.status === "ACTIVE";

            /* Which way the app opens decides the glyph: a new tab gets the
               external mark, a route within the portal gets the corner
               arrow. */
            const OpenIcon = isExternal ? ExternalLink : ArrowUpRight;

            const nameClass =
              "truncate rounded-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

            const nameContent = (
              <>
                <span className="truncate">{app.name}</span>
                {/* Always in the layout, painted only on hover or keyboard
                    focus. Rendering it conditionally would shift the name
                    sideways the moment the pointer arrived — reserving the
                    space costs 13px and keeps the row still.

                    `group-focus-within` is not optional: without it the cue
                    exists for the mouse and not for the keyboard, and the
                    icon is the only thing saying where this row leads. */}
                <OpenIcon
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                />
              </>
            );

            /**
             * The grid card opens external apps in a new tab with no warning
             * in the accessible name. Said here in words, because the icon
             * carries none and is invisible until hover anyway.
             *
             * An `aria-label` rather than an adjacent `sr-only` span: name
             * computation concatenates sibling elements with no separator and
             * trims their edges, so the span announced the app name and the
             * parenthetical run together as one word. The label keeps the
             * visible text as its prefix, which is what WCAG 2.5.3 asks for.
             */
            const externalLabel = `${app.name} (abre num novo separador)`;

            return (
              /* `group` is the hover scope for the open cue: the whole row is
                 the hint surface, while the name keeps its own hover for the
                 underline, so the cue says "this row leads somewhere" and the
                 underline says "this is the thing you are about to click". */
              <TableRow key={app.code} className="group">
                <TableCell className={`${CELL} ${COL.name}`}>
                  <div className="flex min-w-0 items-center gap-2.5">
                    {/* The mark stopped being a colour hashed from the code
                        and started carrying a fact: solid means the app
                        opens, dashed means it does not. The letter itself
                        repeats the name, so it is hidden from the a11y tree. */}
                    <span
                      aria-hidden="true"
                      className={`flex size-7 shrink-0 items-center justify-center rounded-md text-xs font-semibold ${
                        opens
                          ? "bg-muted text-secondary-foreground"
                          : "border border-dashed border-border text-muted-foreground"
                      }`}
                    >
                      {(app.name ?? app.code).charAt(0).toUpperCase()}
                    </span>

                    {!href ? (
                      <span className="truncate font-semibold text-muted-foreground">
                        {app.name}
                      </span>
                    ) : isExternal ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={externalLabel}
                        className={`${nameClass} flex min-w-0 items-center gap-1.5`}
                      >
                        {nameContent}
                      </a>
                    ) : (
                      <Link
                        href={href as Route}
                        className={`${nameClass} flex min-w-0 items-center gap-1.5`}
                      >
                        {nameContent}
                      </Link>
                    )}
                  </div>
                </TableCell>

                <TableCell
                  className={`${CELL} ${COL.code} font-mono text-xs text-muted-foreground`}
                >
                  <span className="block truncate">{app.code}</span>
                </TableCell>

                <TableCell
                  className={`${CELL} ${COL.description} text-muted-foreground`}
                >
                  <span className="block truncate">
                    {app.description || EMPTY}
                  </span>
                </TableCell>

                <TableCell className={`${CELL} ${COL.status}`}>
                  <span
                    className={`flex items-center gap-2 text-xs ${tone.text}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`size-1.5 shrink-0 rounded-full ${tone.dot}`}
                    />
                    <span className="truncate">{tone.label}</span>
                  </span>
                </TableCell>

                <TableCell className={`${CELL} ${COL.favorite}`}>
                  <IGRPButton
                    variant="ghost"
                    size="icon"
                    /* `iconName`, NOT children: IGRPButton throws children
                       away for every `icon*` size and renders `iconName`,
                       which defaults to "ArrowLeft". */
                    iconName="Star"
                    iconClassName={
                      isFavorite ? "fill-favorite text-favorite" : undefined
                    }
                    aria-label={
                      isFavorite
                        ? `Remover ${app.name} dos favoritos`
                        : `Adicionar ${app.name} aos favoritos`
                    }
                    aria-pressed={isFavorite}
                    /* `after:` lifts the 36px control to a ~44px target
                       without drawing a bigger button. */
                    className="relative text-muted-foreground hover:text-favorite after:absolute after:-inset-1 after:content-['']"
                    onClick={() => onToggleFavorite(app, isFavorite)}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
