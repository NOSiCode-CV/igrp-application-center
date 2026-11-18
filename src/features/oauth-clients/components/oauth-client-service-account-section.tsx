"use client";

import Link from "next/link";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import {
  formatAccessSummary,
  permissionIdsOf,
  roleIdsOf,
} from "@/features/service-accounts/lib/service-account-utils";
import { useLinkedServiceAccount } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import { ActiveBadge } from "./oauth-client-badges";
import { FormSection } from "./oauth-client-form-sections";

/** Spec §4.5: only while client_credentials is selected. */
export function OAuthClientServiceAccountSection({
  clientId,
  savedWithClientCredentials,
}: {
  clientId: string;
  /** The loaded (saved) client already has client_credentials. */
  savedWithClientCredentials: boolean;
}) {
  const t = useTranslations("oauthClients");
  const tAccounts = useTranslations("serviceAccounts");
  const form = useFormContext<{ grantTypes: string[] }>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const linked = useLinkedServiceAccount(clientId);
  if (!grantTypes.includes("client_credentials")) return null;

  return (
    <FormSection
      id="sec-service-account"
      title={t("serviceAccount.title")}
      description={t("serviceAccount.description")}
    >
      {linked.account ? (
        <div className="flex items-center gap-3 rounded-lg border border-border p-3.5">
          <IGRPIcon
            iconName="Bot"
            className="size-5 text-muted-foreground"
            aria-hidden="true"
          />
          <div className="flex flex-1 flex-col gap-0.5">
            <Link
              href={`${ROUTES.SERVICE_ACCOUNTS}/${linked.account.id}`}
              className="font-medium underline"
            >
              {linked.account.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {formatAccessSummary(
                tAccounts,
                roleIdsOf(linked.account).length,
                permissionIdsOf(linked.account).length,
              )}
            </span>
          </div>
          <ActiveBadge active={linked.account.active} feminine />
        </div>
      ) : linked.isLoading || linked.isError ? (
        <p className="text-sm text-muted-foreground">{t("linkUnknown")}</p>
      ) : !savedWithClientCredentials ? (
        <p className="text-sm text-muted-foreground">
          {t("serviceAccount.saveFirst")}
        </p>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            {t("serviceAccount.none")}
          </p>
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: ROUTES.SERVICE_ACCOUNT_NEW,
                query: { oauthClientId: clientId },
              }}
            >
              {t("serviceAccount.create")}
            </Link>
          </Button>
        </div>
      )}
    </FormSection>
  );
}
