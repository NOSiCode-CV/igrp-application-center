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
import { ChevronDown, LayoutGrid, List, Search, Star } from "lucide-react";

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

  return (
    <section id={APP_CATALOG_SECTION_ID}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Applications{" "}
          <span className="normal-case font-normal text-ring">
            — {filtered.length} of {apps.length}
          </span>
        </h2>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <div className="relative w-full sm:w-75">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ring"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search applications"
            aria-label="Search applications"
            className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-ring focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          aria-pressed={showFavoritesOnly}
          className={`flex h-10 items-center gap-1.5 rounded-lg border px-3.5 text-sm font-medium transition-all duration-150 ease-in-out ${
            showFavoritesOnly
              ? "border-warning-subtle bg-warning-subtle text-warning-subtle-foreground"
              : "border-border bg-card text-secondary-foreground hover:bg-accent"
          }`}
        >
          <Star
            size={14}
            className={
              showFavoritesOnly
                ? "fill-warning-subtle-foreground text-warning-subtle-foreground transition-colors duration-150"
                : "transition-colors duration-150"
            }
          />
          Favorites
        </button>

        <IGRPDropdownMenu>
          <IGRPDropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

        <div className="ms-auto flex h-10 items-center overflow-hidden rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            aria-pressed={viewMode === "grid"}
            className={`flex size-10 items-center justify-center transition-colors ${
              viewMode === "grid"
                ? "bg-primary-subtle text-primary-subtle-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            aria-pressed={viewMode === "list"}
            className={`flex size-10 items-center justify-center border-s border-border transition-colors ${
              viewMode === "list"
                ? "bg-primary-subtle text-primary-subtle-foreground"
                : "bg-card text-muted-foreground hover:bg-accent"
            }`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warning-subtle bg-warning-subtle py-12 text-center">
          <Star
            size={24}
            className="mx-auto text-warning-subtle-foreground mb-3"
          />
          <p className="text-sm font-medium text-warning-subtle-foreground">
            No favourites yet
          </p>
          <p className="text-xs text-warning-subtle-foreground mt-1">
            Click the ★ on any app to add it here
          </p>
        </div>
      ) : !showFavoritesOnly && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted py-12 text-center text-sm text-muted-foreground">
          No applications match your search.
        </div>
      ) : (
        <div
          /* Keyed on the view mode only. Including `search` here remounted and
             re-animated every card on each keystroke. */
          key={viewMode}
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
