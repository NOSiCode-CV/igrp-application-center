"use client";

import { useState } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

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
  const [confirmed, setConfirmed] = useState(false);
  const secret = outcome.client.clientSecret;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">
          {outcome.kind === "created"
            ? "Conta de serviço criada"
            : "Cliente registado"}
        </h3>
        <p className="text-sm text-muted-foreground">
          O cliente{" "}
          <span className="font-mono text-foreground">
            {outcome.client.clientId}
          </span>{" "}
          foi registado. Guarde o segredo antes de sair desta página.
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
                Este segredo não volta a ser mostrado.
              </strong>
              <span className="text-sm">
                Nem a si, nem a outro administrador. Guarde-o já no seu gestor
                de segredos.
              </span>
            </div>
          </div>
          <SensitiveValueDisclosure
            label="Client secret"
            value={secret}
            onConfirmedChange={setConfirmed}
          />
        </>
      ) : (
        <Alert variant="destructive">
          <AlertDescription>
            O servidor não devolveu o segredo. Desative este cliente e registe
            um novo.
          </AlertDescription>
        </Alert>
      )}
      {outcome.kind === "accountFailed" ? (
        <Alert variant="destructive">
          <AlertDescription>
            A conta de serviço não foi criada: {outcome.error} O cliente já
            existe; pode tentar criar a conta novamente com os mesmos dados.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Se o segredo for exposto, desative o cliente e registe um novo.
        </p>
        {outcome.kind === "accountFailed" ? (
          <Button onClick={onRetry} disabled={isRetrying}>
            {isRetrying ? "A criar…" : "Tentar criar a conta novamente"}
          </Button>
        ) : (
          <Button
            disabled={!!secret && !confirmed}
            onClick={() => onDone(outcome.accountId)}
          >
            Concluir — ver conta
          </Button>
        )}
      </div>
    </div>
  );
}
