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
  useFormField,
} from "@igrp/igrp-framework-react-design-system";
import { useFormContext, useWatch } from "react-hook-form";

import { ChipInput } from "@/components/chip-input";
import { useApplications } from "@/features/applications/use-applications";
import { cn } from "@/lib/utils";

import {
  formatSeconds,
  GRANT_TYPES,
  LINK_UNKNOWN_REASON,
} from "../lib/oauth-client-utils";
import {
  DEFAULT_WEB_SCOPES,
  type OAuthClientFormValues,
} from "../oauth-client-schemas";

export function FormSection({
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

/**
 * `{ accountName }` — a service account is linked. `{ unknown: true }` — the
 * link could not be checked (loading or failed), so fail safe and lock anyway.
 */
export type ClientCredentialsLock = { accountName: string } | { unknown: true };

/** FormMessage only renders on error; point the group at it while it does. */
function GrantTypesFieldset({ children }: { children: ReactNode }) {
  const { error, formMessageId } = useFormField();
  return (
    <fieldset
      className="grid gap-3 sm:grid-cols-2"
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? formMessageId : undefined}
    >
      {children}
    </fieldset>
  );
}

export function OAuthClientFormSections({
  mode,
  lockClientCredentials,
  children,
}: {
  mode: "create" | "edit";
  /**
   * Set when a service account is (or may be) linked: client_credentials
   * stays on and the application is fixed (the SA inherits it, spec §1).
   */
  lockClientCredentials?: ClientCredentialsLock;
  /** Extra sections appended after the form's own (e.g. the detail's "Registo"). */
  children?: ReactNode;
}) {
  const lockHelp = (linked: (name: string) => string) =>
    lockClientCredentials
      ? "accountName" in lockClientCredentials
        ? linked(lockClientCredentials.accountName)
        : LINK_UNKNOWN_REASON
      : null;
  const grantLockHelp = lockHelp(
    (name) => `Necessário enquanto a conta de serviço «${name}» existir.`,
  );
  const applicationLockHelp = lockHelp(
    (name) => `Fixa enquanto a conta de serviço «${name}» existir.`,
  );
  const form = useFormContext<OAuthClientFormValues>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const ttls = useWatch({
    control: form.control,
    name: ["accessTokenTtl", "refreshTokenTtl", "authorizationCodeTtl"],
  });
  const { data: applications = [] } = useApplications();
  const usesRedirects = grantTypes.includes("authorization_code");

  /**
   * Scope defaults follow the grant selection on create (spec §4.3): a
   * client_credentials-only client drops the untouched web defaults, and
   * re-selecting authorization_code with no scopes restores them. Edits the
   * admin made to the scopes are never overwritten.
   */
  function syncScopeDefaults(
    prev: OAuthClientFormValues["grantTypes"],
    next: OAuthClientFormValues["grantTypes"],
  ) {
    if (mode !== "create") return;
    const scopes = form.getValues("scopes");
    const isDefault =
      scopes.length === DEFAULT_WEB_SCOPES.length &&
      DEFAULT_WEB_SCOPES.every((s) => scopes.includes(s));
    const machineOnly = next.length === 1 && next[0] === "client_credentials";
    if (machineOnly && isDefault) {
      form.setValue("scopes", [], { shouldDirty: true });
    } else if (
      next.includes("authorization_code") &&
      !prev.includes("authorization_code") &&
      scopes.length === 0
    ) {
      form.setValue("scopes", [...DEFAULT_WEB_SCOPES], { shouldDirty: true });
    }
  }

  return (
    <div className="flex flex-col divide-y divide-border">
      <FormSection
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
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={!!applicationLockHelp}
              >
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
                {applicationLockHelp ??
                  "A aplicação a que este cliente pertence. Uma conta de serviço herda-a."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection
        id="sec-grants"
        title="Grant types"
        description="Como este cliente obtém tokens. As secções abaixo mudam conforme a escolha."
      >
        <FormField
          control={form.control}
          name="grantTypes"
          render={({ field }) => (
            <FormItem>
              <GrantTypesFieldset>
                <legend className="sr-only">Grant types</legend>
                {GRANT_TYPES.map((grant) => {
                  const checked = field.value.includes(grant.value);
                  const locked =
                    grant.value === "client_credentials" && !!grantLockHelp;
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
                        onCheckedChange={(on) => {
                          const next =
                            on === true
                              ? [...field.value, grant.value]
                              : field.value.filter((g) => g !== grant.value);
                          field.onChange(next);
                          syncScopeDefaults(field.value, next);
                        }}
                      />
                      <span className="flex flex-col gap-1">
                        <span className="font-mono text-sm font-medium">
                          {grant.value}
                        </span>
                        <span
                          id={`${inputId}-help`}
                          className="text-sm text-muted-foreground"
                        >
                          {locked ? grantLockHelp : grant.description}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </GrantTypesFieldset>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormSection>

      {usesRedirects ? (
        <FormSection
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
        </FormSection>
      ) : null}

      <FormSection
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
      </FormSection>

      <FormSection
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
      </FormSection>
      {children}
    </div>
  );
}
