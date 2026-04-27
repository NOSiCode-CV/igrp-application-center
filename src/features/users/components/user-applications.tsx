import type {
  ApplicationDTO,
  IGRPUserDTO,
} from "@igrp/platform-access-management-client-ts";
import { AppCenterLoading } from "@/components/loading";
import { ApplicationCard } from "@/features/applications/components/app-card";
import { useCurrentUserApplications, useUserApplications } from "../use-users";

export default function UserApplications({ user }: { user?: IGRPUserDTO }) {
  const { data: currentUserApps, isLoading: isLoadingMyApps } =
    useCurrentUserApplications({ enabled: !user });
  const { data: userApps, isLoading } = useUserApplications(user?.id ?? 0, {
    enabled: !!user?.id,
  });

  const apps = user ? userApps : currentUserApps;

  if (isLoadingMyApps || isLoading) {
    return <AppCenterLoading descrption="Carregando aplicações..." />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {apps?.map((app: ApplicationDTO) => (
        <ApplicationCard key={app.id} app={app} />
      ))}

      {apps?.length === 0 && (
        <div className="w-full">
          <div className="text-primary">
            <p className="text-sm">Nenhum aplicação atribuida</p>
          </div>
        </div>
      )}
    </div>
  );
}
