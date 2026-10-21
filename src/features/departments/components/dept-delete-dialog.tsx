"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteDepartment } from "../use-departments";

interface DepartmentDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deptToDelete: { code: string; name: string };
}

export function DepartmentDeleteDialog({
  open,
  onOpenChange,
  deptToDelete,
}: DepartmentDeleteDialogProps) {
  const t = useTranslations("departments");
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: deleteDepartment, isPending: isDeleting } =
    useDeleteDepartment();

  async function confirmDelete() {
    try {
      const result = await deleteDepartment(deptToDelete.code);

      if (!result.success) {
        throw new Error(result.error);
      }

      igrpToast({
        type: "success",
        title: t("delete.toast.successTitle"),
        description: t("delete.toast.successDescription", {
          name: deptToDelete.name,
        }),
        duration: 4000,
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("delete.toast.errorTitle"),
        description: (error as Error).message,
        duration: 4000,
      });
    }
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={deptToDelete}
      confirmDelete={confirmDelete}
      isDeleting={isDeleting}
      description={t("delete.description")}
      label={t("delete.label")}
      textHeader={t("delete.title")}
      labelBtnCancel={t("actions.cancel")}
      labelBtnDelete={t("tree.delete")}
    />
  );
}
