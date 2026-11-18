"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IGRPButton,
  IGRPIcon,
  Input,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { useDeleteRole } from "@/features/departments/use-departments";
import { useServerErrorMessage } from "@/i18n/server-error";

interface RoleDeleteDialogProps {
  departmentCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleToDelete: string;
}

export function RoleDeleteDialog({
  departmentCode,
  open,
  onOpenChange,
  roleToDelete,
}: RoleDeleteDialogProps) {
  const t = useTranslations("roles.delete");
  const serverError = useServerErrorMessage();
  const [confirmation, setConfirmation] = useState("");
  const { igrpToast } = useIGRPToast();

  const { mutateAsync: deleteRole, isPending } = useDeleteRole();

  const isConfirmed = confirmation === roleToDelete;

  async function confirmDelete() {
    try {
      const result = await deleteRole({
        departmentCode,
        roleCode: roleToDelete,
      });
      if (!result.success) {
        throw new Error(result.error);
      }
      igrpToast({
        type: "success",
        title: t("toast.successTitle"),
        description: t("toast.successDescription", { name: roleToDelete }),
        duration: 4000,
      });
    } catch (error) {
      console.log("Erro ao eliminar role:", error);
      igrpToast({
        type: "error",
        title: t("toast.errorTitle"),
        description: serverError((error as Error).message),
        duration: 4000,
      });
    } finally {
      setTimeout(() => {
        onOpenChange(false);
      }, 2000);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false}>
        <div>
          <DialogHeader className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex size-9 shrink-0 items-center justify-center"
                aria-hidden="true"
              >
                <IGRPIcon
                  iconName="CircleAlertIcon"
                  aria-hidden
                  className="opacity-80 size-4"
                />
              </div>
              <DialogTitle>{t("title")}</DialogTitle>
            </div>
            <DialogDescription className="flex flex-col items-center text-base text-balance text-foreground mx-auto">
              <div>
                {t.rich("description", {
                  name: roleToDelete,
                  code: (chunks) => (
                    <span className="font-semibold italic bg-destructive text-destructive-foreground p-0.5 rounded-sm">
                      {chunks}
                    </span>
                  ),
                })}
              </div>
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex flex-col gap-2">
          <Label
            htmlFor="confirmation"
            className='after:content-["*"] after:text-destructive gap-0.5 mb-1'
          >
            {t("label")}
          </Label>
          <Input
            id="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={t("placeholder", { name: roleToDelete })}
            className="placeholder:truncate border-primary/30 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/30"
            required
          />
        </div>
        <DialogFooter className="flex flex-col">
          <IGRPButton
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setConfirmation("");
            }}
            type="button"
            showIcon
            iconName="X"
          >
            {t("cancel")}
          </IGRPButton>
          <IGRPButton
            variant="destructive"
            onClick={() => {
              confirmDelete();
              setConfirmation("");
            }}
            disabled={!isConfirmed || isPending}
            showIcon
            iconName="Trash"
          >
            {isPending ? t("pending") : t("confirm")}
          </IGRPButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
