"use client";

import { useState } from "react";

import {
  IGRPButton,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirmation-modal";
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
  const userLabel = user.name || user.email;

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

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={
          isActive
            ? t("statusDialog.deactivateTitle")
            : t("statusDialog.activateTitle")
        }
        description={t.rich(
          isActive
            ? "statusDialog.deactivateDescription"
            : "statusDialog.activateDescription",
          {
            name: userLabel,
            strong: (chunks) => (
              <strong className="text-foreground">{chunks}</strong>
            ),
          },
        )}
        onConfirm={handleConfirm}
        isLoading={isPending}
        confirmText={
          isActive
            ? t("statusDialog.confirmDeactivate")
            : t("statusDialog.confirmActivate")
        }
        loadingText={isActive ? "A desativar..." : "A ativar..."}
        iconName="Ban"
        variant={isActive ? "destructive" : "default"}
      />
    </>
  );
}
