"use client";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { ArrowRight } from "lucide-react";

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

export function RecentlyAccessed() {
  const { data: recent = [] } = useGetCurrentUserRecentApplications();
  const { data: favorites = [] } = useCurrentUserFavoriteApplications();
  const addFav = useAddCurrentUserFavoriteApplication();
  const removeFav = useRemoveCurrentUserFavoriteApplication();

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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recently accessed
        </h2>
        <button
          type="button"
          onClick={scrollToCatalog}
          className="flex h-8 items-center gap-1.5 rounded-lg bg-primary-subtle px-2.5 text-xs font-semibold text-primary-subtle-foreground transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all applications
          <ArrowRight size={13} />
        </button>
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
           than its neighbours. */
        <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 custom-scrollbar">
          {recent.slice(0, 8).map((app) => (
            <div key={app.code} className="w-69 shrink-0">
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
