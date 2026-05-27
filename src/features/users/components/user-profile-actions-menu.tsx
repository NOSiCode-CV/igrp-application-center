"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

export interface UserProfileActionsMenuProps {
  isActive: boolean;
  isPending: boolean;
  onToggleStatus: () => void;
}

export function UserProfileActionsMenu({
  isActive,
  isPending,
  onToggleStatus,
}: UserProfileActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <IGRPButton
          variant="ghost"
          size="icon"
          aria-label="Ações do utilizador"
          disabled={isPending}
        >
          <IGRPIcon iconName="MoreHorizontal" className="w-4 h-4" />
        </IGRPButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={isPending}
          onSelect={onToggleStatus}
          className={
            isActive ? "text-destructive focus:text-destructive" : undefined
          }
        >
          <IGRPIcon
            iconName={isActive ? "Ban" : "Check"}
            className="w-4 h-4 mr-2"
          />
          {isActive ? "Desativar" : "Ativar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
