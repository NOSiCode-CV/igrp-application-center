"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";

import {
  APP_CATALOG_SECTION_ID,
  getLastOpenedLabel,
} from "../../lib/app-utils";
import { AppTileCard } from "./app-tile-card";

function scrollToCatalog() {
  document
    .getElementById(APP_CATALOG_SECTION_ID)
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

/**
 * Tracks how far a horizontal rail can still travel, so the prev/next controls
 * can disable themselves at each end and disappear entirely when everything
 * already fits. Mirrors what `IGRPTabs` does for its overflowing tab strip.
 */
function useRailScroll(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    // itemCount is read here on purpose: the rail is unmounted when empty, and
    // re-running on a count change is what re-measures scrollWidth (the rail's
    // own box does not resize when cards are added, so ResizeObserver alone
    // would miss it).
    if (!el || itemCount === 0) return;

    const update = () => {
      // 1px of slack: fractional layout widths mean scrollLeft rarely lands
      // exactly on 0 or on the maximum.
      const remaining = el.scrollWidth - el.clientWidth - el.scrollLeft;
      setCanScrollPrev(el.scrollLeft > 1);
      setCanScrollNext(remaining > 1);
    };

    update();
    el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [itemCount]);

  const scrollByPage = useCallback((direction: -1 | 1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({
      left: direction * el.clientWidth * 0.8,
      behavior: scrollBehavior(),
    });
  }, []);

  return { ref, canScrollPrev, canScrollNext, scrollByPage };
}

export function RecentlyAccessed() {
  const { data: recent = [] } = useGetCurrentUserRecentApplications();
  const { data: favorites = [] } = useCurrentUserFavoriteApplications();
  const addFav = useAddCurrentUserFavoriteApplication();
  const removeFav = useRemoveCurrentUserFavoriteApplication();

  const visible = recent.slice(0, 8);
  const { ref, canScrollPrev, canScrollNext, scrollByPage } = useRailScroll(
    visible.length,
  );

  const favCodes = new Set(favorites.map((f) => f.code));

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code);
    } else {
      addFav.mutate({ applicationCode: app.code, app });
    }
  }

  /* size-8 keeps the controls as quiet as the "View all" button next to them;
     the `after:` overlay lifts the hit target to ~44px without drawing a
     bigger button — the same trick the catalogue's favourite star uses. */
  const controlClass =
    "relative flex size-8 items-center justify-center rounded-lg border border-border bg-card text-secondary-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 after:absolute after:-inset-1.5 after:content-['']";

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="min-w-0 truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recently accessed
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          {/* Nothing to page through when the row already fits — dead arrows
              would just be noise. */}
          {(canScrollPrev || canScrollNext) && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollByPage(-1)}
                disabled={!canScrollPrev}
                aria-label="Show previous applications"
                className={controlClass}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollByPage(1)}
                disabled={!canScrollNext}
                aria-label="Show next applications"
                className={controlClass}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={scrollToCatalog}
            className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-primary-subtle px-2.5 text-xs font-semibold text-primary-subtle-foreground transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all applications
            <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {recent.length === 0 ? (
        /* Previously this returned null, so a first-time user lost the whole
           section with no explanation of what would eventually fill it. */
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted px-4 py-5">
          <p className="text-sm text-secondary-foreground">
            Applications you open will appear here for quick return.
          </p>
          <button
            type="button"
            onClick={scrollToCatalog}
            className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Browse applications
            <ArrowRight size={13} />
          </button>
        </div>
      ) : (
        /* `items-stretch` keeps one height across the row — a longer relative
           label ("Opened 11 weeks ago") used to wrap and drag its card taller
           than its neighbours. The scrollbar is hidden in favour of the header
           controls; snapping stops a paged scroll from parking mid-card. */
        <div
          ref={ref}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-1 scrollbar-hidden snap-x snap-proximity"
        >
          {visible.map((app) => (
            <div
              key={app.code}
              className="w-69 max-w-[85%] shrink-0 snap-start"
            >
              <AppTileCard
                app={app}
                isFavorite={favCodes.has(app.code)}
                onToggleFavorite={handleToggle}
                lastOpenedLabel={getLastOpenedLabel(app.lastAccess)}
                compact
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
