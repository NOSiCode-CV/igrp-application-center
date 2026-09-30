"use client";

import Link from "next/link";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useFormContext, useWatch } from "react-hook-form";

import {
  formatAccessSummary,
  permissionIdsOf,
  roleIdsOf,
} from "@/features/service-accounts/lib/service-account-utils";
import { useLinkedServiceAccount } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import { LINK_UNKNOWN_REASON } from "../lib/oauth-client-utils";
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
  const form = useFormContext<{ grantTypes: string[] }>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const linked = useLinkedServiceAccount(clientId);
  if (!grantTypes.includes("client_credentials")) return null;

  return (
    <FormSection
      id="sec-service-account"
      title="Conta de serviço"
      description="A identidade de máquina que autentica com este cliente, com os seus perfis e permissões."
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
                roleIdsOf(linked.account).length,
                permissionIdsOf(linked.account).length,
              )}
            </span>
          </div>
          <ActiveBadge active={linked.account.active} feminine />
        </div>
      ) : linked.isLoading || linked.isError ? (
        <p className="text-sm text-muted-foreground">{LINK_UNKNOWN_REASON}</p>
      ) : !savedWithClientCredentials ? (
        <p className="text-sm text-muted-foreground">
          Guarde as alterações para poder criar uma conta de serviço para este
          cliente.
        </p>
      ) : (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Este cliente ainda não tem conta de serviço.
          </p>
          <Button asChild variant="outline">
            <Link
              href={{
                pathname: ROUTES.SERVICE_ACCOUNT_NEW,
                query: { oauthClientId: clientId },
              }}
            >
              Criar conta de serviço para este cliente
            </Link>
          </Button>
        </div>
      )}
    </FormSection>
  );
}
