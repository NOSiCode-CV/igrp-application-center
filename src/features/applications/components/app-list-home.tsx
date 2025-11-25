"use client";

import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ApplicationCardHOme } from "./app-card-home";
import { useCurrentUserApplications } from "@/features/users/use-users";
import { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

export function ApplicationsListHome() {
  const { data: applications, isLoading, error } = useCurrentUserApplications();

  if (isLoading && !error)
    return <AppCenterLoading descrption="Carregando aplicações..." />;

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

  const filteredApps = applications;
  const activeApps = filteredApps
    .filter((app) => app.code !== "APP_IGRP_CENTER")
    .slice(0, 6);

  return (
    <div className="grid gap-4 grid-cols-none sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5">
      {activeApps
        .filter((app: ApplicationDTO) => app.code !== "VAdy")
        .map((app: ApplicationDTO) => (
          <ApplicationCardHOme key={app.id} app={app} />
        ))}
    </div>
  );
}
