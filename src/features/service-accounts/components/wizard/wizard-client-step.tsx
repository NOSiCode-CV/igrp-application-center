"use client";

import { type Dispatch, type ReactNode, useId, useState } from "react";

import {
  Button,
  Label,
  RadioGroup,
  RadioGroupItem,
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
  mode,
  onModeChange,
  newClientForm,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  available: readonly OAuthClientDTO[];
  mode: "existing" | "new";
  onModeChange: (mode: "existing" | "new") => void;
  newClientForm: ReactNode;
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

      <RadioGroup
        value={mode}
        onValueChange={(value) => onModeChange(value as "existing" | "new")}
        className="flex flex-col gap-3"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="existing" id={`${id}-mode-existing`} />
          <Label htmlFor={`${id}-mode-existing`} className="cursor-pointer">
            Usar um cliente OAuth existente
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="new" id={`${id}-mode-new`} />
          <Label htmlFor={`${id}-mode-new`} className="cursor-pointer">
            Registar um novo cliente OAuth
          </Label>
        </div>
      </RadioGroup>

      {mode === "existing" ? (
        <>
          <div className="flex flex-col gap-1.5">
            <Select value={oauthClientId} onValueChange={setOAuthClientId}>
              <SelectTrigger aria-label="Cliente OAuth">
                <SelectValue placeholder="Selecionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {available.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.clientName
                      ? `${c.clientName} — ${c.clientId}`
                      : c.clientId}
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
        </>
      ) : (
        newClientForm
      )}
    </div>
  );
}
