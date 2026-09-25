"use client";

import { useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { useForm } from "react-hook-form";
import type { z } from "zod";

import { LimitedTextareaField } from "@/components/limited-textarea-field";
import { formatDate } from "@/lib/app-utilities";

import {
  SERVICE_ACCOUNT_DESCRIPTION_MAX,
  serviceAccountIdentitySchema,
} from "../service-account-schemas";
import {
  useAccountBusy,
  useUpdateServiceAccountIdentity,
} from "../use-service-accounts";

const identitySchema = serviceAccountIdentitySchema.pick({
  name: true,
  description: true,
});
type IdentityValues = z.infer<typeof identitySchema>;

function timestamp(value?: string) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return formatDate(value);
}

export function ServiceAccountIdentityCard({
  account,
}: {
  account: ServiceAccountDTO;
}) {
  const { igrpToast } = useIGRPToast();
  const update = useUpdateServiceAccountIdentity(account.id);
  const busy = useAccountBusy(account.id);
  const [editing, setEditing] = useState(false);
  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    values: { name: account.name, description: account.description ?? "" },
  });

  async function onSubmit(values: IdentityValues) {
    const result = await update.mutateAsync({
      id: account.id,
      identity: {
        name: values.name,
        description: values.description || undefined,
      },
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
      title: "Identidade guardada",
      description: values.name,
    });
    setEditing(false);
  }

  return (
    <section
      aria-labelledby="sa-identity"
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h3 id="sa-identity" className="font-semibold">
          Identidade
        </h3>
        {editing ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            Editar identidade
          </Button>
        )}
      </div>
      {editing ? (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            noValidate
            className="flex flex-col gap-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LimitedTextareaField
              id="description"
              label="Descrição"
              maxLength={SERVICE_ACCOUNT_DESCRIPTION_MAX}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={update.isPending}
                onClick={() => {
                  form.reset();
                  setEditing(false);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={busy}>
                {update.isPending ? "A guardar…" : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Descrição</dt>
            <dd>{account.description || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Aplicação</dt>
            <dd className="flex flex-col gap-0.5">
              <span className="font-mono">
                {account.applicationCode ?? "—"}
              </span>
              <span className="text-muted-foreground">
                Herdada do cliente OAuth.
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Criada em</dt>
            <dd>{timestamp(account.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">Atualizada em</dt>
            <dd>{timestamp(account.updatedAt)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
