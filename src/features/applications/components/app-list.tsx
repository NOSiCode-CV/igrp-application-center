"use client";

import {
  IGRPButtonPrimitive,
  IGRPDropdownMenuCheckboxItemPrimitive,
  IGRPDropdownMenuContentPrimitive,
  IGRPDropdownMenuItemPrimitive,
  IGRPDropdownMenuPrimitive,
  IGRPDropdownMenuSeparatorPrimitive,
  IGRPDropdownMenuTriggerPrimitive,
  IGRPIcon,
  IGRPInputPrimitive,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";
import { ButtonLink } from "@/components/button-link";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { PageHeader } from "@/components/page-header";
import { ApplicationCard } from "@/features/applications/components/app-card";
import { useApplications } from "@/features/applications/use-applications";
import { ROUTES, STATUS_OPTIONS } from "@/lib/constants";

export function ApplicationList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const { data: applications, isLoading, error } = useApplications();

  if (isLoading && !error)
    return <AppCenterLoading descrption="Carregando aplicações..." />;

  if (error) throw error;

  if (!applications || applications.length === 0) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      />
    );
  }

  const allApps = applications.filter((app) => app.type !== "SYSTEM");
  const filteredApps = allApps.filter((app) => {
    const matchesSearch =
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter.length === 0 || statusFilter.includes(app.status);

    return matchesSearch && matchesStatus;
  });

  const appEmpty = allApps.length === 0;

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <PageHeader
        title="Gerir Aplicações"
        description="Gerir Menus de Aplicações."
        showActions
      >
        {!appEmpty && (
          <ButtonLink
            href={ROUTES.NEW_APPS}
            label="Nova Aplicação"
            icon="Grid2x2Plus"
          />
        )}
      </PageHeader>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
          <div className="relative w-full max-w-sm">
            <IGRPIcon
              iconName="Search"
              className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
              strokeWidth={2}
            />
            <IGRPInputPrimitive
              type="search"
              placeholder="Pesquisar aplicações..."
              className="w-full bg-background pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={appEmpty}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <IGRPDropdownMenuPrimitive>
              <IGRPDropdownMenuTriggerPrimitive asChild>
                <IGRPButtonPrimitive
                  variant="outline"
                  className="gap-2"
                  disabled={appEmpty}
                >
                  <IGRPIcon iconName="ListFilter" strokeWidth={2} />
                  Estado {statusFilter.length > 0 && `(${statusFilter.length})`}
                </IGRPButtonPrimitive>
              </IGRPDropdownMenuTriggerPrimitive>
              <IGRPDropdownMenuContentPrimitive align="start" className="w-40">
                <IGRPDropdownMenuSeparatorPrimitive />
                {STATUS_OPTIONS.map(({ value, label }) => (
                  <IGRPDropdownMenuCheckboxItemPrimitive
                    key={value}
                    checked={statusFilter.includes(value)}
                    onCheckedChange={(checked) => {
                      setStatusFilter(
                        checked
                          ? [...statusFilter, value]
                          : statusFilter.filter((s) => s !== value),
                      );
                    }}
                  >
                    {label}
                  </IGRPDropdownMenuCheckboxItemPrimitive>
                ))}
                {statusFilter.length > 0 && (
                  <>
                    <IGRPDropdownMenuSeparatorPrimitive />
                    <IGRPDropdownMenuItemPrimitive
                      onClick={() => setStatusFilter([])}
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    >
                      <IGRPIcon iconName="X" className="mr-1" strokeWidth={2} />
                      Limpar
                    </IGRPDropdownMenuItemPrimitive>
                  </>
                )}
              </IGRPDropdownMenuContentPrimitive>
            </IGRPDropdownMenuPrimitive>
          </div>
        </div>

        {filteredApps.length === 0 && allApps.length > 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            Nenhuma aplicação encontrada. Tente ajustar a sua pesquisa ou
            filtros.
          </div>
        ) : allApps.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border border-muted-foreground/30 rounded-md">
            <p className="mb-4">Nenhuma aplicação encontrada.</p>
            <ButtonLink
              href={ROUTES.NEW_APPS}
              label="Criar Nova Aplicação"
              icon="Grid2x2Plus"
              variant="outline"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card *:data-[slot=card]:bg-gradient-to-t">
            {filteredApps.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
