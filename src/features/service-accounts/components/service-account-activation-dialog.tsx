"use client";

import { useState } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetServiceAccountActive } from "../use-service-accounts";

const STEP_KEY = {
  client: "stepClient",
  serviceAccount: "stepServiceAccount",
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
  const t = useTranslations("serviceAccounts");
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
        title: activate
          ? t("activation.toastActivated")
          : t("activation.toastDeactivated"),
        description: account.name,
      });
      onOpenChange(false);
      return;
    }
    igrpToast({
      type: "error",
      title: t(
        activate ? "activation.errorActivate" : "activation.errorDeactivate",
        { step: t(`activation.${STEP_KEY[result.failedStep]}`) },
      ),
      description: t("activation.retry", { error: result.error }),
    });
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        activate
          ? t("activation.titleActivate")
          : t("activation.titleDeactivate")
      }
      description={t(
        activate ? "activation.descActivate" : "activation.descDeactivate",
        { name: account.name, clientId: account.clientId },
      )}
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? t("shared.activate") : t("shared.deactivate")}
      cancelText={t("shared.cancel")}
      loadingText={
        activate
          ? t("activation.loadingActivate")
          : t("activation.loadingDeactivate")
      }
      variant={activate ? "default" : "destructive"}
    />
  );
}
