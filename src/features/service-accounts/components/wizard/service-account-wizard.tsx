"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducer } from "react";

import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";

import { useApplications } from "@/features/applications/use-applications";
import { useOAuthClients } from "@/features/oauth-clients/use-oauth-clients";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";

import {
  canGoTo,
  initialWizardState,
  stepSummary,
  toAccountInput,
  type WizardStep,
  wizardReducer,
} from "../../lib/wizard-state";
import {
  useAvailableOAuthClients,
  useCreateServiceAccount,
} from "../../use-service-accounts";
import { WizardAccessStep } from "./wizard-access-step";
import { WizardClientStep } from "./wizard-client-step";
import { WizardIdentityStep } from "./wizard-identity-step";

const STEPS: { step: WizardStep; title: string }[] = [
  { step: 1, title: "Cliente OAuth" },
  { step: 2, title: "Identidade" },
  { step: 3, title: "Perfis e permissões" },
];

export function ServiceAccountWizard({
  initialOAuthClientId,
}: {
  initialOAuthClientId?: string;
}) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const [state, dispatch] = useReducer(
    wizardReducer,
    initialOAuthClientId,
    initialWizardState,
  );
  const available = useAvailableOAuthClients();
  const { data: allClients = [] } = useOAuthClients();
  const { data: applications = [] } = useApplications();
  const create = useCreateServiceAccount();

  const existingId =
    state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const existing = allClients.find((c) => c.id === existingId);
  const unavailable =
    !!existingId &&
    !available.isLoading &&
    !available.data.some((c) => c.id === existingId);

  const applicationCode =
    state.client?.kind === "new"
      ? state.client.values.applicationCode
      : existing?.applicationCode;
  const appName = applications.find((a) => a.code === applicationCode)?.name;
  const applicationLabel = applicationCode
    ? `${applicationCode}${appName ? ` — ${appName}` : ""}`
    : "Sem aplicação";

  const clientLabel = (id: string) => {
    const c = allClients.find((x) => x.id === id);
    return c
      ? c.clientName
        ? `${c.clientName} · ${c.clientId}`
        : c.clientId
      : id;
  };

  async function submitExisting() {
    if (!existingId) return;
    const result = await create.mutateAsync({
      oauthClientId: existingId,
      ...toAccountInput(state),
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível criar a conta",
        description: result.error,
      });
      return;
    }
    igrpToast({
      type: "success",
      title: "Conta de serviço criada",
      description: result.data.name,
    });
    router.push(`${ROUTES.SERVICE_ACCOUNTS}/${result.data.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
        <Button asChild variant="ghost">
          <Link href={ROUTES.SERVICE_ACCOUNTS}>
            <IGRPIcon iconName="X" aria-hidden="true" />
            Cancelar
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">
          Nada é criado até confirmar no último passo.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Passos">
          <ol className="flex flex-col gap-2">
            {STEPS.map(({ step, title }) => {
              const current = state.step === step;
              const reachable = canGoTo(state, step);
              const summary =
                step < state.step || (reachable && !current)
                  ? stepSummary(state, step, clientLabel)
                  : undefined;
              return (
                <li key={step}>
                  <button
                    type="button"
                    disabled={!reachable || current}
                    aria-current={current ? "step" : undefined}
                    onClick={() => dispatch({ type: "goTo", step })}
                    className={cn(
                      "flex w-full flex-col items-start gap-0.5 rounded-lg p-3 text-left",
                      current
                        ? "bg-muted"
                        : "hover:bg-muted disabled:hover:bg-transparent",
                    )}
                  >
                    <span className="flex items-center gap-2 font-medium">
                      {summary ? (
                        <IGRPIcon
                          iconName="Check"
                          className="size-4 text-success"
                          aria-hidden="true"
                        />
                      ) : (
                        <span className="text-muted-foreground">{step}.</span>
                      )}
                      {title}
                    </span>
                    {summary ? (
                      <span className="text-sm text-muted-foreground">
                        {summary}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="rounded-xl border border-border bg-card p-6">
          {unavailable && state.step !== 1 ? (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>
                Este cliente não pode receber uma conta de serviço: já tem uma,
                ou não usa client_credentials. Escolha outro no passo 1.
              </AlertDescription>
            </Alert>
          ) : null}
          {state.step === 1 ? (
            <WizardClientStep
              state={state}
              dispatch={dispatch}
              available={available.data}
            />
          ) : state.step === 2 ? (
            <WizardIdentityStep
              state={state}
              dispatch={dispatch}
              applicationLabel={applicationLabel}
            />
          ) : (
            <WizardAccessStep
              state={state}
              dispatch={dispatch}
              onSubmit={submitExisting}
              isSubmitting={create.isPending}
              submitNote="Cria a conta de serviço ligada ao cliente escolhido."
            />
          )}
        </div>
      </div>
    </div>
  );
}
