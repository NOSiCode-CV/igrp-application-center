"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

import { InlineError } from "@/components/inline-error";
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
  const {
    data: recent = [],
    isError,
    error,
    refetch,
  } = useGetCurrentUserRecentApplications();
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

  return (
    <section>
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="min-w-0 truncate text-sm font-semibold text-foreground">
          Acedidas recentemente
        </h2>

        <div className="flex shrink-0 items-center gap-2">
          {/* Nothing to page through when the row already fits — dead arrows
              would just be noise. */}
          {!isError && (canScrollPrev || canScrollNext) && (
            <div className="flex items-center gap-1.5">
              <IGRPButton
                variant="outline"
                size="icon"
                onClick={() => scrollByPage(-1)}
                disabled={!canScrollPrev}
                aria-label="Mostrar aplicações anteriores"
              >
                <ChevronLeft size={16} />
              </IGRPButton>
              <IGRPButton
                variant="outline"
                size="icon"
                onClick={() => scrollByPage(1)}
                disabled={!canScrollNext}
                aria-label="Mostrar aplicações seguintes"
              >
                <ChevronRight size={16} />
              </IGRPButton>
            </div>
          )}
        </div>
      </div>

      {isError ? (
        /* A convenience rail, so this stays quiet and offers a retry rather
           than rendering as "you have opened nothing", which is what the
           `data = []` default used to claim on every failed request. */
        <InlineError
          title="Não foi possível carregar as aplicações recentes."
          message={
            error?.message ??
            "Esta lista está temporariamente indisponível. Tudo o resto continua a funcionar."
          }
          onRetry={() => refetch()}
        />
      ) : recent.length === 0 ? (
        /* Previously this returned null, so a first-time user lost the whole
           section with no explanation of what would eventually fill it. */
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted px-4 py-5">
          <p className="text-sm text-secondary-foreground">
            As aplicações que abrir aparecem aqui, para voltar a elas
            rapidamente.
          </p>
          <IGRPButton size="sm" onClick={scrollToCatalog}>
            Explorar aplicações
            <ArrowRight size={13} />
          </IGRPButton>
        </div>
      ) : (
        /* `items-stretch` keeps one height across the row — a longer relative
           label ("Aberta há 11 semanas") used to wrap and drag its card taller
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
