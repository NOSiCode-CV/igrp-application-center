"use client";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

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

  if (recent.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Recently Accessed
        </span>
        <button
          type="button"
          onClick={() =>
            document
              .getElementById(APP_CATALOG_SECTION_ID)
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="text-xs text-primary hover:underline"
        >
          View all catalog →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-muted">
        {recent.slice(0, 8).map((app) => (
          <div key={app.code} className="min-w-[220px]">
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
    </section>
  );
}
