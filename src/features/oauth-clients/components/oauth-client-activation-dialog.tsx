"use client";

import { useState } from "react";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type {
  OAuthClientDTO,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirmation-modal";

import { useSetClientActive } from "../use-oauth-clients";

const STEP_KEY = {
  client: "stepClient",
  serviceAccount: "stepServiceAccount",
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
  const t = useTranslations("oauthClients");
  const { igrpToast } = useIGRPToast();
  const mutation = useSetClientActive();
  const [activate] = useState(() => !client.active);

  const description = activate
    ? linkedAccount
      ? t("activation.descActivateLinked", { name: linkedAccount.name })
      : t("activation.descActivate")
    : linkedAccount
      ? t("activation.descDeactivateLinked", { name: linkedAccount.name })
      : t("activation.descDeactivate");

  async function confirm() {
    const result = await mutation.mutateAsync({
      client,
      linkedAccountId: linkedAccount?.id,
      active: activate,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: activate
          ? t("activation.toastActivated")
          : t("activation.toastDeactivated"),
        description: client.clientName || client.clientId,
      });
      onOpenChange(false);
      return;
    }
    const step =
      "failedStep" in result
        ? t(`activation.${STEP_KEY[result.failedStep]}`)
        : null;
    const errorTitle =
      step === null
        ? activate
          ? t("activation.errorActivate")
          : t("activation.errorDeactivate")
        : activate
          ? t("activation.errorActivateStep", { step })
          : t("activation.errorDeactivateStep", { step });
    igrpToast({
      type: "error",
      title: errorTitle,
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
      description={description}
      onConfirm={confirm}
      isLoading={mutation.isPending}
      confirmText={activate ? t("actions.activate") : t("actions.deactivate")}
      cancelText={t("actions.cancel")}
      loadingText={
        activate
          ? t("activation.loadingActivate")
          : t("activation.loadingDeactivate")
      }
      variant={activate ? "default" : "destructive"}
    />
  );
}
