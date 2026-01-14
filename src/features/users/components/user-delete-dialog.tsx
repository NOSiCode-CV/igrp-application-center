"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { IGRPDialogDelete } from "@/components/dialog-delete";
import { statusSchema } from "@/schemas/global";
import { useUpdateUser } from "../use-users";

interface UserDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userToDelete: IGRPUserDTO;
}

export function UserDeleteDialog({
  open,
  onOpenChange,
  userToDelete,
}: UserDeleteDialogProps) {
  const { igrpToast } = useIGRPToast();
  const { mutateAsync: removeUser, isPending: isDeleting } = useUpdateUser();

  async function confirmDelete() {
    const id = userToDelete.id;
    const payload = {
      ...userToDelete,
      status: statusSchema.enum.INACTIVE as Status,
    };
    try {
      const result = await removeUser({ id, user: payload });
      if (!result.success) {
        throw new Error(result.error);
      }
      igrpToast({
        type: "success",
        title: "Utilizador Desativado",
        description: `Utilizador '${userToDelete.name || userToDelete.email}' foi desativado com sucesso.`,
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: "Erro ao desativar.",
        description: (error as Error).message,
      });
    }
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: userToDelete.name || userToDelete.email }}
      confirmDelete={confirmDelete}
      label="Username"
      isDeleting={isDeleting}
      labelBtnDelete="Desativar"
    />
  );
}
