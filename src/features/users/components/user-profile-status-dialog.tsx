"use client";

import { useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  cn,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { Status } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

export interface UserProfileStatusDialogProps {
  open: boolean;
  isActive: boolean;
  userName: string;
  onOpenChange: (open: boolean) => void;
  onConfirm: (next: Status) => Promise<void>;
}

export function UserProfileStatusDialog({
  open,
  isActive,
  userName,
  onOpenChange,
  onConfirm,
}: UserProfileStatusDialogProps) {
  const t = useTranslations("users.profile.statusDialog");
  const tc = useTranslations("common.actions");
  const [pending, setPending] = useState(false);
  const next: Status = isActive ? Status.INACTIVE : Status.ACTIVE;

  const handleConfirm = async () => {
    setPending(true);
    try {
      await onConfirm(next);
    } finally {
      setPending(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <IGRPIcon
              iconName="AlertTriangle"
              className="size-5 text-destructive"
              strokeWidth={2}
            />
            {isActive ? t("deactivateTitle") : t("activateTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich(
              isActive ? "deactivateDescription" : "activateDescription",
              {
                name: userName,
                strong: (chunks) => (
                  <strong className="text-foreground">{chunks}</strong>
                ),
              },
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <IGRPButton
            disabled={pending}
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
            showIcon
            iconPlacement="start"
            iconName="X"
          >
            {tc("cancel")}
          </IGRPButton>
          <IGRPButton
            onClick={handleConfirm}
            disabled={pending}
            variant={isActive ? "destructive" : "default"}
            className={cn(
              "gap-2",
              !isActive &&
                "bg-success text-success-foreground hover:bg-success/90",
            )}
          >
            {pending ? (
              <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
            ) : (
              <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
            )}
            {isActive ? t("confirmDeactivate") : t("confirmActivate")}
          </IGRPButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
