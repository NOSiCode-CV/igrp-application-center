"use client";

import { type Dispatch, useEffect, useMemo, useRef } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";

import type { WizardAction, WizardState } from "../../lib/wizard-state";
import {
  emptyIdentityValues,
  makeServiceAccountIdentitySchema,
  SERVICE_ACCOUNT_DESCRIPTION_MAX,
  type ServiceAccountIdentityValues,
} from "../../service-account-schemas";

export function WizardIdentityStep({
  state,
  dispatch,
  applicationLabel,
  clientActive,
  onDirtyChange,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  /** The application's name (its code when unnamed), or "Sem aplicação". */
  applicationLabel: string;
  /**
   * An existing OAuth Client's state. When set, the account follows it
   * (spec §6.1) and no "Ativa na criação" choice is offered.
   */
  clientActive?: boolean;
  /** Edits typed here but not yet confirmed with Continuar. */
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const t = useTranslations("serviceAccounts");
  const tState = useTranslations("oauthClients.badge");
  const tCommon = useTranslations("common.actions");
  const tv = useTranslations("serviceAccounts.validation");
  const identitySchema = useMemo(
    () => makeServiceAccountIdentitySchema(tv),
    [tv],
  );
  const form = useForm<ServiceAccountIdentityValues>({
    resolver: zodResolver(identitySchema),
    // An unconfirmed draft wins over the confirmed values: it is newer.
    defaultValues:
      state.identityDraft ?? state.identity ?? emptyIdentityValues(),
  });
  const dirty = form.formState.isDirty;
  useEffect(() => {
    onDirtyChange?.(dirty);
    return () => onDirtyChange?.(false);
  }, [dirty, onDirtyChange]);

  /* Leaving the step any way other than Continuar (Voltar, or a click in the
     step list) keeps what was typed, so coming back shows it again. */
  const dirtyRef = useRef(false);
  const submittedRef = useRef(false);
  dirtyRef.current = dirty;
  useEffect(
    () => () => {
      if (dirtyRef.current && !submittedRef.current) {
        dispatch({ type: "saveIdentityDraft", identity: form.getValues() });
      }
    },
    [dispatch, form],
  );

  return (
    <Form {...form}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((identity) => {
          submittedRef.current = true;
          dispatch({
            type: "setIdentity",
            identity:
              clientActive === undefined
                ? identity
                : { ...identity, active: clientActive },
          });
        })}
      >
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">{t("shared.identity")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("identityStep.description")}
          </p>
        </div>
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
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">{t("shared.application")}</span>
          <span className="text-sm">{applicationLabel}</span>
          <span className="text-sm text-muted-foreground">
            {t("shared.inheritedApplication")}
          </span>
        </div>
        {clientActive === undefined ? (
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(c) => field.onChange(c === true)}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  {t("identityStep.activeOnCreate")}
                </FormLabel>
              </FormItem>
            )}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            {t("identityStep.followsClient", {
              state: clientActive ? tState("active") : tState("inactive"),
            })}
          </p>
        )}
        <div className="flex justify-between">
          <Button
            type="button"
            variant="secondary"
            onClick={() => dispatch({ type: "goTo", step: 1 })}
          >
            <IGRPIcon iconName="ArrowLeft" aria-hidden="true" />
            {tCommon("back")}
          </Button>
          <Button type="submit">
            {t("shared.continue")}
            <IGRPIcon iconName="ArrowRight" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </Form>
  );
}
