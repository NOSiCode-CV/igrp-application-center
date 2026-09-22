"use client";

import { useState } from "react";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { InlineError } from "@/components/inline-error";
import { PageHeader } from "@/components/page-header";
import { useApplications } from "@/features/applications/use-applications";

import { AppListSkeleton } from "./app-list-skeleton";
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

  if (isLoading) return <AppListSkeleton />;

  if (error)
    return (
      <InlineError
        title="Não foi possível carregar as aplicações."
        message="Tente novamente. Se o problema persistir, contacte o suporte."
        onRetry={() => refetch()}
      />
    );

  const allApps = applications ?? [];
  const appEmpty = allApps.length === 0;

  /* A plain loop, not `useMemo`: this sits after the loading/error early
     returns, where a hook would break the rules of hooks — and counting a
     list this size costs nothing. */
  const statusCounts: Record<string, number> = {};
  for (const app of allApps) {
    const key = String(app.status ?? "");
    statusCounts[key] = (statusCounts[key] ?? 0) + 1;
  }

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter([]);
  };

  const emptyState = (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
      <p className="font-medium text-foreground">Ainda não há aplicações</p>
      <p className="text-sm text-muted-foreground max-w-md">
        As aplicações são o que os utilizadores abrem a partir da página
        inicial. Crie a primeira para a poder associar a departamentos e perfis.
      </p>
      <IGRPButton
        variant="outline"
        showIcon
        iconName="Grid2x2Plus"
        onClick={openCreate}
      >
        Nova Aplicação
      </IGRPButton>
    </div>
  );

  return (
    /* No `animate-fade-in`: the page fading in on every navigation is motion
       that reports nothing — the content did not change, it arrived. */
    /* Vertical rhythm shared with `/settings/users`, so the two list pages do
       not sit at different heights when you move between them:
         gap-6  page header -> content
         gap-4  controls (toolbar / tabs) -> results
         gap-3  result count -> grid (see `applications-grid.tsx`)
       This page used gap-10/gap-6 and users used gap-5; the header floated
       twice as far from its content on one as on the other. */
    <div className="flex flex-col gap-6">
      {/* "Gestão de Aplicações", the same words as the card that opens this
          page, so the label promises exactly what the destination delivers. */}
      <PageHeader
        title="Gestão de Aplicações"
        description="Registe novas aplicações e faça a gestão das existentes."
        showActions
      >
        <IGRPButton showIcon iconName="Grid2x2Plus" onClick={openCreate}>
          Nova Aplicação
        </IGRPButton>
      </PageHeader>

      <div className="flex flex-col gap-4">
        <ApplicationsToolbar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          disabled={appEmpty}
          statusCounts={statusCounts}
        />

        <ApplicationsGrid
          applications={allApps}
          searchTerm={searchTerm}
          statusFilter={statusFilter}
          onEdit={openEdit}
          emptyState={emptyState}
          onClearFilters={clearFilters}
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
