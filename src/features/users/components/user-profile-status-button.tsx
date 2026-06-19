"use client";

import {
  cn,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

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
  return (
    <IGRPButton
      type="button"
      size="sm"
      variant={isActive ? "destructive" : "default"}
      disabled={isPending}
      onClick={onToggleStatus}
      aria-label={isActive ? "Desativar utilizador" : "Ativar utilizador"}
      className={cn(
        "gap-2",
        !isActive && "bg-success text-success-foreground hover:bg-success/90",
      )}
    >
      <IGRPIcon iconName={isActive ? "Ban" : "Check"} className="size-4" />
      {isActive ? "Desativar" : "Ativar"}
    </IGRPButton>
  );
}
