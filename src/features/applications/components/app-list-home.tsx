"use client";

import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { ApplicationCardHOme } from "./app-card-home";
import { useCurrentUserApplications } from "@/features/users/use-users";
import { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { IGRPBadgePrimitive } from "@igrp/igrp-framework-react-design-system";

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
  const activeApps = filteredApps.filter(
    (app: ApplicationDTO) => app.status === "ACTIVE"
  );

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Todas as Aplicações
        </h2>
        <IGRPBadgePrimitive variant="secondary" className="text-xs">
          {filteredApps.length}
        </IGRPBadgePrimitive>
      </div>
      <div className="grid gap-4 grid-cols-none sm:grid-cols-3 md:grid-cols-3">
        {activeApps
          .filter((app: ApplicationDTO) => app.code !== "VAdy")
          .map((app: ApplicationDTO) => (
            <ApplicationCardHOme key={app.id} app={app} />
          ))}
      </div>
    </>
  );
}
