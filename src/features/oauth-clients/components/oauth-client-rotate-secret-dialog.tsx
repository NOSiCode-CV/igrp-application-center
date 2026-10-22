"use client";

import { type ReactNode, useEffect, useState } from "react";

import {
  Alert,
  AlertDescription,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  IGRPIcon,
  IGRPModalDialog,
  IGRPModalDialogContent,
  IGRPModalDialogDescription,
  IGRPModalDialogFooter,
  IGRPModalDialogHeader,
  IGRPModalDialogTitle,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { ConfirmDialog } from "@/components/confirmation-modal";
import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";
import { useServerErrorMessage } from "@/i18n/server-error";

import { useRotateOAuthClientSecret } from "../use-oauth-clients";

/**
 * Confirm, then show the new secret once (spec §6.3). The secret lives only in
 * this component's state; the mutation has `gcTime: 0` and never writes it to
 * the query cache.
 */
export function OAuthClientRotateSecretDialog({
  client,
  linkedAccountName,
  open,
  onOpenChange,
}: {
  client: OAuthClientDTO;
  linkedAccountName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("oauthClients");
  const serverError = useServerErrorMessage();
  const { igrpToast } = useIGRPToast();
  const rotate = useRotateOAuthClientSecret();
  const { reset: resetRotate } = rotate;
  useEffect(() => () => resetRotate(), [resetRotate]);
  const [secret, setSecret] = useState<string | null>(null);
  const [missingSecret, setMissingSecret] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function confirmRotate() {
    const result = await rotate.mutateAsync(client.id);
    if (!result.success) {
      igrpToast({
        type: "error",
        title: t("rotate.errorTitle"),
        description: serverError(result.error),
      });
      return;
    }
    if (result.data.clientSecret) setSecret(result.data.clientSecret);
    else setMissingSecret(true);
  }

  function requestClose(next: boolean) {
    if (next) return;
    if (secret && !confirmed) {
      setConfirmClose(true);
      return;
    }
    onOpenChange(false);
  }

  if (!secret && !missingSecret) {
    return (
      <ConfirmDialog
        open={open}
        onOpenChange={(o) => {
          if (!rotate.isPending) onOpenChange(o);
        }}
        title={t("rotate.confirmTitle")}
        description={
          linkedAccountName
            ? t("rotate.descriptionLinked", { name: linkedAccountName })
            : t("rotate.description")
        }
        onConfirm={confirmRotate}
        isLoading={rotate.isPending}
        confirmText={t("actions.rotateSecret")}
        cancelText={t("actions.cancel")}
        loadingText={t("rotate.loading")}
        iconName="KeyRound"
        variant="destructive"
      />
    );
  }

  return (
    <>
      <IGRPModalDialog open={open} onOpenChange={requestClose}>
        <IGRPModalDialogContent
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <IGRPModalDialogHeader>
            <IGRPModalDialogTitle>{t("rotate.doneTitle")}</IGRPModalDialogTitle>
            <IGRPModalDialogDescription>
              {t.rich(
                secret ? "rotate.doneWithSecret" : "rotate.doneWithoutSecret",
                {
                  clientId: client.clientId,
                  id: (chunks: ReactNode) => (
                    <span className="font-mono text-foreground">{chunks}</span>
                  ),
                },
              )}
            </IGRPModalDialogDescription>
          </IGRPModalDialogHeader>
          {secret ? (
            <>
              <div
                role="note"
                className="flex gap-3 rounded-lg bg-warning-subtle p-3.5 text-warning-subtle-foreground"
              >
                <IGRPIcon
                  iconName="TriangleAlert"
                  className="mt-0.5 size-4.5 shrink-0"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-0.5">
                  <strong className="font-semibold">
                    {t("secret.warningTitle")}
                  </strong>
                  <span className="text-sm">{t("secret.warningBody")}</span>
                </div>
              </div>
              <SensitiveValueDisclosure
                label={t("secret.label")}
                confirmationLabel={t("secret.confirmLabel")}
                value={secret}
                onConfirmedChange={setConfirmed}
              />
              <IGRPModalDialogFooter>
                <Button
                  type="button"
                  disabled={!confirmed}
                  onClick={() => onOpenChange(false)}
                >
                  {t("actions.finish")}
                </Button>
              </IGRPModalDialogFooter>
            </>
          ) : (
            <>
              <Alert variant="destructive">
                <IGRPIcon iconName="TriangleAlert" aria-hidden="true" />
                <AlertDescription>{t("rotate.missingAlert")}</AlertDescription>
              </Alert>
              <IGRPModalDialogFooter>
                <Button type="button" onClick={() => onOpenChange(false)}>
                  {t("actions.close")}
                </Button>
              </IGRPModalDialogFooter>
            </>
          )}
        </IGRPModalDialogContent>
      </IGRPModalDialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("rotate.closeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("rotate.closeDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("rotate.closeBack")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => onOpenChange(false)}>
              {t("rotate.closeAnyway")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
