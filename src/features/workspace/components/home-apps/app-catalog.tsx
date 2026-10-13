"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  IGRPButton,
  IGRPCombobox,
  IGRPIcon,
  IGRPLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { InlineError } from "@/components/inline-error";
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserApplications,
  useCurrentUserFavoriteApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";

import { APP_CATALOG_SECTION_ID, excludeCurrentApp } from "../../lib/app-utils";
import { AppTable } from "./app-table";
import { AppTileCard } from "./app-tile-card";

const HEADING_ID = "app-catalog-heading";

type ViewMode = "grid" | "list";
type SortBy = "default" | "recent" | "name-asc" | "name-desc";

/** Sort value → `workspace.catalog.sort.*` key + icon. */
const SORT_OPTIONS = [
  { value: "default", key: "default", icon: "ArrowUpDown" },
  { value: "recent", key: "recent", icon: "Clock" },
  { value: "name-asc", key: "nameAsc", icon: "ArrowDownAZ" },
  { value: "name-desc", key: "nameDesc", icon: "ArrowUpAZ" },
] as const satisfies readonly { value: SortBy; key: string; icon: string }[];

export function AppCatalog() {
  const t = useTranslations("workspace.catalog");
  const sortOptions = useMemo(
    () =>
      SORT_OPTIONS.map(({ value, key, icon }) => ({
        value,
        icon,
        label: t(`sort.${key}`),
      })),
    [t],
  );
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const searchRef = useRef<HTMLInputElement>(null);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        active?.isContentEditable ||
        active?.closest('[role="menu"],[role="listbox"],[role="dialog"]')
      ) {
        return;
      }
      event.preventDefault();
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const {
    data: allApps,
    isError,
    error,
    refetch,
  } = useCurrentUserApplications();
  const apps = useMemo(() => excludeCurrentApp(allApps ?? []), [allApps]);

  if (isError) console.error("[AppCatalog] query failed", error);
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

  const isFiltering = search.trim() !== "" || showFavoritesOnly;

  useEffect(() => {
    if (!isFiltering) {
      setAnnouncement("");
      return;
    }
    const id = setTimeout(() => {
      setAnnouncement(
        filtered.length === 0
          ? t("announceNone")
          : t("announceSome", { shown: filtered.length, total: apps.length }),
      );
    }, 300);
    return () => clearTimeout(id);
  }, [isFiltering, filtered.length, apps.length, t]);

  function clearFilters() {
    setSearch("");
    setShowFavoritesOnly(false);
  }

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code);
    } else {
      addFav.mutate({ applicationCode: app.code, app });
    }
  }

  return (
    <section id={APP_CATALOG_SECTION_ID} aria-labelledby={HEADING_ID}>
      <div className="mb-3 flex items-baseline gap-2">
        <h2
          id={HEADING_ID}
          className="min-w-0 truncate text-base font-semibold text-foreground"
        >
          {t("title")}
        </h2>
        {apps.length > 0 && (
          <span className="text-sm tabular-nums text-muted-foreground">
            {isFiltering
              ? t("filteredCount", {
                  shown: filtered.length,
                  total: apps.length,
                })
              : apps.length}
          </span>
        )}
      </div>

      <p aria-live="polite" role="status" className="sr-only">
        {announcement}
      </p>

      <div className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2">
        <InputGroup className="h-10 w-full sm:w-80 sm:max-w-full">
          <InputGroupAddon>
            <IGRPIcon iconName="Search" size={15} />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search")}
            aria-label={t("search")}
          />
          {!search && (
            <InputGroupAddon align="inline-end">
              <kbd className="hidden rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline-block">
                /
              </kbd>
            </InputGroupAddon>
          )}
        </InputGroup>

        <Toggle
          variant="outline"
          size="lg"
          pressed={showFavoritesOnly}
          onPressedChange={setShowFavoritesOnly}
          className="h-10 gap-1.5 px-3.5 data-[state=on]:border-warning-subtle data-[state=on]:bg-warning-subtle data-[state=on]:text-warning-subtle-foreground"
        >
          <IGRPIcon
            iconName="Star"
            size={14}
            className={showFavoritesOnly ? "fill-current" : undefined}
          />
          {t("favorites")}
        </Toggle>

        <div className="flex items-center gap-2">
          <IGRPLabel
            label={t("sortBy")}
            className="sr-only"
            name="ordenar-apps"
          />
          <IGRPCombobox
            name="ordenar-apps"
            variant="single"
            label=""
            showSearch={false}
            showIcon
            options={sortOptions}
            value={sortBy}
            placeholder={t("sortPlaceholder")}
            className="h-10"
            onChange={(value) => {
              if (typeof value === "string" && value !== "") {
                setSortBy(value as SortBy);
              }
            }}
          />
        </div>

        <ToggleGroup
          type="single"
          value={viewMode}
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="h-10 shrink-0 gap-0.5 rounded-lg border border-border bg-muted p-0.5 sm:ms-auto"
        >
          <ToggleGroupItem
            value="grid"
            aria-label={t("gridView")}
            className="size-8 rounded-md border-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
          >
            <IGRPIcon iconName="LayoutGrid" size={16} />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label={t("listView")}
            className="size-8 rounded-md border-0 text-muted-foreground data-[state=on]:bg-background data-[state=on]:text-primary data-[state=on]:shadow-sm"
          >
            <IGRPIcon iconName="List" size={16} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {isError ? (
        <InlineError
          title={t("errorTitle")}
          message={t("errorMessage")}
          onRetry={() => refetch()}
        />
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted py-12 px-6 text-center">
          <p className="text-sm font-medium text-secondary-foreground">
            {t("emptyTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("emptyDescription")}
          </p>
        </div>
      ) : showFavoritesOnly && !search.trim() && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warning-subtle bg-warning-subtle py-12 text-center">
          <IGRPIcon
            iconName="Star"
            size={24}
            className="mx-auto text-warning-subtle-foreground mb-3"
          />
          <p className="text-sm font-medium text-warning-subtle-foreground">
            {t("noFavoritesTitle")}
          </p>
          <p className="text-xs text-warning-subtle-foreground mt-1">
            {t("noFavoritesDescription")}
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted py-12 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {showFavoritesOnly
              ? t("noFavoriteMatch", { query: search.trim() })
              : t("noMatch", { query: search.trim() })}
          </p>
          <IGRPButton variant="outline" size="sm" onClick={clearFilters}>
            {t("clearFilters")}
          </IGRPButton>
        </div>
      ) : viewMode === "list" ? (
        <div key={viewMode} className="animate-fadeIn">
          <AppTable
            apps={filtered}
            favoriteCodes={favCodes}
            onToggleFavorite={handleToggle}
          />
        </div>
      ) : (
        <div
          key={viewMode}
          className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn"
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
