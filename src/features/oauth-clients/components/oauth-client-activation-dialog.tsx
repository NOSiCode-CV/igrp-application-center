"use client";

import { useState } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetClientActive } from "../use-oauth-clients";

const STEP_LABEL = {
  client: "cliente OAuth",
  serviceAccount: "conta de serviço",
} as const;

export function OAuthClientActivationDialog({
  client,
  linkedAccount,
  open,
  onOpenChange,
}: {
  client: OAuthClientDTO;
  linkedAccount?: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { igrpToast } = useIGRPToast();
  const mutation = useSetClientActive();
  // Fixed at open: after a partial combined failure the refetch may already
  // show the first step's result, and a live `!client.active` would turn the
  // retry into the opposite action. The copy below derives from this too.
  const [activate] = useState(() => !client.active);

  const description = activate
    ? linkedAccount
      ? `O cliente e a conta de serviço «${linkedAccount.name}» voltam a poder autenticar.`
      : "O cliente volta a poder pedir tokens."
    : linkedAccount
      ? `O cliente e a conta de serviço «${linkedAccount.name}» deixam de conseguir autenticar até serem reativados.`
      : "As aplicações que usam este cliente deixam de conseguir autenticar. Pode reativá-lo depois.";

  async function confirm() {
    const result = await mutation.mutateAsync({
      client,
      linkedAccountId: linkedAccount?.id,
      active: activate,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: activate ? "Cliente ativado" : "Cliente desativado",
        description: client.clientName || client.clientId,
      });
      onOpenChange(false);
      return;
    }
    const step =
      "failedStep" in result
        ? ` (falhou: ${STEP_LABEL[result.failedStep]})`
        : "";
    igrpToast({
      type: "error",
      title: `Não foi possível ${activate ? "ativar" : "desativar"}${step}`,
      description: `${result.error} Tente novamente.`,
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={activate ? "Ativar cliente" : "Desativar cliente"}
      description={description}
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? "Ativar" : "Desativar"}
      loadingText={activate ? "A ativar…" : "A desativar…"}
      variant={activate ? "default" : "destructive"}
    />
  );
}
