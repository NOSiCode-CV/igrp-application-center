"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  IGRPIcon,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { type Resolver, useForm } from "react-hook-form";

import { UnsavedChangesBar } from "@/components/unsaved-changes-bar";
import { useLinkedServiceAccount } from "@/features/service-accounts/use-service-accounts";
import { ROUTES } from "@/lib/constants";

import {
  type OAuthClientFormValues,
  oauthClientFormSchema,
  toFormValues,
  toUpdateRequest,
} from "../oauth-client-schemas";
import { useOAuthClient, useUpdateOAuthClient } from "../use-oauth-clients";
import { OAuthClientActivationDialog } from "./oauth-client-activation-dialog";
import { ActiveBadge, ClientKindBadge } from "./oauth-client-badges";
import { OAuthClientDeleteDialog } from "./oauth-client-delete-dialog";
import { OAuthClientFormSections } from "./oauth-client-form-sections";

const FORM_ID = "oauth-client-edit";

export function OAuthClientDetail({ id }: { id: string }) {
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const { data: client } = useOAuthClient(id);
  const linked = useLinkedServiceAccount(id);
  const update = useUpdateOAuthClient();
  const [dialog, setDialog] = useState<"none" | "activation" | "delete">(
    "none",
  );

  const form = useForm<OAuthClientFormValues>({
    resolver: zodResolver(
      oauthClientFormSchema,
    ) as Resolver<OAuthClientFormValues>,
    defaultValues: client ? toFormValues(client) : undefined,
    mode: "onBlur",
  });

  // Re-seed after a save/refetch so the form's "clean" state matches the server.
  useEffect(() => {
    if (client) form.reset(toFormValues(client));
  }, [client, form]);

  // Leaving with unsaved edits asks first (spec §4.5).
  const isDirty = form.formState.isDirty;
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  if (!client) return null; // page-critical data is prefetched; error.tsx covers failure

  async function onSubmit(values: OAuthClientFormValues) {
    if (!client) return;
    const result = await update.mutateAsync({
      id,
      request: toUpdateRequest(client, values),
    });
    if (!result.success) {
      igrpToast({
        type: "error",
        title: "Não foi possível guardar",
        description: result.error,
      });
      return;
    }
    igrpToast({
      type: "success",
      title: "Alterações guardadas",
      description: client.clientName || client.clientId,
    });
  }

  // Unknown link state fails safe: treat as linked for delete.
  const deleteBlockedReason = linked.account
    ? `Remova primeiro a conta de serviço «${linked.account.name}».`
    : linked.isError || linked.isLoading
      ? "Não foi possível verificar se existe uma conta de serviço."
      : null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center gap-4">
        <div className="flex size-13 items-center justify-center rounded-xl bg-info-subtle text-info-subtle-foreground">
          <IGRPIcon iconName="KeyRound" className="size-6" aria-hidden="true" />
        </div>
        <div className="flex flex-1 flex-col gap-1.5">
          <h2 className="text-2xl font-semibold tracking-tight">
            {client.clientName || client.clientId}
          </h2>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <ClientKindBadge grantTypes={client.grantTypes} />
            <span>
              Client ID{" "}
              <span className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-foreground">
                {client.clientId}
              </span>
            </span>
            <ActiveBadge active={client.active} />
          </div>
        </div>
      </header>

      {linked.duplicate ? (
        <Alert variant="destructive">
          <AlertDescription>
            Este cliente tem mais do que uma conta de serviço associada. Isto
            não devia acontecer — contacte o suporte.
          </AlertDescription>
        </Alert>
      ) : null}

      <Form {...form}>
        <form
          id={FORM_ID}
          onSubmit={form.handleSubmit(onSubmit)}
          noValidate
          className="rounded-xl border border-border bg-card"
        >
          <OAuthClientFormSections
            mode="edit"
            lockClientCredentials={
              linked.account ? { accountName: linked.account.name } : undefined
            }
          />
        </form>
      </Form>

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
                {client.active ? "Desativar cliente" : "Ativar cliente"}
              </span>
              <span className="text-sm text-muted-foreground">
                {client.active
                  ? linked.account
                    ? `Desativa também a conta de serviço «${linked.account.name}». A identidade deixa de conseguir autenticar.`
                    : "As aplicações que usam este cliente deixam de conseguir autenticar. Pode reativá-lo depois."
                  : "O cliente volta a poder pedir tokens."}
              </span>
            </div>
            <Button
              variant={client.active ? "outline" : "default"}
              className={client.active ? "text-destructive" : undefined}
              onClick={() => setDialog("activation")}
            >
              {client.active ? "Desativar" : "Ativar"}
            </Button>
          </div>
          <div className="flex items-center gap-6 p-5">
            <div className="flex flex-1 flex-col gap-1">
              <span className="font-medium">Eliminar cliente</span>
              <span className="text-sm text-muted-foreground">
                {deleteBlockedReason ??
                  "Remove o registo. As credenciais deixam de funcionar de imediato e não é possível recuperá-lo."}
              </span>
            </div>
            <Button
              variant="destructive"
              disabled={!!deleteBlockedReason}
              onClick={() => setDialog("delete")}
            >
              Eliminar
            </Button>
          </div>
        </div>
      </section>

      {isDirty ? (
        <UnsavedChangesBar
          formId={FORM_ID}
          isSaving={update.isPending}
          onDiscard={() => form.reset(toFormValues(client))}
        />
      ) : null}

      {dialog === "activation" ? (
        <OAuthClientActivationDialog
          client={client}
          linkedAccount={linked.account}
          open
          onOpenChange={(o) => !o && setDialog("none")}
        />
      ) : null}
      {dialog === "delete" ? (
        <OAuthClientDeleteDialog
          client={client}
          open
          onOpenChange={(o) => !o && setDialog("none")}
          onDeleted={() => router.push(ROUTES.OAUTH_CLIENTS)}
        />
      ) : null}
    </div>
  );
}
