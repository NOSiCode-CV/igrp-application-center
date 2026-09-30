"use client";

import {
  cn,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

export interface UserProfileStatusButtonProps {
  isActive: boolean;
  isPending: boolean;
  onToggleStatus: () => void;
}

export function UserProfileStatusButton({
  isActive,
  isPending,
  onToggleStatus,
}: UserProfileStatusButtonProps) {
  const t = useTranslations("users.profile.statusButton");
  return (
    <IGRPButton
      type="button"
      size="sm"
      variant={isActive ? "destructive" : "default"}
      disabled={isPending}
      onClick={onToggleStatus}
      aria-label={isActive ? t("deactivateLabel") : t("activateLabel")}
      className={cn(
        "gap-2",
        !isActive && "bg-success text-success-foreground hover:bg-success/90",
      )}
    >
      <IGRPIcon iconName={isActive ? "Ban" : "Check"} className="size-4" />
      {isActive ? t("deactivate") : t("activate")}
    </IGRPButton>
  );
}
