"use client";

import { useState } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetServiceAccountActive } from "../use-service-accounts";

const STEP_LABEL = {
  client: "cliente OAuth",
  serviceAccount: "conta de serviço",
} as const;

export function ServiceAccountActivationDialog({
  account,
  open,
  onOpenChange,
}: {
  account: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useSetServiceAccountActive(account.id);
  // Frozen at open: a refetch mid-dialog must not flip the action.
  const [activate] = useState(() => !account.active);

  async function confirm() {
    const result = await mutation.mutateAsync({
      id: account.id,
      active: activate,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: activate ? "Conta ativada" : "Conta desativada",
        description: account.name,
      });
      onOpenChange(false);
      return;
    }
    igrpToast({
      type: "error",
      title: `Não foi possível ${activate ? "ativar" : "desativar"} (falhou: ${STEP_LABEL[result.failedStep]})`,
      description: `${result.error} Tente novamente.`,
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        activate ? "Ativar conta de serviço" : "Desativar conta de serviço"
      }
      description={
        activate
          ? `A conta «${account.name}» e o cliente OAuth ${account.clientId} voltam a poder autenticar.`
          : `A conta «${account.name}» e o cliente OAuth ${account.clientId} deixam de conseguir autenticar até serem reativados.`
      }
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? "Ativar" : "Desativar"}
      loadingText={activate ? "A ativar…" : "A desativar…"}
      variant={activate ? "default" : "destructive"}
    />
  );
}
