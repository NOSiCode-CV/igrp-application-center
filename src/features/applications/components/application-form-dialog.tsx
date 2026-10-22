"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@igrp/igrp-framework-react-design-system";
import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("applications.dialog");
  const isEdit = !!application;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editTitle") : t("newTitle")}</DialogTitle>
          <DialogDescription>
            {isEdit ? t("editDescription") : t("newDescription")}
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
