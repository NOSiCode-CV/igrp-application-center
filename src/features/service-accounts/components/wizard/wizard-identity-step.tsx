"use client";

import type { Dispatch } from "react";

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
  Input,
} from "@igrp/igrp-framework-react-design-system";
import { useForm } from "react-hook-form";

import { LimitedTextareaField } from "@/components/limited-textarea-field";

import type { WizardAction, WizardState } from "../../lib/wizard-state";
import {
  emptyIdentityValues,
  type ServiceAccountIdentityValues,
  serviceAccountIdentitySchema,
} from "../../service-account-schemas";

export function WizardIdentityStep({
  state,
  dispatch,
  applicationLabel,
}: {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
  /** "INV — Faturação", or "Sem aplicação". */
  applicationLabel: string;
}) {
  const form = useForm<ServiceAccountIdentityValues>({
    resolver: zodResolver(serviceAccountIdentitySchema),
    defaultValues: state.identity ?? emptyIdentityValues(),
  });

  return (
    <Form {...form}>
      <form
        noValidate
        className="flex flex-col gap-6"
        onSubmit={form.handleSubmit((identity) =>
          dispatch({ type: "setIdentity", identity }),
        )}
      >
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">Identidade</h3>
          <p className="text-sm text-muted-foreground">
            Como esta conta aparece aos administradores.
          </p>
        </div>
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
          maxLength={255}
        />
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Aplicação</span>
          <span className="font-mono text-sm">{applicationLabel}</span>
          <span className="text-sm text-muted-foreground">
            Herdada do cliente OAuth.
          </span>
        </div>
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
              <FormLabel className="font-normal">Ativa na criação</FormLabel>
            </FormItem>
          )}
        />
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => dispatch({ type: "goTo", step: 1 })}
          >
            Voltar
          </Button>
          <Button type="submit">Continuar</Button>
        </div>
      </form>
    </Form>
  );
}
