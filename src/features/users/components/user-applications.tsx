import { ApplicationCardHOme } from "@/features/applications/components/app-card-home";
import React from "react";
import { useCurrentUserApplications } from "../use-users";
import { AppCenterLoading } from "@/components/loading";

export default function UserApplications() {
  const { data: myApps, isLoading: isLoadingMyApps } =
    useCurrentUserApplications();

  if (isLoadingMyApps) {
    return <AppCenterLoading descrption="Carregando aplicações..." />;
  }

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      {myApps?.map((app) => (
        <ApplicationCardHOme key={app.id} app={app} />
      ))}
    </div>
  );
}
