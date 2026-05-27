"use client";

import {
  Badge,
  IGRPIcon,
  IGRPInputText,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { InlineError } from "@/components/inline-error";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import {
  useCurrentUserApplications,
  useCurrentUserFavoriteApplications,
  useGetCurrentUserRecentApplications,
} from "@/features/users/use-users";
import { ApplicationCardHome } from "./app-card-home";

export function ApplicationsListHome() {
  const [search, setSearch] = useState("");
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

  // Block the full page only on the primary (page-critical) query.
  if (isLoading)
    return <AppCenterLoading description="Carregando aplicações..." />;

  // Only the primary query failure escalates to the route error boundary.
  if (error) throw error;

  if (!applications || applications.length === 0) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      >
        Parece que você ainda não tem aplicações disponíveis.
      </AppCenterNotFound>
    );
  }

  const activeApps = applications
    .filter((app: ApplicationDTO) => app.status === "ACTIVE")
    .filter((app: ApplicationDTO) => app.code !== "APP_IGRP_CENTER")
    .filter((app: ApplicationDTO) =>
      search ? app.name?.toLowerCase().includes(search.toLowerCase()) : true,
    );

  const favoriteApps = favoritesError
    ? []
    : activeApps.filter((app: ApplicationDTO) =>
        favorites?.some((fav) => fav.id === app.id),
      );

  const recentApps = recentError
    ? []
    : activeApps.filter((app: ApplicationDTO) =>
        recent?.some((rec) => rec.id === app.id),
      );

  return (
    <>
      {favoritesError ? (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <IGRPIcon iconName="Star" className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Favoritos</h2>
          </div>
          <InlineError
            message="Não foi possível carregar os favoritos."
            onRetry={() => refetchFavorites()}
          />
        </div>
      ) : (
        favoriteApps.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <IGRPIcon iconName="Star" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Favoritos
              </h2>
              <Badge variant="secondary" className="text-xs">
                {favoriteApps.length}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {favoriteApps.map((app: ApplicationDTO) => (
                <ApplicationCardHome key={app.id} app={app} />
              ))}
            </div>
          </div>
        )
      )}

      {recentError ? (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <IGRPIcon iconName="Clock" className="size-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Recentes</h2>
          </div>
          <InlineError
            message="Não foi possível carregar os recentes."
            onRetry={() => refetchRecent()}
          />
        </div>
      ) : (
        recentApps.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <IGRPIcon iconName="Clock" className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Recentes
              </h2>
              <Badge variant="secondary" className="text-xs">
                {recentApps.length}
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
              {recentApps.map((app: ApplicationDTO) => (
                <ApplicationCardHome key={app.id} app={app} />
              ))}
            </div>
          </div>
        )
      )}

      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Todas as Aplicações
        </h2>
        <Badge variant="secondary" className="text-xs">
          {activeApps.length}
        </Badge>
      </div>

      <div className="mb-6">
        <IGRPInputText
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar aplicações..."
          className="h-9 text-sm w-full sm:w-64 md:w-72"
          iconName="Search"
          showIcon
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4">
        {activeApps.map((app: ApplicationDTO) => (
          <ApplicationCardHome key={app.id} app={app} />
        ))}
      </div>
    </>
  );
}
