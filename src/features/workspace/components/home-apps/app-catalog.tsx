"use client";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { LayoutGrid, List, Star } from "lucide-react";
import { useMemo, useState } from "react";
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserApplications,
  useCurrentUserFavoriteApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";
import { AppTileCard } from "./app-tile-card";

type ViewMode = "grid" | "list";
type SortBy = "name" | "default";

export function AppCatalog() {
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("default");

  const { data: apps = [] } = useCurrentUserApplications();
  const { data: favorites = [] } = useCurrentUserFavoriteApplications();
  const addFav = useAddCurrentUserFavoriteApplication();
  const removeFav = useRemoveCurrentUserFavoriteApplication();

  const favCodes = useMemo(
    () => new Set(favorites.map((f) => f.code)),
    [favorites],
  );

  const filtered = useMemo(() => {
    let list = apps;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((a) => a.name.toLowerCase().includes(q));
    }
    if (showFavoritesOnly) {
      list = list.filter((a) => favCodes.has(a.code));
    }
    if (sortBy === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    return list;
  }, [apps, search, showFavoritesOnly, sortBy, favCodes]);

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code);
    } else {
      addFav.mutate({ applicationCode: app.code, app });
    }
  }

  const gridKey = `${showFavoritesOnly}-${search}-${sortBy}`;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Application Directory{" "}
          <span className="normal-case font-normal text-gray-400">
            — Showing {filtered.length} of {apps.length} systems
          </span>
        </span>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search available applications catalogue..."
          aria-label="Search applications"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-in-out ${
            showFavoritesOnly
              ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950 dark:text-amber-400"
              : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          <Star
            size={14}
            className={
              showFavoritesOnly
                ? "fill-amber-400 text-amber-400 transition-colors duration-150"
                : "transition-colors duration-150"
            }
          />
          Favorites
        </button>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortBy)}
          className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        >
          <option value="default">Sort: Recommended</option>
          <option value="name">Sort: Name A–Z</option>
        </select>

        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-1.5 transition-colors ${
              viewMode === "list"
                ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
                : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950 py-12 text-center">
          <Star
            size={24}
            className="mx-auto text-amber-300 dark:text-amber-600 mb-3"
          />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            No favorites yet
          </p>
          <p className="text-xs text-amber-500 dark:text-amber-500 mt-1">
            Click the ★ on any app to add it here
          </p>
        </div>
      ) : !showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
          No applications match your search.
        </div>
      ) : (
        <div
          key={gridKey}
          className={
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn"
              : "flex flex-col gap-2 animate-fadeIn"
          }
        >
          {filtered.map((app) => (
            <AppTileCard
              key={app.code}
              app={app}
              isFavorite={favCodes.has(app.code)}
              onToggleFavorite={handleToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}
