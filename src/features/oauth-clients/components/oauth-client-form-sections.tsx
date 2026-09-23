"use client";

import type { ReactNode } from "react";

import {
  Checkbox,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@igrp/igrp-framework-react-design-system";
import { useFormContext, useWatch } from "react-hook-form";

import { ChipInput } from "@/components/chip-input";
import { useApplications } from "@/features/applications/use-applications";
import { cn } from "@/lib/utils";

import { formatSeconds, GRANT_TYPES } from "../lib/oauth-client-utils";
import type { OAuthClientFormValues } from "../oauth-client-schemas";

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="grid gap-6 p-6 md:grid-cols-[280px_minmax(0,1fr)] md:gap-12 md:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h3 id={id} className="text-base font-semibold">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex max-w-2xl flex-col gap-5">{children}</div>
    </section>
  );
}

const TTL_FIELDS = [
  { name: "accessTokenTtl", label: "Access token" },
  { name: "refreshTokenTtl", label: "Refresh token" },
  { name: "authorizationCodeTtl", label: "Authorization code" },
] as const;

export function OAuthClientFormSections({
  mode,
  lockClientCredentials,
}: {
  mode: "create" | "edit";
  /** Set when a service account is linked: client_credentials stays on. */
  lockClientCredentials?: { accountName: string };
}) {
  const form = useFormContext<OAuthClientFormValues>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const ttls = useWatch({
    control: form.control,
    name: ["accessTokenTtl", "refreshTokenTtl", "authorizationCodeTtl"],
  });
  const { data: applications = [] } = useApplications();
  const usesRedirects = grantTypes.includes("authorization_code");

  return (
    <div className="flex flex-col divide-y divide-border">
      <Section
        id="sec-basic"
        title="Informação básica"
        description="Como o cliente é identificado no servidor de autorização."
      >
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Client ID{mode === "create" ? " *" : ""}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="font-mono"
                  readOnly={mode === "edit"}
                  autoComplete="off"
                  spellCheck={false}
                />
              </FormControl>
              <FormDescription>
                {mode === "create"
                  ? "Minúsculas, números e hífenes. Não pode ser alterado depois."
                  : "Definido no registo. Não pode ser alterado."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="clientName"
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
        {mode === "edit" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Client secret</span>
            <div className="flex h-9 items-center gap-2.5 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              <IGRPIcon iconName="Lock" className="size-4" aria-hidden="true" />
              Mostrado apenas uma vez, no registo
            </div>
            <p className="text-sm text-muted-foreground">
              O servidor guarda só uma versão cifrada — ninguém o pode voltar a
              ler. Se foi exposto, desative este cliente e registe um novo.
            </p>
          </div>
        ) : null}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} maxLength={140} />
              </FormControl>
              <FormDescription>Até 140 caracteres.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="applicationCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Aplicação</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar aplicação" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {applications.map((app) => (
                    <SelectItem key={app.code} value={app.code}>
                      {app.code} — {app.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                A aplicação a que este cliente pertence. Uma conta de serviço
                herda-a.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section
        id="sec-grants"
        title="Grant types"
        description="Como este cliente obtém tokens. As secções abaixo mudam conforme a escolha."
      >
        <FormField
          control={form.control}
          name="grantTypes"
          render={({ field }) => (
            <FormItem>
              <fieldset className="grid gap-3 sm:grid-cols-2">
                <legend className="sr-only">Grant types</legend>
                {GRANT_TYPES.map((grant) => {
                  const checked = field.value.includes(grant.value);
                  const locked =
                    grant.value === "client_credentials" &&
                    !!lockClientCredentials;
                  const inputId = `grant-${grant.value}`;
                  return (
                    <label
                      key={grant.value}
                      htmlFor={inputId}
                      className={cn(
                        "flex cursor-pointer items-start gap-3 rounded-lg border p-3.5",
                        checked
                          ? "border-foreground ring-1 ring-foreground"
                          : "border-input",
                        locked && "cursor-not-allowed",
                      )}
                    >
                      <Checkbox
                        id={inputId}
                        checked={checked}
                        disabled={locked}
                        aria-describedby={`${inputId}-help`}
                        onCheckedChange={(on) =>
                          field.onChange(
                            on === true
                              ? [...field.value, grant.value]
                              : field.value.filter((g) => g !== grant.value),
                          )
                        }
                      />
                      <span className="flex flex-col gap-1">
                        <span className="font-mono text-sm font-medium">
                          {grant.value}
                        </span>
                        <span
                          id={`${inputId}-help`}
                          className="text-sm text-muted-foreground"
                        >
                          {locked
                            ? `Necessário enquanto a conta de serviço «${lockClientCredentials.accountName}» existir.`
                            : grant.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </fieldset>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      {usesRedirects ? (
        <Section
          id="sec-redirects"
          title="Redirect URIs"
          description={
            <>
              Para onde o servidor devolve o utilizador depois do login. Aparece
              porque <span className="font-mono">authorization_code</span> está
              ativo.
            </>
          }
        >
          <FormField
            control={form.control}
            name="redirectUris"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URIs de redirecionamento *</FormLabel>
                <FormControl>
                  <ChipInput
                    mono
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Adicionar URI…"
                  />
                </FormControl>
                <FormDescription>
                  Prima Enter depois de cada URI. Só https://, exceto
                  http://localhost.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>
      ) : null}

      <Section
        id="sec-scopes"
        title="Scopes"
        description="Informação que o cliente pode pedir."
      >
        <FormField
          control={form.control}
          name="scopes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scopes</FormLabel>
              <FormControl>
                <ChipInput
                  mono
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Adicionar scope…"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </Section>

      <Section
        id="sec-ttl"
        title="Duração dos tokens"
        description="Deixe em branco para usar os valores do servidor."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          {TTL_FIELDS.map((ttl, i) => (
            <FormField
              key={ttl.name}
              control={form.control}
              name={ttl.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{ttl.label}</FormLabel>
                  <div className="flex items-center gap-2">
                    <FormControl>
                      <Input
                        inputMode="numeric"
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim();
                          field.onChange(raw === "" ? undefined : Number(raw));
                        }}
                        onBlur={field.onBlur}
                      />
                    </FormControl>
                    <span className="text-sm text-muted-foreground">
                      segundos
                    </span>
                  </div>
                  <FormDescription aria-live="polite">
                    {formatSeconds(ttls[i])
                      ? `= ${formatSeconds(ttls[i])}`
                      : " "}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}
