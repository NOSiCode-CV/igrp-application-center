"use client";

import type { Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  Badge,
  IGRPIcon,
  Skeleton,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";
import { AppCenterNotFound } from "@/components/not-found";
import {
  useCurrentUser,
  useCurrentUserActiveRole,
  useCurrentUserApplications,
  useCurrentUserDepartments,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
  useGetCurrentUserRoles,
} from "@/features/users/use-users";
import { config } from "@/lib/constants";

import { ApplicationCardHome } from "./app-card-home";
import { CommandPalette } from "./command-palette";
import { FavoriteToggle } from "./favorite-toggle";

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
}

/**
 * Time-based greeting resolved client-side after mount. Returns `null` on the
 * server / first client render so SSR and hydration agree — the server's hour
 * (or timezone) can differ from the client's, which would otherwise produce a
 * hydration mismatch on the greeting word.
 */
function useGreeting() {
  const [greet, setGreet] = useState<string | null>(null);
  useEffect(() => {
    setGreet(greeting());
  }, []);
  return greet;
}

function firstName(full?: string) {
  return full?.trim().split(/\s+/)[0] ?? "";
}

/** Title-case each whitespace- or hyphen-separated word, accent-aware. */
function titleCase(s: string): string {
  return s.replace(
    /(^|\s|-)([a-zà-ÿ])/g,
    (_m, sep: string, ch: string) => sep + ch.toUpperCase(),
  );
}

function resolveImage(picture?: string | null) {
  if (!picture) return null;
  return picture.startsWith("http")
    ? picture
    : new URL(picture, config.minioUrl).toString();
}

function resolveHref(app: ApplicationDTO) {
  if (app.code === "APP_IGRP_CENTER") return "/applications";
  return app.url ?? app.slug ?? "";
}

/**
 * Hero side widget: live clock + Portuguese date + apps/favorites counts.
 * Uses useLiveClock so the time stays accurate without a full rerender.
 */
// function HeroStatsWidget({
//   appCount,
//   favoriteCount,
// }: {
//   appCount: number;
//   favoriteCount: number;
// }) {
//   return (
//     <aside className="relative shrink-0 w-full md:w-auto md:min-w-[200px] rounded-xl border border-border/60 bg-card/70 backdrop-blur-sm px-4 py-3">
//       <div className="mt-2.5 flex items-center justify-center gap-3 text-xs text-muted-foreground">
//         <span>
//           <strong className="font-semibold tabular-nums text-foreground">
//             {appCount}
//           </strong>{" "}
//           apps
//         </span>
//         <span aria-hidden className="h-3 w-px bg-border" />
//         <span>
//           <strong className="font-semibold tabular-nums text-foreground">
//             {favoriteCount}
//           </strong>{" "}
//           favoritos
//         </span>
//       </div>
//     </aside>
//   );
// }

function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
          key={i}
          className="rounded-lg border border-border/40 bg-card p-5"
        >
          <div className="flex gap-4">
            <Skeleton className="size-14 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RecentPill({ app }: { app: ApplicationDTO }) {
  const imageSrc = resolveImage(app.picture);
  const href = resolveHref(app);
  if (!href) return null;
  const isAbsolute = /^https?:\/\//i.test(href);
  const isExternal = app.type === "EXTERNAL" || isAbsolute;
  const linkProps = isExternal
    ? {
        href,
        target: "_blank" as const,
        rel: "noopener noreferrer",
      }
    : null;
  const inner = (
    <>
      <span className="relative size-5 overflow-hidden rounded-sm flex items-center justify-center bg-muted/30">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt=""
            fill
            className="object-cover"
            sizes="20px"
          />
        ) : (
          <IGRPIcon iconName="AppWindow" className="size-3 text-primary" />
        )}
      </span>
      <span className="line-clamp-1 group-hover:text-primary transition-colors">
        {app.name}
      </span>
      {isExternal && (
        <IGRPIcon
          iconName="ArrowUpRight"
          className="size-3 text-muted-foreground shrink-0"
          aria-label="Aplicação externa"
        />
      )}
    </>
  );
  return (
    <div className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-card pl-3 pr-1 py-1 text-xs font-medium transition-colors hover:border-primary/50 hover:bg-primary/5">
      {linkProps ? (
        <a {...linkProps} className="inline-flex items-center gap-2 min-w-0">
          {inner}
        </a>
      ) : (
        <Link
          href={href as Route}
          className="inline-flex items-center gap-2 min-w-0"
        >
          {inner}
        </Link>
      )}
      <FavoriteToggle app={app} size="sm" />
    </div>
  );
}

