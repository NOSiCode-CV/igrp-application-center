"use client";

import { useDeferredValue, useMemo } from "react";

import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { ApplicationCard } from "./app-card";

export function filterApplications(
  apps: ApplicationDTO[],
  searchTerm: string,
  statusFilter: string[],
): ApplicationDTO[] {
  const needle = searchTerm.toLowerCase();
  return apps.filter((app) => {
    const matchesSearch =
      !needle ||
      app.name?.toLowerCase().includes(needle) ||
      app.description?.toLowerCase().includes(needle) ||
      app.code?.toLowerCase().includes(needle);
    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(app.status);
    return matchesSearch && matchesStatus;
  });
}

interface ApplicationsGridProps {
  applications: ApplicationDTO[];
  searchTerm: string;
  statusFilter: string[];
  onEdit: (app: ApplicationDTO) => void;
  emptyState: React.ReactNode;
}

export function ApplicationsGrid({
  applications,
  searchTerm,
  statusFilter,
  onEdit,
  emptyState,
}: ApplicationsGridProps) {
  const deferredSearch = useDeferredValue(searchTerm);
  const filtered = useMemo(
    () => filterApplications(applications, deferredSearch, statusFilter),
    [applications, deferredSearch, statusFilter],
  );

  if (applications.length === 0) return <>{emptyState}</>;

  if (filtered.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        Nenhuma aplicação encontrada. Tente ajustar a sua pesquisa ou filtros.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filtered.map((app) => (
        <ApplicationCard key={app.id} app={app} onEdit={onEdit} />
      ))}
    </div>
  );
}
