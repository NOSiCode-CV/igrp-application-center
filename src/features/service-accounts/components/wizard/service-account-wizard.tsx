"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { type Resolver, useForm } from "react-hook-form";

import { useApplications } from "@/features/applications/use-applications";
import {
  type OAuthClientFormValues,
  oauthClientFormSchema,
  toCreateRequest,
} from "@/features/oauth-clients/oauth-client-schemas";
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
import { machineClientFormValues } from "../../service-account-schemas";
import {
  useAvailableOAuthClients,
  useCreateServiceAccount,
  useCreateServiceAccountWithNewClient,
} from "../../use-service-accounts";
import { WizardAccessStep } from "./wizard-access-step";
import { WizardClientStep } from "./wizard-client-step";
import { WizardIdentityStep } from "./wizard-identity-step";
import { WizardNewClientForm } from "./wizard-new-client-form";
import { type WizardOutcome, WizardResult } from "./wizard-result";

/** Next.js signals redirect()/notFound() by throwing; never swallow those. */
function isNextSignal(error: unknown) {
  const digest = (error as { digest?: unknown } | null)?.digest;
  return typeof digest === "string" && digest.startsWith("NEXT_REDIRECT");
}

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
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [outcome, setOutcome] = useState<WizardOutcome | null>(null);
  const available = useAvailableOAuthClients();
  const { data: allClients = [] } = useOAuthClients();
  const { data: applications = [] } = useApplications();
  const create = useCreateServiceAccount();
  const clientForm = useForm<OAuthClientFormValues>({
    resolver: zodResolver(
      oauthClientFormSchema,
    ) as Resolver<OAuthClientFormValues>,
    defaultValues: machineClientFormValues(),
    mode: "onBlur",
  });
  const createWithClient = useCreateServiceAccountWithNewClient();

  const existingId =
    state.client?.kind === "existing" ? state.client.oauthClientId : undefined;
  const existing = allClients.find((c) => c.id === existingId);
  // Spec §6.1: an account on an existing client takes that client's state.
  const existingActive =
    typeof existing?.active === "boolean" ? existing.active : undefined;
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

  const holdingSecret = !!outcome?.client.clientSecret;
  useEffect(() => {
    if (!holdingSecret) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [holdingSecret]);

  function failed(error: unknown) {
    if (isNextSignal(error)) throw error;
    igrpToast({
      type: "error",
      title: "Não foi possível criar a conta",
      description: error instanceof Error ? error.message : String(error),
    });
  }

  async function submitExisting() {
    try {
      await createOnExisting();
    } catch (error) {
      failed(error);
    }
  }

  async function createOnExisting() {
    if (!existingId) return;
    const input = toAccountInput(state);
    const result = await create.mutateAsync({
      oauthClientId: existingId,
      ...input,
      active: existingActive ?? input.active,
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível criar a conta",
        // 409: the backend enforces one service account per client.
        description:
          result.status === 409
            ? "Este cliente OAuth já tem uma conta de serviço. Escolha outro cliente no passo 1."
            : result.error,
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

  async function submitNew() {
    try {
      await createWithNewClient();
    } catch (error) {
      failed(error);
    }
  }

  async function createWithNewClient() {
    if (state.client?.kind !== "new") return;
    const account = toAccountInput(state);
    const result = await createWithClient.mutateAsync({
      // "Ativa na criação" drives both the client and the account (spec §6.1).
      client: {
        ...toCreateRequest(state.client.values),
        active: account.active,
      },
      account,
    });
    if (result.success) {
      setOutcome({
        kind: "created",
        client: result.data.client,
        accountId: result.data.account.id,
      });
      // The secret now lives only in `outcome`; drop it from the MutationCache.
      createWithClient.reset();
      return;
    }
    if (result.failedStep === "serviceAccount") {
      setOutcome({
        kind: "accountFailed",
        client: result.client,
        error: result.error,
      });
      createWithClient.reset();
      return;
    }
    if (result.status === 409) {
      setClientMode("new");
      dispatch({ type: "goTo", step: 1 });
      clientForm.setError(
        "clientId",
        { message: "Já existe um cliente com este client ID." },
        { shouldFocus: true },
      );
      return;
    }
    igrpToast({
      type: "error",
      title: "Não foi possível registar o cliente",
      description: result.error,
    });
  }

  async function retryAccount() {
    try {
      await retryOnCreatedClient();
    } catch (error) {
      failed(error);
    }
  }

  async function retryOnCreatedClient() {
    if (outcome?.kind !== "accountFailed") return;
    const input = toAccountInput(state);
    const result = await create.mutateAsync({
      oauthClientId: outcome.client.id,
      ...input,
      // Match the client that was actually created.
      active:
        typeof outcome.client.active === "boolean"
          ? outcome.client.active
          : input.active,
    });
    if (!result.success) {
      setOutcome({ ...outcome, error: result.error });
      return;
    }
    setOutcome({
      kind: "created",
      client: outcome.client,
      accountId: result.data.id,
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
        {outcome ? null : (
          <Button asChild variant="ghost">
            <Link href={ROUTES.SERVICE_ACCOUNTS}>
              <IGRPIcon iconName="X" aria-hidden="true" />
              Cancelar
            </Link>
          </Button>
        )}
        <p className="text-sm text-muted-foreground">
          {outcome
            ? "O cliente OAuth já foi registado. Guarde o segredo antes de sair desta página."
            : "Nada é criado até confirmar no último passo."}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <nav aria-label="Passos">
          <ol className="flex flex-col gap-2">
            {STEPS.map(({ step, title }) => {
              const current = state.step === step;
              const reachable = canGoTo(state, step) && !outcome;
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
          {outcome ? (
            <WizardResult
              outcome={outcome}
              onRetry={retryAccount}
              isRetrying={create.isPending}
              onDone={(id) => router.push(`${ROUTES.SERVICE_ACCOUNTS}/${id}`)}
            />
          ) : (
            <>
              {unavailable && state.step !== 1 ? (
                <Alert variant="destructive" className="mb-6">
                  <AlertDescription>
                    Este cliente não pode receber uma conta de serviço: já tem
                    uma, ou não usa client_credentials. Escolha outro no passo
                    1.
                  </AlertDescription>
                </Alert>
              ) : null}
              {state.step === 1 ? (
                <WizardClientStep
                  state={state}
                  dispatch={dispatch}
                  available={available.data}
                  mode={clientMode}
                  onModeChange={setClientMode}
                  newClientForm={
                    <WizardNewClientForm
                      form={clientForm}
                      onContinue={(values) =>
                        dispatch({
                          type: "chooseClient",
                          client: { kind: "new", values },
                        })
                      }
                    />
                  }
                />
              ) : state.step === 2 ? (
                <WizardIdentityStep
                  state={state}
                  dispatch={dispatch}
                  applicationLabel={applicationLabel}
                  clientActive={
                    state.client?.kind === "existing"
                      ? existingActive
                      : undefined
                  }
                />
              ) : (
                <WizardAccessStep
                  state={state}
                  dispatch={dispatch}
                  onSubmit={
                    state.client?.kind === "new" ? submitNew : submitExisting
                  }
                  isSubmitting={create.isPending || createWithClient.isPending}
                  submitNote={
                    state.client?.kind === "new"
                      ? "Regista o cliente OAuth e cria a conta. O segredo do novo cliente é mostrado uma única vez, a seguir."
                      : "Cria a conta de serviço ligada ao cliente escolhido."
                  }
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
