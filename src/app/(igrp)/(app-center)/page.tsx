import { ButtonLink } from "@/components/button-link";
import { PageHeader } from "@/components/page-header";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
import { ROUTES } from "@/lib/constants";

// TODO: use the settings from the backend
// const appName = process.env.IGRP_APP_NAME_DESCRIPTION || 'IGRP';

export default function Home() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader title="Bem-vindo ao IGRP" showActions>
        <ButtonLink
          href={ROUTES.APPLICATIONS}
          label="Gerir Aplicação"
          icon="AppWindow"
          variant="outline"
        />

       
      </PageHeader>

      <ApplicationsListHome />
    </div>
  );
}
