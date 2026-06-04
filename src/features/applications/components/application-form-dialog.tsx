"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";

import { ApplicationForm } from "./app-form";

interface ApplicationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: ApplicationDTO;
}

export function ApplicationFormDialog({
  open,
  onOpenChange,
  application,
}: ApplicationFormDialogProps) {
  const isEdit = !!application;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Aplicação" : "Nova Aplicação"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Atualize os detalhes da aplicação."
              : "Preencha os detalhes para registar uma nova aplicação."}
          </DialogDescription>
        </DialogHeader>
        <ApplicationForm
          application={application}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
