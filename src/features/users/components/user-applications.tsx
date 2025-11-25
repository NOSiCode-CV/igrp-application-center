import React from "react";
import { useCurrentUserApplications, useUserApplications } from "../use-users";
import { AppCenterLoading } from "@/components/loading";
import { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { ApplicationCard } from "@/features/applications/components/app-card";

export default function UserApplications({ user }: { user?: IGRPUserDTO }) {
  const { data: currentUserApps, isLoading: isLoadingMyApps } =
    useCurrentUserApplications({ enabled: !user });
  const { data: userApps, isLoading } = useUserApplications(user?.id!, {
    enabled: !!user,
  });

  const apps = user ? userApps : currentUserApps;

  if (isLoadingMyApps || isLoading) {
    return <AppCenterLoading descrption="Carregando aplicações..." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps?.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  );
}
