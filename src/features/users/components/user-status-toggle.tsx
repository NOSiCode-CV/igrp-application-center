"use client";

import { useState } from "react";

import {
  IGRPButton,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { IGRPUserDTO } from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";
import { useUpdateUserStatus } from "@/features/users/use-users";

interface UserStatusToggleProps {
  user: IGRPUserDTO;
}

export function UserStatusToggle({ user }: UserStatusToggleProps) {
  const { igrpToast } = useIGRPToast();
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

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={isActive ? "Desativar utilizador" : "Ativar utilizador"}
        description={
          isActive
            ? `${userLabel} deixa de poder entrar na plataforma. As atribuições de perfil são mantidas e a conta pode ser reativada mais tarde.`
            : `${userLabel} volta a poder entrar na plataforma com os perfis que já tem atribuídos.`
        }
        onConfirm={handleConfirm}
        isLoading={isPending}
        confirmText={isActive ? "Desativar" : "Ativar"}
        loadingText={isActive ? "A desativar..." : "A ativar..."}
        iconName="Ban"
        variant={isActive ? "destructive" : "default"}
      />
    </>
  );
}
