"use client";

import { useDeferredValue, useMemo } from "react";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";
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

/** "1 aplicação" / "4 aplicações" — the count is generated in code, so it owes
 *  the same pt-PT agreement as any hand-written string. */
function countLabel(shown: number, total: number): string {
  const noun = shown === 1 ? "aplicação" : "aplicações";
  if (shown === total) return `${total} ${noun}`;
  return `A mostrar ${shown} de ${total} ${total === 1 ? "aplicação" : "aplicações"}`;
}

interface ApplicationsGridProps {
  applications: ApplicationDTO[];
  searchTerm: string;
  statusFilter: string[];
  onEdit: (app: ApplicationDTO) => void;
  emptyState: React.ReactNode;
  onClearFilters?: () => void;
}

export function ApplicationsGrid({
  applications,
  searchTerm,
  statusFilter,
  onEdit,
  emptyState,
  onClearFilters,
}: ApplicationsGridProps) {
  const deferredSearch = useDeferredValue(searchTerm);
  const filtered = useMemo(
    () => filterApplications(applications, deferredSearch, statusFilter),
    [applications, deferredSearch, statusFilter],
  );

  const hasFilters =
    deferredSearch.trim().length > 0 || statusFilter.length > 0;

  if (applications.length === 0) return <>{emptyState}</>;

  /* The count and the results share one wrapper so the live region is in the
     DOM before a filter changes — a region mounted at the same moment as its
     text is not announced. It is also the only thing that tells a keyboard or
     screen-reader user that typing in the search box did anything. */
  return (
    <div className="flex flex-col gap-3">
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {countLabel(filtered.length, applications.length)}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <p className="font-medium text-foreground">
            Nenhuma aplicação corresponde aos filtros
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Ajuste a pesquisa ou o estado para ver as aplicações registadas.
          </p>
          {hasFilters && onClearFilters && (
            <IGRPButton
              variant="outline"
              showIcon
              iconName="X"
              onClick={onClearFilters}
            >
              Limpar filtros
            </IGRPButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((app) => (
            <ApplicationCard key={app.id} app={app} onEdit={onEdit} />
          ))}
        </div>
      )}
    </div>
  );
}
