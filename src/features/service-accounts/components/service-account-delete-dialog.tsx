"use client";

import { type ReactNode, useId, useState } from "react";

import {
  Checkbox,
  Label,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { IGRPDialogDelete } from "@/components/dialog-delete";

import { useDeleteServiceAccount } from "../use-service-accounts";

export function ServiceAccountDeleteDialog({
  account,
  open,
  onOpenChange,
  onDeleted,
}: {
  account: ServiceAccountDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const t = useTranslations("serviceAccounts");
  const id = useId();
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteServiceAccount(account.id);
  // Checked by default: an orphaned client is a live, untracked credential (spec §5.6).
  const [alsoDeleteClient, setAlsoDeleteClient] = useState(true);

  async function confirmDelete() {
    const result = await mutation.mutateAsync({
      id: account.id,
      alsoDeleteClient,
    });
    if (result.success) {
      igrpToast({
        type: "success",
        title: alsoDeleteClient
          ? t("delete.successBoth")
          : t("delete.successAccount"),
        description: alsoDeleteClient
          ? t("delete.successBothDescription", {
              name: account.name,
              clientId: account.clientId,
            })
          : account.name,
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    if (result.failedStep === "client") {
      igrpToast({
        type: "error",
        title: t("delete.clientFailedTitle"),
        description: t("delete.clientFailedDescription", {
          clientId: account.clientId,
          error: result.error,
        }),
      });
      onOpenChange(false);
      onDeleted?.();
      return;
    }
    igrpToast({
      type: "error",
      title: t("delete.errorTitle"),
      description: result.error,
    });
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: account.name }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description={t("delete.description")}
      label={t("delete.label")}
      textHeader={t("delete.header")}
      labelBtnCancel={t("shared.cancel")}
      labelBtnDelete={
        alsoDeleteClient ? t("delete.buttonBoth") : t("delete.buttonAccount")
      }
    >
      <Label
        htmlFor={`${id}-also`}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 font-normal"
      >
        <Checkbox
          id={`${id}-also`}
          checked={alsoDeleteClient}
          onCheckedChange={(c) => setAlsoDeleteClient(c === true)}
        />
        <span className="flex flex-col gap-0.5">
          <span>
            {t.rich("delete.alsoClient", {
              clientId: account.clientId,
              mono: (chunks: ReactNode) => (
                <span className="font-mono">{chunks}</span>
              ),
            })}
          </span>
          <span className="text-sm text-muted-foreground">
            {t("delete.alsoClientHint")}
          </span>
        </span>
      </Label>
    </IGRPDialogDelete>
  );
}
