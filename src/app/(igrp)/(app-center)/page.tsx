import { PageHeader } from "@/components/page-header";
import { ApplicationsListHome } from "@/features/applications/components/app-list-home";
export default function Home() {
  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader
              title="Bem vindo ao IGRP Application Center"
              description="Gerencie suas aplicações de forma fácil e eficiente."
              showActions
            />
      <ApplicationsListHome />
    </div>
  );
}
