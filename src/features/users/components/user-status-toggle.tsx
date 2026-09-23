"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  IGRPButton,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { useUpdateUserStatus } from "@/features/users/use-users";

interface UserStatusToggleProps {
  user: IGRPUserDTO;
}

export function UserStatusToggle({ user }: UserStatusToggleProps) {
  const { igrpToast } = useIGRPToast();
  const t = useTranslations("users.profile");
  const tc = useTranslations("common.actions");
  const { mutateAsync: updateStatus, isPending } = useUpdateUserStatus();
  const [open, setOpen] = useState(false);
  const isActive = user.status === "ACTIVE";

  const handleConfirm = async () => {
    const value = isActive ? "INACTIVE" : "ACTIVE";
    try {
      const res = await updateStatus({ id: user.id, value });
      if (!res.success) throw new Error(res.error);
      setOpen(false);
      igrpToast({
        type: "success",
        title: isActive ? t("toasts.deactivated") : t("toasts.activated"),
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: t("toasts.statusChangeFailed"),
        description: (err as Error).message,
        duration: 4000,
      });
    }
  };

  return (
    <>
      <IGRPButton
        showIcon
        variant={isActive ? "destructive" : "default"}
        iconName={isActive ? "Ban" : "Check"}
        size="sm"
        onClick={() => setOpen(true)}
      >
        {isActive ? t("statusButton.deactivate") : t("statusButton.activate")}
      </IGRPButton>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="size-5 text-destructive"
                strokeWidth={2}
              />
              {isActive
                ? t("statusDialog.deactivateTitle")
                : t("statusDialog.activateTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich(
                isActive
                  ? "statusDialog.deactivateDescription"
                  : "statusDialog.activateDescription",
                {
                  name: user.name,
                  strong: (chunks) => (
                    <strong className="text-foreground">{chunks}</strong>
                  ),
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <IGRPButton
              disabled={isPending}
              variant="outline"
              onClick={() => setOpen(false)}
              type="button"
              showIcon
              iconPlacement="start"
              iconName="X"
            >
              {tc("cancel")}
            </IGRPButton>
            <IGRPButton
              onClick={handleConfirm}
              disabled={isPending}
              variant={isActive ? "destructive" : "default"}
              className="gap-2"
            >
              {isPending ? (
                <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
              ) : (
                <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
              )}
              {isActive
                ? t("statusDialog.confirmDeactivate")
                : t("statusDialog.confirmActivate")}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
