"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  IGRPUserDTO,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("users.deleteDialog");
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
        title: t("deactivated"),
        description: t("deactivatedDescription", {
          name: userToDelete.name || userToDelete.email,
        }),
      });

      onOpenChange(false);
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("deactivateFailed"),
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
      label={t("label")}
      isDeleting={isDeleting}
      labelBtnDelete={t("confirm")}
    />
  );
}
