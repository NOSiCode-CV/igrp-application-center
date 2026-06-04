"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import {
  useAddCurrentUserFavoriteApplication,
  useCurrentUserFavoriteApplications,
  useRemoveCurrentUserFavoriteApplication,
} from "@/features/users/use-users";

type Size = "sm" | "md";

export function FavoriteToggle({
  app,
  size = "md",
  className = "",
}: {
  app: ApplicationDTO;
  size?: Size;
  className?: string;
}) {
  const { data: favorites } = useCurrentUserFavoriteApplications();
  const addFavorite = useAddCurrentUserFavoriteApplication();
  const removeFavorite = useRemoveCurrentUserFavoriteApplication();

  const isFavorite = favorites?.some((fav) => fav.id === app.id);

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFavorite) {
      removeFavorite.mutate(app.code);
    } else {
      addFavorite.mutate({ applicationCode: app.code, app });
    }
  };

  const dim = size === "sm" ? "size-7" : "size-8";
  const icon = size === "sm" ? "size-3.5" : "size-4";

  return (
    <button
      onClick={onClick}
      type="button"
      aria-pressed={isFavorite}
      aria-label={
        isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"
      }
      className={[
        "inline-flex items-center justify-center rounded-full",
        dim,
        "border border-transparent transition-all duration-150",
        "hover:bg-warning/10 hover:border-warning/30 hover:scale-110",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning/50",
        "cursor-pointer",
        isFavorite ? "bg-warning/10 border-warning/30" : "bg-background/60",
        className,
      ].join(" ")}
    >
      <IGRPIcon
        iconName="Star"
        className={[
          icon,
          isFavorite ? "fill-warning text-warning" : "text-muted-foreground/80",
        ].join(" ")}
      />
    </button>
  );
}