/** Rows visible before the favorites list caps its height and scrolls. */
const FAVORITES_VISIBLE_ROWS = 5;
/** Matches the `gap-2` (0.5rem) between rows, in px — used to size 5 rows. */
const FAVORITES_ROW_GAP = 8;

/**
 * Renders favorites as a vertical list (one pill per row). Once there are more
 * than FAVORITES_VISIBLE_ROWS favorites the list caps its height to exactly
 * that many rows — measured from the real pills, so the cutoff is precise — and
 * scrolls. A bottom fade + chevron then signals there's more below the fold (the
 * only cue, since the scrollbar is hidden) and hides once scrolled to the end.
 */
function ScrollableFavorites({
  children,
  count,
}: {
  children: React.ReactNode;
  count: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollable = count > FAVORITES_VISIBLE_ROWS;

  useEffect(() => {
    const el = ref.current;
    if (!el || !scrollable) {
      setMaxHeight(null);
      setCanScrollDown(false);
      return;
    }
    const measure = () => {
      const rows = Array.from(el.children) as HTMLElement[];
      const visible = Math.min(FAVORITES_VISIBLE_ROWS, rows.length);
      if (visible === 0) return;
      // offsetHeight is scroll-independent, so this stays correct mid-scroll.
      let h = 0;
      for (let i = 0; i < visible; i++) h += rows[i].offsetHeight;
      h += FAVORITES_ROW_GAP * (visible - 1);
      setMaxHeight(h);
    };
    const updateScroll = () => {
      // 1px tolerance absorbs sub-pixel rounding at the scroll end.
      setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 1);
    };
    measure();
    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    const ro = new ResizeObserver(() => {
      measure();
      updateScroll();
    });
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      ro.disconnect();
    };
    // ResizeObserver re-measures when rows are added/removed, so `count`
    // itself isn't needed as a dependency.
  }, [scrollable]);

  return (
    <div className="relative">
      <div
        ref={ref}
        className={[
          "flex flex-col items-start gap-2 pr-1",
          scrollable ? "overflow-y-auto home-scroll-viewport" : "",
        ].join(" ")}
        style={scrollable && maxHeight ? { maxHeight } : undefined}
      >
        {children}
      </div>
      {/* Fade — purely visual, never intercepts clicks. */}
      <div
        aria-hidden
        className={[
          "pointer-events-none absolute inset-x-0 bottom-0 h-8",
          "bg-linear-to-t from-card via-card/80 to-transparent",
          "transition-opacity duration-200",
          canScrollDown ? "opacity-100" : "opacity-0",
        ].join(" ")}
      />
      {/* Small scroll affordance — fixed footprint so clicks here scroll the
          list instead of falling through to the favorite item beneath it. */}
      {canScrollDown && (
        <button
          type="button"
          aria-label="Ver mais favoritos"
          onClick={() =>
            ref.current?.scrollBy({
              top: ref.current.clientHeight * 0.8,
              behavior: "smooth",
            })
          }
          className="absolute bottom-1 left-1/2 size-6 -translate-x-1/2 flex items-center justify-center rounded-full border border-border/60 bg-card/90 text-muted-foreground shadow-sm transition-colors hover:text-foreground hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
        >
          <IGRPIcon iconName="ChevronDown" className="size-4" />
        </button>
      )}
    </div>
  );
}

const FILTER_STORAGE_KEY = "igrp.home.todas.filter";
const COLLAPSE_STORAGE_KEY = "igrp.home.sections.collapsed";
type TypeFilter = "ALL" | "INTERNAL" | "EXTERNAL";
type SectionKey = "recentes" | "todas";

