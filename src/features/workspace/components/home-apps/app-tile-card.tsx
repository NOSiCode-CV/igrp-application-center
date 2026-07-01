"use client";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { Star } from "lucide-react";
import { getAppTileColor } from "../../lib/app-utils";

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

  return (
    <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 hover:shadow-md dark:hover:shadow-gray-800 transition-shadow flex flex-col gap-3 min-w-0">
      <button
        type="button"
        aria-label={isFavorite ? "Remove from favourites" : "Add to favourites"}
        className="absolute top-3 right-3 text-gray-300 dark:text-gray-600 hover:text-amber-400 transition-colors"
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(app, isFavorite);
        }}
      >
        <Star
          size={16}
          className={isFavorite ? "fill-amber-400 text-amber-400" : ""}
        />
      </button>

      <div className="flex items-center gap-3">
        <div
          className={`flex items-center justify-center size-10 rounded-lg font-bold text-sm shrink-0 ${color.bg} ${color.text}`}
        >
          {initial}
        </div>

        <div className="flex flex-col gap-0.5 min-w-0 pr-5">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
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
        <>
          <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {description}
          </p>
          <hr className="border-gray-100 dark:border-gray-800" />
        </>
      )}
    </div>
  );
}
