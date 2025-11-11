"use client";

import {
  IGRPBadgePrimitive,
  IGRPDialogPrimitive,
  IGRPDialogContentPrimitive,
  IGRPDialogHeaderPrimitive,
  IGRPDialogTitlePrimitive,
  IGRPDialogTriggerPrimitive,
  IGRPButton,
} from "@igrp/igrp-framework-react-design-system";
import { useState } from "react";

import { CopyToClipboard } from "@/components/copy-to-clipboard";
import { AppCenterLoading } from "@/components/loading";
import { AppCenterNotFound } from "@/components/not-found";
import { useApplicationByCode } from "@/features/applications/use-applications";
import { MenuList } from "@/features/menus/components/menu-list";
import { getStatusColor } from "@/lib/utils";
import { ApplicationEditForm } from "./app-edit-form";

export function ApplicationDetails({ code }: { code: string }) {
  const { data: app, isLoading, error } = useApplicationByCode(code);
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return <AppCenterLoading descrption="A carregar aplicação..." />;
  }

  if (error) throw error;

  if (!app) {
    return (
      <AppCenterNotFound
        iconName="AppWindow"
        title="Nenhuma aplicação encontrada."
      />
    );
  }

  return (
    <section>
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{app.name}</h1>
            <IGRPBadgePrimitive className={getStatusColor(app.status || "ACTIVE")}>
              {app.status}
            </IGRPBadgePrimitive>
          </div>

          <div className="flex items-center">
            <span className="text-muted-foreground text-xs">#{app.code}</span>
            <CopyToClipboard value={app.code} />
          </div>

          <p className="text-muted-foreground text-sm">
            {app.description || "Sem descrição."}
          </p>
        </div>

        <IGRPDialogPrimitive open={open} onOpenChange={setOpen}>
          <IGRPDialogTriggerPrimitive asChild>
            <IGRPButton showIcon variant="outline" iconName="Pencil">
              Editar
            </IGRPButton>
          </IGRPDialogTriggerPrimitive>
          <IGRPDialogContentPrimitive className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <IGRPDialogHeaderPrimitive>
              <IGRPDialogTitlePrimitive>Editar Aplicação</IGRPDialogTitlePrimitive>
            </IGRPDialogHeaderPrimitive>
            <ApplicationEditForm application={app} onSuccess={() => setOpen(false)} />
          </IGRPDialogContentPrimitive>
        </IGRPDialogPrimitive>
      </div>

      <MenuList app={app} />
    </section>
  );
}