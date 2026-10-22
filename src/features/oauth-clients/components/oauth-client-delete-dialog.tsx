"use client";

import { useIGRPToast } from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { IGRPDialogDelete } from "@/components/dialog-delete";
import { useServerErrorMessage } from "@/i18n/server-error";

import { useDeleteOAuthClient } from "../use-oauth-clients";

export function OAuthClientDeleteDialog({
  client,
  open,
  onOpenChange,
  onDeleted,
}: {
  client: OAuthClientDTO;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
}) {
  const t = useTranslations("oauthClients.delete");
  const serverError = useServerErrorMessage();
  const ta = useTranslations("oauthClients.actions");
  const { igrpToast } = useIGRPToast();
  const mutation = useDeleteOAuthClient();

  async function confirmDelete() {
    const result = await mutation.mutateAsync(client.id);
    if (!result.success) {
      // 409: a service account was linked after this page loaded. The hook
      // refreshes the list, so the page's own delete block takes over.
      const linked = result.status === 409;
      igrpToast({
        type: "error",
        title: t("errorTitle"),
        description: linked ? t("linkedError") : serverError(result.error),
      });
      if (linked) onOpenChange(false);
      return;
    }
    igrpToast({
      type: "success",
      title: t("successTitle"),
      description: client.clientId,
    });
    onOpenChange(false);
    onDeleted?.();
  }

  return (
    <IGRPDialogDelete
      open={open}
      onOpenChange={onOpenChange}
      toDelete={{ name: client.clientId }}
      confirmDelete={confirmDelete}
      isDeleting={mutation.isPending}
      description={t("description")}
      label={t("label")}
      textHeader={t("header")}
      labelBtnCancel={ta("cancel")}
      labelBtnDelete={ta("delete")}
    />
  );
}
