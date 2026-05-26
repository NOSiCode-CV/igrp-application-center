"use client";

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
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";
import { useState } from "react";
import { useUpdateUserStatus } from "@/features/users/use-users";

interface UserStatusToggleProps {
  user: IGRPUserDTO;
}

export function UserStatusToggle({ user }: UserStatusToggleProps) {
  const { igrpToast } = useIGRPToast();
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
        title: `Utilizador ${isActive ? "desativado" : "ativado"} com sucesso`,
        duration: 4000,
      });
    } catch (err) {
      igrpToast({
        type: "error",
        title: "Erro ao alterar estado",
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
        {isActive ? "Desativar" : "Ativar"}
      </IGRPButton>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <IGRPIcon
                iconName="AlertTriangle"
                className="w-5 h-5 text-destructive"
                strokeWidth={2}
              />
              {isActive ? "Desativar" : "Ativar"} Utilizador
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja {isActive ? "desativar" : "ativar"} o
              utilizador <strong className="text-foreground">{user.name}</strong>?
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
              Cancelar
            </IGRPButton>
            <IGRPButton
              onClick={handleConfirm}
              disabled={isPending}
              className={cn(
                isActive
                  ? "bg-destructive hover:bg-destructive/90"
                  : "bg-primary hover:bg-primary/90",
                "gap-2 text-white",
              )}
            >
              {isPending ? (
                <IGRPIcon iconName="LoaderCircle" className="animate-spin" />
              ) : (
                <IGRPIcon iconName={isActive ? "Ban" : "Check"} />
              )}
              {isActive ? "Confirmar Desativar" : "Confirmar Ativar"}
            </IGRPButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
