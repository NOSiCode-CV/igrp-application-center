"use client";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { InlineError } from "@/components/inline-error";
import { AppCenterLoading } from "@/components/loading";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/features/applications/use-applications";
import { ApplicationFormDialog } from "./application-form-dialog";
import { ApplicationsGrid } from "./applications-grid";
import { ApplicationsToolbar } from "./applications-toolbar";

export function ApplicationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ApplicationDTO | undefined>();

  const { data: applications, isLoading, error, refetch } = useApplications();

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (app: ApplicationDTO) => {
    setEditing(app);
    setDialogOpen(true);
  };

  if (isLoading)
    return <AppCenterLoading description="Carregando aplicações..." />;

  if (error)
    return <InlineError message={error.message} onRetry={() => refetch()} />;

  const allApps = applications ?? [];
  const appEmpty = allApps.length === 0;

  const emptyState = (
    <div className="text-center py-8 text-muted-foreground border border-muted-foreground/30 rounded-md">
      <p className="mb-4">Nenhuma aplicação encontrada.</p>
      <IGRPButton
        variant="outline"
        showIcon
        iconName="Grid2x2Plus"
        onClick={openCreate}
      >
        Criar Nova Aplicação
      </IGRPButton>
    </div>
  );

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader title="Gerir Aplicações" description="" showActions>
        <IGRPButton showIcon iconName="Grid2x2Plus" onClick={openCreate}>
          Nova Aplicação
        </IGRPButton>
      </PageHeader>

      <div className="flex flex-col gap-6">
        <ApplicationsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          disabled={appEmpty}
        />

        <ApplicationsGrid
          applications={allApps}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onEdit={openEdit}
          emptyState={emptyState}
        />
      </div>

      <ApplicationFormDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditing(undefined);
        }}
        application={editing}
      />
    </div>
  );
}
