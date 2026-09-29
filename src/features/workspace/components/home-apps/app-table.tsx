"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  IGRPButton,
  IGRPIcon,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import {
  getAppHref,
  isExternalAppHref,
} from "@/features/workspace/lib/app-utils";
import { showStatus } from "@/lib/utilities";

type Props = {
  apps: ApplicationDTO[];
  favoriteCodes: Set<string>;
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void;
};

type StatusTone = { dot: string; text: string; label: string };

function statusTone(app: ApplicationDTO, href: string): StatusTone {
  if (!href) {
    return {
      dot: "border border-warning-subtle-foreground",
      text: "text-warning-subtle-foreground",
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

const COL = {
  name: "md:w-64",
  code: "hidden sm:table-cell sm:w-40",
  description: "hidden lg:table-cell",
  status: "w-32 md:w-40",
  favorite: "w-12 md:w-14",
} as const;

const EMPTY = "—";

export function AppTable({ apps, favoriteCodes, onToggleFavorite }: Props) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table className="table-fixed">
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
            const openIcon = isExternal ? "ExternalLink" : "ArrowUpRight";
            const nameClass =
              "truncate rounded-sm font-semibold text-foreground hover:text-primary hover:underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

            const nameContent = (
              <>
                <span className="truncate">{app.name}</span>
                <IGRPIcon
                  iconName={openIcon}
                  size={13}
                  aria-hidden="true"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 motion-reduce:transition-none"
                />
              </>
            );

            const externalLabel = `${app.name} (abre num novo separador)`;

            return (
              <TableRow key={app.code} className="group">
                <TableCell className={`${CELL} ${COL.name}`}>
                  <div className="flex min-w-0 items-center gap-2.5">
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
                    className={`flex items-center justify-end gap-2 text-xs ${tone.text}`}
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
