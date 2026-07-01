"use client";

import type { Route } from "next";
import Link from "next/link";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ExternalLink, Star } from "lucide-react";

import {
  getAppHref,
  getAppTileColor,
  isExternalAppHref,
} from "../../lib/app-utils";

type Props = {
  app: ApplicationDTO;
  isFavorite: boolean;
  onToggleFavorite: (app: ApplicationDTO, isFavorite: boolean) => void;
  lastOpenedLabel?: string;
  description?: string;
};

export function AppTileCard({
  app,
  isFavorite,
  onToggleFavorite,
  lastOpenedLabel,
  description,
}: Props) {
  const color = getAppTileColor(app.code);
  const initial = (app.name ?? app.code).charAt(0).toUpperCase();
  const href = getAppHref(app);
  const isExternal = href ? isExternalAppHref(app, href) : false;

  const content = (
    <>
      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 pr-5">
          <span
            className={`font-semibold text-sm text-gray-900 dark:text-gray-100 truncate ${
              href
                ? "group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                : ""
            }`}
          >
            {app.name}
          </span>
          {lastOpenedLabel && (
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {lastOpenedLabel}
            </span>
          )}
        </div>
      </div>

      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
          {description}
        </p>
      )}

      {href && (
        <>
          <hr className="border-gray-100 dark:border-gray-800" />
          <div className="flex items-center justify-end">
            <span className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Launch app
              <ExternalLink size={12} />
            </span>
          </div>
        </>
      )}
    </>
  );

  return (
    <div
      className={`group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-all flex flex-col gap-3 min-w-0 ${
        href ? "hover:border-indigo-300 dark:hover:border-indigo-600" : ""
      }`}
    >
      <button
        type="button"
        aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
        className="absolute top-3 right-3 z-10 text-gray-300 dark:text-gray-600 hover:text-amber-400 transition-colors"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite(app, isFavorite);
        }}
      >
        <Star
          size={16}
          className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
        />
      </button>

      {href ? (
        isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col gap-3 outline-none"
          >
            {content}
          </a>
        ) : (
          <Link
            href={href as Route}
            className="flex flex-col gap-3 outline-none"
          >
            {content}
          </Link>
        )
      ) : (
        <div className="flex flex-col gap-3">{content}</div>
      )}
    </div>
  );
}
