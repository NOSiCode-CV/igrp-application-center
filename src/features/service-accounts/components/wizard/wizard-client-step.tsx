"use client";

import { type Dispatch, type ReactNode, useId, useState } from "react";

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";

import type { WizardAction, WizardState } from "../../lib/wizard-state";

export function WizardClientStep({
  state,
  dispatch,
  available,
  newClientOption,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  available: readonly OAuthClientDTO[];
  /** Task 10 plugs the "register a new client" branch in here. */
  newClientOption?: ReactNode;
}) {
  const id = useId();
  const initial =
    state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const [oauthClientId, setOAuthClientId] = useState(initial);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">Cliente OAuth</h3>
        <p className="text-sm text-muted-foreground">
          A conta autentica como este cliente. Só aparecem clientes
          client_credentials sem conta de serviço.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${id}-client`}>Usar um cliente OAuth existente</Label>
        <Select value={oauthClientId} onValueChange={setOAuthClientId}>
          <SelectTrigger id={`${id}-client`} aria-label="Cliente OAuth">
            <SelectValue placeholder="Selecionar cliente" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.clientName ? `${c.clientName} — ${c.clientId}` : c.clientId}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {available.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Não há clientes disponíveis. Registe um novo cliente.
          </p>
        ) : null}
      </div>
      {newClientOption}
      <div className="flex justify-end">
        <Button
          disabled={!oauthClientId}
          onClick={() =>
            oauthClientId &&
            dispatch({
              type: "chooseClient",
              client: { kind: "existing", oauthClientId },
            })
          }
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
