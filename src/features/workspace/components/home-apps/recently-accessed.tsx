"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";
import {
  APP_CATALOG_SECTION_ID,
  excludeCurrentApp,
  getLastOpenedLabel,
} from "@/features/workspace/lib/app-utils";

import { AppTileCard } from "./app-tile-card";

const MAX_RECENT = 4;

function scrollToCatalog() {
  document
    .getElementById(APP_CATALOG_SECTION_ID)
    ?.scrollIntoView({ behavior: scrollBehavior(), block: "start" });
}

function scrollBehavior(): ScrollBehavior {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}

function useRailScroll(itemCount: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || itemCount === 0) return;

    const update = () => {
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
    data: allRecent = [],
    isError,
    error,
    refetch,
  } = useGetCurrentUserRecentApplications();

  if (isError) console.error("[RecentlyAccessed] query failed", error);
  const { data: favorites = [] } = useCurrentUserFavoriteApplications();
  const addFav = useAddCurrentUserFavoriteApplication();
  const removeFav = useRemoveCurrentUserFavoriteApplication();

  const recent = excludeCurrentApp(allRecent);
  const visible = recent.slice(0, MAX_RECENT);
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
          {!isError && (canScrollPrev || canScrollNext) && (
            <div className="flex items-center gap-1.5">
              <IGRPButton
                variant="outline"
                size="icon"
                iconName="ChevronLeft"
                onClick={() => scrollByPage(-1)}
                disabled={!canScrollPrev}
                aria-label="Mostrar aplicações anteriores"
              />
              <IGRPButton
                variant="outline"
                size="icon"
                iconName="ChevronRight"
                onClick={() => scrollByPage(1)}
                disabled={!canScrollNext}
                aria-label="Mostrar aplicações seguintes"
              />
            </div>
          )}
        </div>
      </div>

      {isError ? (
        <InlineError
          title="Não foi possível carregar as aplicações recentes."
          message="Esta lista está temporariamente indisponível. Tudo o resto continua a funcionar."
          onRetry={() => refetch()}
        />
      ) : recent.length === 0 ? (
        <div className="flex flex-col items-start gap-2 rounded-xl border border-dashed border-border bg-muted px-4 py-5">
          <p className="text-sm text-secondary-foreground">
            As aplicações que abrir aparecem aqui, para voltar a elas
            rapidamente.
          </p>
          <IGRPButton size="sm" onClick={scrollToCatalog}>
            Explorar aplicações
            <IGRPIcon iconName="ArrowRight" size={13} />
          </IGRPButton>
        </div>
      ) : (
        <div
          ref={ref}
          className="flex items-stretch gap-3.5 overflow-x-auto pb-1 scrollbar-hidden snap-x snap-proximity"
        >
          {visible.map((app) => (
            <div
              key={app.code}
              className="basis-69 grow shrink-0 max-w-[85%] snap-start"
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
