"use client";

import {
  type Dispatch,
  type ReactNode,
  useEffect,
  useId,
  useState,
} from "react";

import {
  Button,
  IGRPCombobox,
  IGRPIcon,
  Label,
  RadioGroup,
  RadioGroupItem,
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
  onDirtyChange,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  available: readonly OAuthClientDTO[];
  mode: "existing" | "new";
  onModeChange: (mode: "existing" | "new") => void;
  newClientForm: ReactNode;
  /** A client picked here but not yet confirmed with Continuar. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const id = useId();
  const initial =
    state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const [oauthClientId, setOAuthClientId] = useState(initial);
  const clientOptions = available.map((c) => ({
    value: c.id,
    label: c.clientName ? `${c.clientName} — ${c.clientId}` : c.clientId,
  }));
  const dirty = oauthClientId !== initial;
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

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
            <IGRPCombobox
              id={`${id}-client`}
              variant="single"
              showSearch={clientOptions.length >= 6}
              options={clientOptions}
              value={oauthClientId ?? ""}
              onChange={(v) =>
                setOAuthClientId(typeof v === "string" && v ? v : undefined)
              }
              placeholder="Selecionar cliente"
              searchText="Pesquisar cliente…"
              selectLabel="Nenhum cliente encontrado."
            />
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
              <IGRPIcon iconName="ArrowRight" aria-hidden="true" />
            </Button>
          </div>
        </>
      ) : (
        newClientForm
      )}
    </div>
  );
}
