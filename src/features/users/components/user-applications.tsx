"use client";

import { useMemo, useState } from "react";

import { IGRPIcon, Input } from "@igrp/igrp-framework-react-design-system";
import type {
  ApplicationDTO,
  IGRPUserDTO,
} from "@igrp/platform-access-management-client-ts";

import { AppCenterLoading } from "@/components/loading";
import { ApplicationCard } from "@/features/applications/components/app-card";

import { useCurrentUserApplications, useUserApplications } from "../use-users";

export default function UserApplications({ user }: { user?: IGRPUserDTO }) {
  const [search, setSearch] = useState("");

  const { data: currentUserApps, isLoading: isLoadingMyApps } =
    useCurrentUserApplications({ enabled: !user });
  const { data: userApps, isLoading } = useUserApplications(user?.id ?? "", {
    enabled: !!user?.id,
  });

  const apps = user ? userApps : currentUserApps;
  const loading = isLoadingMyApps || isLoading;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return apps ?? [];
    return (apps ?? []).filter((app) =>
      [app.name, app.code, app.description]
        .filter((field): field is string => Boolean(field))
        .some((field) => field.toLowerCase().includes(query)),
    );
  }, [apps, search]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-sm">
        <IGRPIcon
          iconName="Search"
          aria-hidden="true"
          className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="search"
          aria-label="Pesquisar aplicação"
          spellCheck={false}
          placeholder="Pesquisar aplicação…"
          className="w-full bg-background pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
        />
      </div>

      {loading ? (
        <AppCenterLoading description="Carregando aplicações…" />
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {search.trim()
            ? "Nenhuma aplicação corresponde à pesquisa."
            : "Nenhuma aplicação atribuída."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((app: ApplicationDTO) => (
            <ApplicationCard key={app.id} app={app} />
          ))}
        </div>
      )}
    </div>
  );
}
