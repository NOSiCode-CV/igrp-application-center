"use client"

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts"
import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users"
import { AppTileCard } from "./app-tile-card"

export function RecentlyAccessed() {
  const { data: recent = [] } = useGetCurrentUserRecentApplications()
  const { data: favorites = [] } = useCurrentUserFavoriteApplications()
  const addFav = useAddCurrentUserFavoriteApplication()
  const removeFav = useRemoveCurrentUserFavoriteApplication()

  const favCodes = new Set(favorites.map((f) => f.code))

  function handleToggle(app: ApplicationDTO, isFavorite: boolean) {
    if (isFavorite) {
      removeFav.mutate(app.code)
    } else {
      addFav.mutate({ applicationCode: app.code, app })
    }
  }

  if (recent.length === 0) return null

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Recently Accessed
        </span>
        <button type="button" className="text-xs text-indigo-600 hover:underline">
          View all catalog →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-200">
        {recent.slice(0, 8).map((app) => (
          <div key={app.code} className="min-w-[180px]">
            <AppTileCard
              app={app}
              isFavorite={favCodes.has(app.code)}
              onToggleFavorite={handleToggle}
              lastOpenedLabel="Recently opened"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
