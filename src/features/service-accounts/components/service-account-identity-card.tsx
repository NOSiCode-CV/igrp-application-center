"use client";

import { useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
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
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";

import {
  makeServiceAccountIdentitySchema,
  SERVICE_ACCOUNT_DESCRIPTION_MAX,
  type ServiceAccountIdentityValues,
} from "../service-account-schemas";
import {
  useAccountBusy,
  useUpdateServiceAccountIdentity,
} from "../use-service-accounts";

type IdentityValues = Pick<
  ServiceAccountIdentityValues,
  "name" | "description"
>;

export function ServiceAccountIdentityCard({
  account,
}: {
  account: ServiceAccountDTO;
}) {
  const t = useTranslations("serviceAccounts");
  const tv = useTranslations("serviceAccounts.validation");
  const { formatDateTime } = useIGRPFormat();
  const identitySchema = useMemo(
    () =>
      makeServiceAccountIdentitySchema(tv).pick({
        name: true,
        description: true,
      }),
    [tv],
  );
  const { igrpToast } = useIGRPToast();
  const update = useUpdateServiceAccountIdentity(account.id);
  const busy = useAccountBusy(account.id);
  const [editing, setEditing] = useState(false);
  const form = useForm<IdentityValues>({
    resolver: zodResolver(identitySchema),
    values: { name: account.name, description: account.description ?? "" },
  });

  function timestamp(value?: string) {
    if (!value || Number.isNaN(new Date(value).getTime())) return "—";
    return formatDateTime(new Date(value), {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

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
        title: t("identityCard.saveErrorTitle"),
        description: result.error,
      });
      return;
    }
    igrpToast({
      type: "success",
      title: t("identityCard.savedTitle"),
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
          {t("shared.identity")}
        </h3>
        {editing ? null : (
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => setEditing(true)}
          >
            {t("identityCard.edit")}
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
                  <FormLabel>{t("shared.name")}</FormLabel>
                  <FormControl>
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <LimitedTextareaField
              id="description"
              label={t("shared.description")}
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
                {t("shared.cancel")}
              </Button>
              <Button type="submit" disabled={busy}>
                {update.isPending ? t("shared.saving") : t("shared.save")}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <dl className="flex flex-col gap-3 text-sm">
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t("shared.description")}</dt>
            <dd>{account.description || "—"}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">{t("shared.application")}</dt>
            <dd className="flex flex-col gap-0.5">
              <span className="font-mono">
                {account.applicationCode ?? "—"}
              </span>
              <span className="text-muted-foreground">
                {t("shared.inheritedApplication")}
              </span>
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">
              {t("identityCard.createdAt")}
            </dt>
            <dd>{timestamp(account.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-muted-foreground">
              {t("identityCard.updatedAt")}
            </dt>
            <dd>{timestamp(account.updatedAt)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
}
