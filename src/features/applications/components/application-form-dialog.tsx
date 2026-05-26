"use client";

import {
  Dialog,
  DialogContent,
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
      <DialogContent className="sm:min-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar Aplicação" : "Nova Aplicação"}
          </DialogTitle>
        </DialogHeader>
        <ApplicationForm
          application={application}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
