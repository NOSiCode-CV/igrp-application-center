"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
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
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: deleteDepartment, isPending: isDeleting } =
    useDeleteDepartment();

  async function confirmDelete() {
    try {
      const result = await deleteDepartment(deptToDelete.code);
      igrpToast({
        type: "success",
        title: "Departamento Eliminado",
        description: `Departamento '${deptToDelete.name}' foi eliminado com sucesso.`,
        duration: 4000,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao eliminar.",
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
      label="Nome Departamento"
    />
  );
}
