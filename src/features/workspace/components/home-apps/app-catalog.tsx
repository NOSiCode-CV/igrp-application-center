"use client";

import { useMemo, useState } from "react";

import {
  IGRPDropdownMenu,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuTrigger,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ChevronDown, LayoutGrid, List, Star } from "lucide-react";

import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserApplications,
  useCurrentUserFavoriteApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";

import { APP_CATALOG_SECTION_ID } from "../../lib/app-utils";
import { AppTileCard } from "./app-tile-card";

type ViewMode = "grid" | "list";
type SortBy = "default" | "recent" | "name-asc" | "name-desc";

const SORT_LABELS: Record<SortBy, string> = {
  default: "Sort: Recommended",
  recent: "Sort: Recently Visited",
  "name-asc": "Sort: Name (A–Z)",
  "name-desc": "Sort: Name (Z–A)",
};

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
    if (sortBy === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "name-desc") {
      list = [...list].sort((a, b) => b.name.localeCompare(a.name));
    } else if (sortBy === "recent") {
      list = [...list].sort((a, b) => {
        const aTime = a.lastAccess ? new Date(a.lastAccess).getTime() : 0;
        const bTime = b.lastAccess ? new Date(b.lastAccess).getTime() : 0;
        return bTime - aTime;
      });
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
    <section id={APP_CATALOG_SECTION_ID}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Application Directory{" "}
          <span className="normal-case font-normal text-muted-foreground">
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
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-150 ease-in-out ${
            showFavoritesOnly
              ? "border-warning/40 bg-warning/15 text-warning"
              : "border-border bg-card text-muted-foreground hover:bg-accent"
          }`}
        >
          <Star
            size={14}
            className={
              showFavoritesOnly
                ? "fill-warning text-warning transition-colors duration-150"
                : "transition-colors duration-150"
            }
          />
          Favorites
        </button>

        <IGRPDropdownMenu>
          <IGRPDropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown size={14} />
            </button>
          </IGRPDropdownMenuTrigger>
          <IGRPDropdownMenuContent align="start">
            <IGRPDropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <IGRPDropdownMenuRadioItem value="default">
                Sort: Recommended
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="recent">
                Sort: Recently Visited
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="name-asc">
                Sort: Name (A–Z)
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="name-desc">
                Sort: Name (Z–A)
              </IGRPDropdownMenuRadioItem>
            </IGRPDropdownMenuRadioGroup>
          </IGRPDropdownMenuContent>
        </IGRPDropdownMenu>

        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-1.5 transition-colors ${
              viewMode === "grid"
                ? "bg-primary/10 text-primary"
                : "bg-card text-muted-foreground hover:bg-accent"
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
                ? "bg-primary/10 text-primary"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warning/30 bg-warning/10 py-12 text-center">
          <Star size={24} className="mx-auto text-warning/60 mb-3" />
          <p className="text-sm font-medium text-warning">No favorites yet</p>
          <p className="text-xs text-warning/80 mt-1">
            Click the ★ on any app to add it here
          </p>
        </div>
      ) : !showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted py-12 text-center text-sm text-muted-foreground">
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
              description={app.description ?? undefined}
            />
          ))}
        </div>
      )}
    </section>
  );
}
