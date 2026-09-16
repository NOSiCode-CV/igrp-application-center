"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  IGRPButton,
  IGRPDropdownMenu,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ChevronDown, LayoutGrid, List, Search, Star } from "lucide-react";

import { InlineError } from "@/components/inline-error";
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
  default: "Ordenar: Predefinido",
  recent: "Ordenar: Visitadas recentemente",
  "name-asc": "Ordenar: Nome (A–Z)",
  "name-desc": "Ordenar: Nome (Z–A)",
};

export function AppCatalog() {
  const [search, setSearch] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [sortBy, setSortBy] = useState<SortBy>("default");
  const searchRef = useRef<HTMLInputElement>(null);

  /**
   * `/` jumps to the search box — the catalogue is the page's subject and
   * search is its primary path, but reaching the field otherwise means the
   * mouse or ~10 tab stops past the banner and the recents rail.
   *
   * Not ⌘K: the framework's own command search already owns that shell-wide
   * (see the capture-phase handler in `command-palette.tsx`), and stealing it
   * here would break global search on this one route.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      const active = document.activeElement as HTMLElement | null;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active?.isContentEditable
      ) {
        return;
      }
      event.preventDefault();
      // Focusing scrolls the catalogue into view on its own, which is what
      // the old "Ver todas as aplicações" button was reaching for.
      searchRef.current?.focus();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const {
    data: apps = [],
    isError,
    error,
    refetch,
  } = useCurrentUserApplications();
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
    <section id={APP_CATALOG_SECTION_ID}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
          Aplicações{" "}
          <span className="normal-case font-normal text-muted-foreground">
            — {filtered.length} de {apps.length}
          </span>
        </h2>
      </div>

      {/* Every control here is a design-system component. The previous version
          hand-rolled all four with three different hover idioms and two focus
          idioms, so a retune of the system's button height or focus ring would
          have left this toolbar behind. */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <InputGroup className="h-10 w-full sm:w-75">
          <InputGroupAddon>
            <Search size={15} />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar aplicações"
            aria-label="Procurar aplicações"
          />
          {!search && (
            <InputGroupAddon align="inline-end">
              {/* Hidden below sm: it teaches a shortcut that needs a physical
                  keyboard. Left in the a11y tree — `<kbd>` announces as the
                  key it names, which is the point. */}
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
          <Star
            size={14}
            className={showFavoritesOnly ? "fill-current" : undefined}
          />
          Favoritos
        </Toggle>

        <IGRPDropdownMenu>
          <IGRPDropdownMenuTrigger asChild>
            <IGRPButton variant="outline" size="lg" className="h-10 min-w-0">
              <span className="truncate">{SORT_LABELS[sortBy]}</span>
              <ChevronDown size={14} className="shrink-0" />
            </IGRPButton>
          </IGRPDropdownMenuTrigger>
          <IGRPDropdownMenuContent align="start">
            <IGRPDropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <IGRPDropdownMenuRadioItem value="default">
                Ordenar: Predefinido
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="recent">
                Ordenar: Visitadas recentemente
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="name-asc">
                Ordenar: Nome (A–Z)
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="name-desc">
                Ordenar: Nome (Z–A)
              </IGRPDropdownMenuRadioItem>
            </IGRPDropdownMenuRadioGroup>
          </IGRPDropdownMenuContent>
        </IGRPDropdownMenu>

        <ToggleGroup
          type="single"
          variant="outline"
          size="lg"
          value={viewMode}
          // Radix clears the value when you press the active item; a view has
          // to be one or the other, so ignore the empty string.
          onValueChange={(value) => value && setViewMode(value as ViewMode)}
          className="shrink-0 sm:ms-auto"
        >
          <ToggleGroupItem
            value="grid"
            aria-label="Vista em grelha"
            className="size-10"
          >
            <LayoutGrid size={16} />
          </ToggleGroupItem>
          <ToggleGroupItem
            value="list"
            aria-label="Vista em lista"
            className="size-10"
          >
            <List size={16} />
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Four distinct answers, because they need four distinct actions. The
          previous two-branch version told a user whose request had FAILED that
          nothing matched a search they never typed — a broken backend read as
          "you have no access", which sends people to the service desk instead
          of to the retry button. */}
      {isError ? (
        <InlineError
          title="Não foi possível carregar as aplicações."
          message={
            error?.message ??
            "A lista está temporariamente indisponível. O seu acesso não foi alterado."
          }
          onRetry={() => refetch()}
        />
      ) : apps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted py-12 px-6 text-center">
          <p className="text-sm font-medium text-secondary-foreground">
            Ainda não tem aplicações atribuídas
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            O acesso é concedido por perfil e departamento. Contacte o
            administrador se esperava ver alguma coisa aqui.
          </p>
        </div>
      ) : showFavoritesOnly && !search.trim() && filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-warning-subtle bg-warning-subtle py-12 text-center">
          <Star
            size={24}
            className="mx-auto text-warning-subtle-foreground mb-3"
          />
          <p className="text-sm font-medium text-warning-subtle-foreground">
            Ainda sem favoritos
          </p>
          <p className="text-xs text-warning-subtle-foreground mt-1">
            Clique na ★ de uma aplicação para a adicionar aqui
          </p>
        </div>
      ) : filtered.length === 0 ? (
        /* Reached when a search — alone or combined with the favourites
           filter — hides everything. Naming BOTH filters matters: the
           favourites-only branch above used to swallow this case and tell the
           user to click a star while an invisible search was the real cause. */
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted py-12 px-6 text-center">
          <p className="text-sm text-muted-foreground">
            {showFavoritesOnly
              ? `Nenhum favorito corresponde a “${search.trim()}”.`
              : `Nenhuma aplicação corresponde a “${search.trim()}”.`}
          </p>
          <IGRPButton variant="outline" size="sm" onClick={clearFilters}>
            Limpar filtros
          </IGRPButton>
        </div>
      ) : (
        <div
          /* Keyed on the view mode only. Including `search` here remounted and
             re-animated every card on each keystroke. */
          key={viewMode}
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fadeIn"
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
              // "List" used to render the same grid tile in a one-column
              // stack, so the toggle cost a decision and changed nothing.
              compact={viewMode === "list"}
            />
          ))}
        </div>
      )}
    </section>
  );
}
