"use client";

import Link from "next/link";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { useTranslations } from "next-intl";

import { InlineError } from "@/components/inline-error";
import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { useCopyClientId } from "@/features/oauth-clients/use-copy-client-id";
import { useOAuthClient } from "@/features/oauth-clients/use-oauth-clients";
import { ROUTES } from "@/lib/constants";

/** OAuth protocol value, shown as is in every language. */
const GRANT_TYPE = "client_credentials";

export function ServiceAccountClientCard({
  account,
}: {
  account: ServiceAccountDTO;
}) {
  const t = useTranslations("serviceAccounts");
  const copyClientId = useCopyClientId();
  const client = useOAuthClient(account.oauthClientId);
  const href = `${ROUTES.OAUTH_CLIENTS}/${account.oauthClientId}` as const;

  return (
    <section
      aria-labelledby="sa-client"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-client" className="font-semibold">
          {t("shared.oauthClient")}
        </h3>
        <Button asChild variant="outline" size="sm">
          <Link href={href}>{t("clientCard.open")}</Link>
        </Button>
      </div>
      {client.isError ? (
        // Spec §6.5: a missing client should not happen (FK NOT NULL) — say so, never render a broken card.
        <InlineError
          title={t("clientCard.errorTitle")}
          message={t("clientCard.errorMessage")}
          onRetry={() => client.refetch()}
        />
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t("shared.clientId")}</dt>
            <dd className="flex items-center gap-1">
              <Link href={href} className="font-mono underline">
                {account.clientId}
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                aria-label={t("shared.copyClientId")}
                onClick={() => copyClientId(account.clientId)}
              >
                <IGRPIcon
                  iconName="Copy"
                  className="size-3.5"
                  aria-hidden="true"
                />
              </Button>
            </dd>
          </div>
          {client.data?.clientName ? (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("clientCard.name")}</dt>
              <dd>{client.data.clientName}</dd>
            </div>
          ) : null}
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">
              {t("clientCard.grantType")}
            </dt>
            <dd className="flex flex-col gap-0.5">
              <span className="inline-flex items-center gap-1.5 font-mono">
                <IGRPIcon
                  iconName="Lock"
                  className="size-3.5"
                  aria-hidden="true"
                />
                {GRANT_TYPE}
              </span>
              <span className="text-muted-foreground">
                {t("clientCard.grantFixed")}
              </span>
            </dd>
          </div>
          {client.data ? (
            <div className="flex flex-col gap-1">
              <dt className="text-muted-foreground">{t("shared.status")}</dt>
              <dd>
                <ActiveBadge active={client.data.active} />
              </dd>
            </div>
          ) : null}
        </dl>
      )}
    </section>
  );
}
