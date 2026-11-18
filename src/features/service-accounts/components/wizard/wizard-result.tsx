"use client";

import { type ReactNode, useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

export type WizardOutcome =
  | { kind: "created"; client: OAuthClientDTO; accountId: string }
  | { kind: "accountFailed"; client: OAuthClientDTO; error: string };

/**
 * Shown after any submit that created a new client: its secret exists only
 * here (spec §5.4). A partial failure still discloses it, then offers the retry.
 */
export function WizardResult({
  outcome,
  onRetry,
  isRetrying,
  onDone,
}: {
  outcome: WizardOutcome;
  onRetry: () => void;
  isRetrying: boolean;
  onDone: (accountId: string) => void;
}) {
  const t = useTranslations("serviceAccounts");
  const tClient = useTranslations("oauthClients");
  const [confirmed, setConfirmed] = useState(false);
  const secret = outcome.client.clientSecret;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">
          {outcome.kind === "created"
            ? t("wizard.createdTitle")
            : t("result.clientRegisteredTitle")}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t.rich("result.registered", {
            clientId: outcome.client.clientId,
            mono: (chunks: ReactNode) => (
              <span className="font-mono text-foreground">{chunks}</span>
            ),
          })}
        </p>
      </div>
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
                {tClient("secret.warningTitle")}
              </strong>
              <span className="text-sm">{tClient("secret.warningBody")}</span>
            </div>
          </div>
          <SensitiveValueDisclosure
            label={tClient("secret.label")}
            confirmationLabel={tClient("secret.confirmLabel")}
            value={secret}
            onConfirmedChange={setConfirmed}
          />
        </>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>{t("result.missingSecret")}</AlertDescription>
        </Alert>
      )}
      {outcome.kind === "accountFailed" ? (
        <Alert variant="destructive">
          <AlertDescription>
            {t("result.accountFailed", { error: outcome.error })}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {tClient("create.rotateHint")}
        </p>
        {outcome.kind === "accountFailed" ? (
          <Button onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? t("shared.creating") : t("result.retry")}
          </Button>
        ) : (
          <Button
            disabled={!!secret && !confirmed}
            onClick={() => onDone(outcome.accountId)}
          >
            {t("result.finish")}
          </Button>
        )}
      </div>
    </div>
  );
}
