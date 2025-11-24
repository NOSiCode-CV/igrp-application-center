"use client";

import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ApplicationCardHOme } from "./app-card-home";
import { useCurrentUserApplications } from "@/features/users/use-users";

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
        Clique em &nbsp;
        <span className="font-semibold">“Gerir Aplicação”</span>
      </AppCenterNotFound>
    );
  }

  const filteredApps = applications;
  const activeApps = filteredApps
    .filter((app) => app.status === "ACTIVE")
    .slice(0, 6);

  return (
    <div className="grid gap-4 grid-cols-3 md:grid-cols-5">
      {activeApps.map((app) => (
        <ApplicationCardHOme key={app.id} app={app} />
      ))}
    </div>
  );
}
