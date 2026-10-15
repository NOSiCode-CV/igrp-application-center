"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ReactNode, useState } from "react";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { ActiveBadge } from "@/features/oauth-clients/components/oauth-client-badges";
import { ROUTES } from "@/lib/constants";

import { useAccountBusy, useServiceAccount } from "../use-service-accounts";
import { ServiceAccountActivationDialog } from "./service-account-activation-dialog";
import { ServiceAccountClientCard } from "./service-account-client-card";
import { ServiceAccountDeleteDialog } from "./service-account-delete-dialog";
import { ServiceAccountIdentityCard } from "./service-account-identity-card";

export function ServiceAccountDetail({
  id,
  main,
}: {
  id: string;
  /** The access column (Task 7). */
  main?: ReactNode;
}) {
  const router = useRouter();
  const { data: account } = useServiceAccount(id);
  const busy = useAccountBusy(id);
  const [dialog, setDialog] = useState<"none" | "activation" | "delete">(
    "none",
  );

  if (!account) return null; // prefetched; error.tsx covers failure

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={ROUTES.SERVICE_ACCOUNTS}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <IGRPIcon iconName="ArrowLeft" className="size-4" aria-hidden="true" />
        Contas de serviço
      </Link>

      <header className="flex items-center gap-4">
        <div className="flex size-13 items-center justify-center rounded-xl bg-primary-subtle text-primary-subtle-foreground">
          <IGRPIcon iconName="Bot" className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">
            {account.name}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ActiveBadge active={account.active} feminine />
            <span>
              Aplicação{" "}
              <span className="font-mono text-foreground">
                {account.applicationCode ?? "—"}
              </span>
            </span>
            <span>
              Autentica como{" "}
              <Link
                href={`${ROUTES.OAUTH_CLIENTS}/${account.oauthClientId}`}
                className="font-mono text-foreground underline"
              >
                {account.clientId}
              </Link>
            </span>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">{main}</div>
        <aside className="flex flex-col gap-6">
          <ServiceAccountClientCard account={account} />
          <ServiceAccountIdentityCard account={account} />
        </aside>
      </div>

      <section aria-labelledby="danger-zone" className="flex flex-col gap-3">
        <h3
          id="danger-zone"
          className="text-base font-semibold text-destructive"
        >
          Zona de perigo
        </h3>
        <div className="flex flex-col divide-y divide-destructive/20 rounded-xl border border-destructive/30 bg-card">
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">
                {account.active ? "Desativar conta" : "Ativar conta"}
              </span>
              <span className="text-sm text-muted-foreground">
                {account.active
                  ? `Desativa também o cliente OAuth ${account.clientId}. A identidade deixa de conseguir autenticar.`
                  : `Reativa também o cliente OAuth ${account.clientId}.`}
              </span>
            </div>
            <Button
              variant={account.active ? "outline" : "default"}
              className={account.active ? "text-destructive" : undefined}
              disabled={busy}
              onClick={() => setDialog("activation")}
            >
              {account.active ? "Desativar" : "Ativar"}
            </Button>
          </div>
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">Eliminar conta</span>
              <span className="text-sm text-muted-foreground">
                Remove a conta e, por defeito, o cliente OAuth. Não é possível
                recuperá-los.
              </span>
            </div>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => setDialog("delete")}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {dialog === "activation" ? (
        <ServiceAccountActivationDialog
          account={account}
          open
          onOpenChange={(o) => !o && setDialog("none")}
        />
      ) : null}
      {dialog === "delete" ? (
        <ServiceAccountDeleteDialog
          account={account}
          open
          onOpenChange={(o) => !o && setDialog("none")}
          onDeleted={() => router.push(ROUTES.SERVICE_ACCOUNTS)}
        />
      ) : null}
    </div>
  );
}
