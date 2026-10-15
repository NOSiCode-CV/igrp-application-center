"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  cn,
  Form,
  IGRPAlertDialog,
  IGRPIcon,
  Separator,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { OAuthClientDTO } from "@igrp/platform-access-management-client-ts";
import { type Resolver, useForm } from "react-hook-form";

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";
import { ROUTES } from "@/lib/constants";

import {
  emptyOAuthClientFormValues,
  type OAuthClientFormValues,
  oauthClientFormSchema,
  toCreateRequest,
} from "../oauth-client-schemas";
import { useCreateOAuthClient } from "../use-oauth-clients";
import { OAuthClientFormSections } from "./oauth-client-form-sections";

export function OAuthClientCreate() {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const create = useCreateOAuthClient();
  // The secret lives only here: never in the query cache or the URL.
  const [created, setCreated] = useState<OAuthClientDTO | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const { reset: resetCreate } = create;
  useEffect(() => () => resetCreate(), [resetCreate]);
  const submitting = create.isPending;

  const form = useForm<OAuthClientFormValues>({
    resolver: zodResolver(
      oauthClientFormSchema,
    ) as Resolver<OAuthClientFormValues>,
    defaultValues: emptyOAuthClientFormValues(),
    mode: "onBlur",
  });

  // Defaults don't count: isDirty compares against them, so only real input
  // asks before leaving. Read during render so the form tracks it.
  const isDirty = form.formState.isDirty;
  const [confirmLeave, setConfirmLeave] = useState(false);

  // Reloading or closing the tab before confirming would lose the secret.
  const holdingSecret = !!created?.clientSecret && !confirmed;
  useEffect(() => {
    if (!holdingSecret) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [holdingSecret]);

  async function onSubmit(values: OAuthClientFormValues) {
    const result = await create.mutateAsync(toCreateRequest(values));
    if (result.success) {
      setCreated(result.data);
      // The secret now lives only in `created`; drop it from the MutationCache.
      resetCreate();
      return;
    }
    if (result.status === 409) {
      form.setError(
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-5 py-3">
        {created ? null : submitting ? (
          <Button variant="secondary" disabled>
            <IGRPIcon iconName="X" aria-hidden="true" />
            Cancelar
          </Button>
        ) : (
          <Button asChild variant="secondary">
            <Link
              href={ROUTES.OAUTH_CLIENTS}
              onClick={(e) => {
                if (!isDirty) return;
                e.preventDefault();
                setConfirmLeave(true);
              }}
            >
              <IGRPIcon iconName="X" aria-hidden="true" />
              Cancelar
            </Link>
          </Button>
        )}
        {/* Same note as the service-account wizard's top bar: info before
            registering, warning once the one-time secret is on screen. */}
        <p
          role="note"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium",
            created
              ? "bg-warning-subtle text-warning-subtle-foreground"
              : "bg-info-subtle text-info-subtle-foreground",
          )}
        >
          <IGRPIcon
            iconName={created ? "TriangleAlert" : "Info"}
            className="size-4 shrink-0"
            aria-hidden="true"
          />
          {created
            ? "O cliente OAuth já foi registado. Guarde o segredo antes de sair desta página."
            : "O segredo é mostrado uma única vez, no fim do registo."}
        </p>
      </div>

      {created ? (
        <CreatedResult
          client={created}
          confirmed={confirmed}
          onConfirmedChange={setConfirmed}
          onDone={() => router.push(`${ROUTES.OAUTH_CLIENTS}/${created.id}`)}
        />
      ) : (
        <>
          <h2 className="text-2xl font-semibold tracking-tight">
            Registar cliente OAuth2
          </h2>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              noValidate
              className="rounded-xl border border-border bg-card"
            >
              <OAuthClientFormSections mode="create" />
              <Separator />
              <div className="flex justify-end p-4">
                <Button type="submit" disabled={submitting}>
                  <IGRPIcon iconName="Save" aria-hidden="true" />
                  {submitting ? "A registar…" : "Registar"}
                </Button>
              </div>
            </form>
          </Form>
        </>
      )}

      <IGRPAlertDialog
        open={confirmLeave}
        onOpenChange={setConfirmLeave}
        variant="destructive"
        title="Sair sem registar o cliente?"
        description="Os dados que preencheu ainda não foram guardados. Se sair agora, vai perdê-los."
        cancelLabel="Continuar a preencher"
        actionLabel="Sair e descartar"
        onAction={() => router.push(ROUTES.OAUTH_CLIENTS)}
      />
    </div>
  );
}

function CreatedResult({
  client,
  confirmed,
  onConfirmedChange,
  onDone,
}: {
  client: OAuthClientDTO;
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
  onDone: () => void;
}) {
  const secret = client.clientSecret;
  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Cliente registado</h2>
        <p className="text-sm text-muted-foreground">
          O cliente{" "}
          <span className="font-mono text-foreground">{client.clientId}</span>{" "}
          {secret
            ? "já pode pedir tokens. Guarde as credenciais antes de sair."
            : "foi criado, mas sem credenciais utilizáveis."}
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
            onConfirmedChange={onConfirmedChange}
          />
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Se o segredo for exposto, gere um novo nos detalhes do cliente.
            </p>
            <Button type="button" disabled={!confirmed} onClick={onDone}>
              Concluir — ver detalhes
            </Button>
          </div>
        </>
      ) : (
        <>
          <Alert variant="destructive">
            <IGRPIcon iconName="TriangleAlert" aria-hidden="true" />
            <AlertDescription>
              O servidor não devolveu o segredo. Gere um novo nos detalhes do
              cliente.
            </AlertDescription>
          </Alert>
          <div className="flex justify-end">
            <Button type="button" onClick={onDone}>
              Ver detalhes
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
