import { ApplicationCardHOme } from "@/features/applications/components/app-card-home";
import React from "react";
import { useCurrentUserApplications, useUserApplications } from "../use-users";
import { AppCenterLoading } from "@/components/loading";
import { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

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
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {apps?.map((app) => (
        <ApplicationCardHOme key={app.id} app={app} />
      ))}
    </div>
  );
}