export function ApplicationsListHome() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("ALL");
  const [deptFilter, setDeptFilter] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<SectionKey, boolean>>({
    recentes: false,
    todas: false,
  });
  const searchWrapperRef = useRef<HTMLButtonElement>(null);
  const greet = useGreeting();

  // Restore collapsed state from localStorage on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(COLLAPSE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Record<SectionKey, boolean>>;
      setCollapsed((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist collapsed state.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      COLLAPSE_STORAGE_KEY,
      JSON.stringify(collapsed),
    );
  }, [collapsed]);

  const toggleSection = (key: SectionKey) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  // Restore filter selection from localStorage on first mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(FILTER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        type?: TypeFilter;
        dept?: string | null;
      };
      if (parsed.type) setTypeFilter(parsed.type);
      if (parsed.dept !== undefined) setDeptFilter(parsed.dept);
    } catch {
      // ignore malformed storage
    }
  }, []);

  // Persist filter selection.
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      FILTER_STORAGE_KEY,
      JSON.stringify({ type: typeFilter, dept: deptFilter }),
    );
  }, [typeFilter, deptFilter]);

  const { data: currentUser, isPending: isUserPending } = useCurrentUser();
  const { data: activeRole, isPending: isActiveRolePending } =
    useCurrentUserActiveRole();
  const { data: userRoles, isPending: isUserRolesPending } =
    useGetCurrentUserRoles();
  const { data: userDepartments, isPending: isUserDepartmentsPending } =
    useCurrentUserDepartments();
  const isIdentityReady =
    !isUserPending &&
    !isActiveRolePending &&
    !isUserRolesPending &&
    !isUserDepartmentsPending;
  const { data: applications, isLoading, error } = useCurrentUserApplications();
  const {
    data: favorites,
    isError: favoritesError,
    refetch: refetchFavorites,
  } = useCurrentUserFavoriteApplications();
  const {
    data: recent,
    isError: recentError,
    refetch: refetchRecent,
  } = useGetCurrentUserRecentApplications();

  const visibleApps = useMemo(
    () =>
      (applications ?? [])
        .filter((app) => app.status === "ACTIVE")
        .filter((app) => app.code !== "APP_IGRP_CENTER"),
    [applications],
  );

  const filteredApps = useMemo(() => {
    return visibleApps.filter((app) => {
      if (typeFilter !== "ALL" && app.type !== typeFilter) return false;
      if (deptFilter && !app.departments?.includes(deptFilter)) return false;
      return true;
    });
  }, [visibleApps, typeFilter, deptFilter]);

  // Build the set of departments that appear in the user's available apps —
  // shown as chips. Sorted by name for stable order; matched against
  // userDepartments for human-readable labels.
  const departmentChips = useMemo(() => {
    const seen = new Map<string, string>();
    for (const app of visibleApps) {
      for (const code of app.departments ?? []) {
        if (seen.has(code)) continue;
        const named = userDepartments?.find((d) => d.code === code);
        seen.set(code, named?.name ?? code);
      }
    }
    return Array.from(seen.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [visibleApps, userDepartments]);

  const favoriteIds = useMemo(
    () => new Set(favoritesError ? [] : (favorites ?? []).map((f) => f.id)),
    [favorites, favoritesError],
  );
  const recentIds = useMemo(
    () => new Set(recentError ? [] : (recent ?? []).map((r) => r.id)),
    [recent, recentError],
  );

  const favoriteApps = filteredApps.filter((a) => favoriteIds.has(a.id));
  const recentApps = filteredApps
    .filter((a) => recentIds.has(a.id))
    .slice(0, 8);

  const activeRoleName = useMemo(() => {
    if (!activeRole?.roleCode) return null;
    const match = userRoles?.find(
      (r: { code: string; name?: string }) => r.code === activeRole.roleCode,
    );
    return match?.name ?? activeRole.roleCode;
  }, [activeRole, userRoles]);

  const activeDepartmentName = useMemo(() => {
    if (!activeRole?.departmentCode) return null;
    const match = userDepartments?.find(
      (d) => d.code === activeRole.departmentCode,
    );
    return match?.name ?? activeRole.departmentCode;
  }, [activeRole, userDepartments]);

  if (error) throw error;

  const userFirst =
    firstName(currentUser?.name) || firstName(currentUser?.email);
  const contextBits = [activeDepartmentName, activeRoleName].filter(
    Boolean,
  ) as string[];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden gap-6">
      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        applications={visibleApps}
        favoriteIds={favoriteIds}
        recentIds={recentIds}
      />

      {/* Hero — always visible, doesn't scroll. */}
      <div className="shrink-0">
        <header className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 md:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "radial-gradient(110% 90% at 100% 0%, color-mix(in oklab, var(--primary) 10%, transparent) 0%, transparent 55%), radial-gradient(120% 100% at 0% 100%, color-mix(in oklab, var(--primary) 6%, transparent) 0%, transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
            }}
          />

          <div className="relative flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
            <div className="flex-1 min-w-0 flex flex-col gap-1">
              {isIdentityReady ? (
                <>
                  <h1 className="text-base md:text-lg font-medium tracking-tight leading-[1.2] text-foreground">
                    {greet ?? "Olá"}
                    {userFirst ? "," : "."}
                    {userFirst && (
                      <>
                        {" "}
                        <span className="font-bold text-primary">
                          {userFirst}
                        </span>
                        .
                      </>
                    )}
                  </h1>
                  {contextBits.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground mt-0.5">
                      {contextBits.map((bit, i) => (
                        <span key={bit} className="flex items-center gap-2">
                          {i > 0 && (
                            <span
                              aria-hidden
                              className="size-1 rounded-full bg-border"
                            />
                          )}
                          <span>{bit}</span>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : (
                <div
                  className="flex flex-col gap-2"
                  aria-busy="true"
                  aria-live="polite"
                >
                  <Skeleton className="h-9 md:h-11 w-64" />
                  <Skeleton className="h-4 w-80 mt-0.5" />
                </div>
              )}
            </div>
          </div>
        </header>
      </div>

      <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-border/60 bg-card overflow-hidden">
        <div className="shrink-0 px-4 py-3 border-b border-border/60 bg-card">
          <button
            ref={searchWrapperRef}
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-label="Abrir paleta de comandos para pesquisar aplicações"
            className="group relative w-full sm:w-80 md:w-96 h-10 flex items-center gap-2 rounded-md border border-border bg-background pl-3 pr-2 text-sm text-muted-foreground hover:border-primary/40 hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 transition-colors cursor-pointer"
          >
            <IGRPIcon
              iconName="Search"
              className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors"
            />
            <span className="flex-1 text-left truncate">
              Pesquisar aplicações…
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border/60 bg-muted/40 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              <span className="text-[11px] leading-none">⌘</span>K
            </kbd>
          </button>
        </div>

        <div className="flex-1 min-h-0 p-4 flex flex-col gap-6 overflow-y-auto lg:overflow-hidden home-scroll-viewport">
          {isLoading ? (
            <GridSkeleton />
          ) : !applications || applications.length === 0 ? (
            <AppCenterNotFound
              iconName="AppWindow"
              title="Nenhuma aplicação encontrada."
            >
              Parece que você ainda não tem aplicações disponíveis.
            </AppCenterNotFound>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 lg:flex-1 lg:min-h-0">
              <div className="flex-1 min-w-0 flex flex-col gap-10 order-2 lg:order-1 lg:min-h-0 lg:overflow-y-auto lg:pr-2 home-scroll-viewport">
                {recentError && (
                  <section>
                    <SectionHeader iconName="Clock" label="Recentes" />
                    <InlineError
                      message="Não foi possível carregar os recentes."
                      onRetry={() => refetchRecent()}
                    />
                  </section>
                )}

                {!recentError && recentApps.length > 0 && (
                  <section
                    className="animate-slide-in-up opacity-0"
                    style={{ animationDelay: "60ms" }}
                  >
                    <SectionHeader
                      iconName="Clock"
                      label="Recentes"
                      count={recentApps.length}
                      tone="primary"
                      collapsible
                      collapsed={collapsed.recentes}
                      onToggle={() => toggleSection("recentes")}
                    />
                    {!collapsed.recentes && (
                      <GridNavigator className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                        {recentApps.map((app) => (
                          <ApplicationCardHome
                            key={app.id}
                            app={app}
                            variant="featured"
                            showLastAccess
                          />
                        ))}
                      </GridNavigator>
                    )}
                  </section>
                )}

                <section
                  className="animate-slide-in-up opacity-0"
                  style={{ animationDelay: "140ms" }}
                >
                  <SectionHeader
                    iconName="AppWindow"
                    label="Todas as Aplicações"
                    count={filteredApps.length}
                    tone="muted"
                    collapsible
                    collapsed={collapsed.todas}
                    onToggle={() => toggleSection("todas")}
                  />
                  {!collapsed.todas && (
                    <>
                      <FilterChipRow
                        typeFilter={typeFilter}
                        onTypeChange={setTypeFilter}
                        deptFilter={deptFilter}
                        onDeptChange={setDeptFilter}
                        departments={departmentChips}
                      />
                      {filteredApps.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">
                          Nenhuma aplicação corresponde aos filtros.
                        </p>
                      ) : (
                        <GridNavigator className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                          {filteredApps.map((app) => (
                            <ApplicationCardHome
                              key={app.id}
                              app={app}
                              variant="featured"
                            />
                          ))}
                        </GridNavigator>
                      )}
                    </>
                  )}
                </section>
              </div>

              <aside
                className="w-full lg:w-72 xl:w-80 shrink-0 lg:self-start order-1 lg:order-2 animate-slide-in-up opacity-0"
                style={{ animationDelay: "20ms" }}
              >
                <div className="rounded-lg border border-primary/20 bg-linear-to-br from-primary/5 via-card to-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <IGRPIcon iconName="Star" className="size-4 text-warning" />
                    <h2 className="text-sm font-semibold tracking-tight">
                      Favoritos
                    </h2>
                    {!favoritesError && favoriteApps.length > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {favoriteApps.length}
                      </Badge>
                    )}
                  </div>
                  {favoritesError ? (
                    <InlineError
                      message="Não foi possível carregar os favoritos."
                      onRetry={() => refetchFavorites()}
                    />
                  ) : favoriteApps.length === 0 ? (
                    <div className="flex flex-col items-center text-center gap-2 py-4">
                      <div className="size-10 rounded-full bg-warning/10 flex items-center justify-center">
                        <IGRPIcon
                          iconName="Star"
                          className="size-5 text-warning/70"
                        />
                      </div>
                      <p className="text-sm font-medium">Sem favoritos</p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        Toque na estrela de uma aplicação para a fixar aqui.
                      </p>
                    </div>
                  ) : (
                    /* Pills container — caps at ~5 visible items (≈200px), scrolls if more. */
                    <ScrollableFavorites count={favoriteApps.length}>
                      {favoriteApps.map((app) => (
                        <RecentPill key={app.id} app={app} />
                      ))}
                    </ScrollableFavorites>
                  )}
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * Wraps a card grid and adds arrow-key navigation between focusable children
 * (Link/anchor elements). Tab still leaves the grid; only arrows + Home/End
 * move focus within it. Columns are inferred from the current visual layout
 * via grid bounding-rect math so it works with any responsive grid.
 */
function GridNavigator({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const getFocusables = () => {
    const root = ref.current;
    if (!root) return [];
    return Array.from(
      root.querySelectorAll<HTMLElement>(
        ":scope > a[href], :scope > [tabindex='0']",
      ),
    );
  };

  const inferColumnCount = () => {
    const items = getFocusables();
    if (items.length <= 1) return 1;
    const firstTop = items[0].getBoundingClientRect().top;
    let cols = 0;
    for (const el of items) {
      if (Math.abs(el.getBoundingClientRect().top - firstTop) < 1) cols++;
      else break;
    }
    return Math.max(cols, 1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const items = getFocusables();
    if (items.length === 0) return;
    const current = document.activeElement as HTMLElement | null;
    const idx = current ? items.indexOf(current) : -1;
    if (idx === -1 && !["Home", "End"].includes(e.key)) return;

    let next = idx;
    const cols = inferColumnCount();
    switch (e.key) {
      case "ArrowRight":
        next = Math.min(items.length - 1, idx + 1);
        break;
      case "ArrowLeft":
        next = Math.max(0, idx - 1);
        break;
      case "ArrowDown":
        next = Math.min(items.length - 1, idx + cols);
        break;
      case "ArrowUp":
        next = Math.max(0, idx - cols);
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = items.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    items[next]?.focus();
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: keyboard nav delegates focus to child <a> elements
    <div ref={ref} className={className} onKeyDown={onKeyDown}>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-foreground border-border/60 hover:border-primary/40 hover:bg-primary/5",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilterChipRow({
  typeFilter,
  onTypeChange,
  deptFilter,
  onDeptChange,
  departments,
}: {
  typeFilter: TypeFilter;
  onTypeChange: (t: TypeFilter) => void;
  deptFilter: string | null;
  onDeptChange: (d: string | null) => void;
  departments: { code: string; name: string }[];
}) {
  const hasFilters = typeFilter !== "ALL" || deptFilter !== null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      <Chip active={typeFilter === "ALL"} onClick={() => onTypeChange("ALL")}>
        Todas
      </Chip>
      <Chip
        active={typeFilter === "INTERNAL"}
        onClick={() => onTypeChange("INTERNAL")}
      >
        Internas
      </Chip>
      <Chip
        active={typeFilter === "EXTERNAL"}
        onClick={() => onTypeChange("EXTERNAL")}
      >
        Externas
      </Chip>
      {departments.length > 0 && (
        <span aria-hidden className="mx-1 h-4 w-px bg-border" />
      )}
      {departments.map((d) => (
        <Chip
          key={d.code}
          active={deptFilter === d.code}
          onClick={() => onDeptChange(deptFilter === d.code ? null : d.code)}
        >
          {d.name}
        </Chip>
      ))}
      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            onTypeChange("ALL");
            onDeptChange(null);
          }}
          className="ml-auto text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline cursor-pointer"
        >
          Limpar filtros
        </button>
      )}
    </div>
  );
}

function SectionHeader({
  iconName,
  label,
  count,
  tone = "primary",
  collapsible,
  collapsed,
  onToggle,
}: {
  iconName?: string;
  label: string;
  count?: number;
  tone?: "primary" | "muted";
  collapsible?: boolean;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const isPrimary = tone === "primary";
  const heading = (
    <>
      {iconName && (
        <span
          className={[
            "inline-flex size-7 items-center justify-center rounded-md transition-colors",
            isPrimary
              ? "bg-primary/10 text-primary"
              : "bg-muted text-muted-foreground",
            collapsible ? "group-hover:bg-primary/15" : "",
          ].join(" ")}
        >
          <IGRPIcon iconName={iconName} className="size-3.5" />
        </span>
      )}
      <h2 className="text-sm font-semibold tracking-tight text-foreground">
        {label}
      </h2>
      {typeof count === "number" && (
        <Badge
          variant="secondary"
          className="text-[10px] font-medium tabular-nums"
        >
          {count}
        </Badge>
      )}
      {collapsible && (
        <IGRPIcon
          iconName="ChevronDown"
          className={[
            "size-4 text-muted-foreground transition-transform duration-200",
            collapsed ? "-rotate-90" : "",
          ].join(" ")}
        />
      )}
    </>
  );

  const dividerLine = (
    <span
      aria-hidden
      className={[
        "ml-3 flex-1 h-px",
        isPrimary
          ? "bg-linear-to-r from-primary/30 to-transparent"
          : "bg-linear-to-r from-border to-transparent",
      ].join(" ")}
    />
  );

  if (collapsible && onToggle) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={!collapsed}
            className="group flex items-center gap-3 -ml-1 pl-1 pr-2 py-0.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
          >
            {heading}
          </button>
          {dividerLine}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        {heading}
        {dividerLine}
      </div>
    </div>
  );
}
