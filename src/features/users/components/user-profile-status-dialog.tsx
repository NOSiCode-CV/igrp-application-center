"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  IGRPButton,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { Status } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";

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
            {isActive ? "Desativar" : "Ativar"} Utilizador
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
            utilizador <strong className="text-foreground">{userName}</strong>?
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
            Cancelar
          </IGRPButton>
          <IGRPButton
            onClick={handleConfirm}
            disabled={pending}
            variant={isActive ? "destructive" : "default"}
            className="gap-2"
          >
            {pending ? (
              <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
            ) : (
              <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
            )}
            {isActive ? "Confirmar Desativar" : "Confirmar Ativar"}
          </IGRPButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
