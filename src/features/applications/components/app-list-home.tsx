"use client";

import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useApplications } from "@/features/applications/use-applications";
import { ApplicationCard } from "./app-card";

export function ApplicationsListHome() {
  const { data: applications, isLoading, error } = useApplications();

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
        <span className="font-semibold">“Nova Aplicação”</span>
      </AppCenterNotFound>
    );
  }

  const filteredApps = applications;
  const activeApps = filteredApps
    .filter((app) => app.status === "ACTIVE")
    .slice(0, 6);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t">
      {activeApps.map((app) => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  );
}
