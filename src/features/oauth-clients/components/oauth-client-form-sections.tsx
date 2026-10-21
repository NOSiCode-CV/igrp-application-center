"use client";

import { type ReactNode, useEffect, useRef } from "react";

import {
  Checkbox,
  cn,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPCombobox,
  IGRPIcon,
  Input,
  useFormField,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";

import { ChipInput } from "@/components/chip-input";
import { LimitedTextareaField } from "@/components/limited-textarea-field";
import { useApplications } from "@/features/applications/use-applications";

import { formatSeconds, GRANT_TYPES } from "../lib/oauth-client-utils";
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
  { name: "accessTokenTtl", labelKey: "ttlAccessToken" },
  { name: "refreshTokenTtl", labelKey: "ttlRefreshToken" },
  { name: "authorizationCodeTtl", labelKey: "ttlAuthorizationCode" },
] as const;

// A protocol token, not copy: it is the same in every language.
const CLIENT_CREDENTIALS = "client_credentials";

export type ClientCredentialsLock = { accountName: string } | { unknown: true };

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
  grantTypesFixed,
  children,
}: {
  mode: "create" | "edit";
  lockClientCredentials?: ClientCredentialsLock;
  grantTypesFixed?: boolean;
  children?: ReactNode;
}) {
  const t = useTranslations("oauthClients");
  const lockHelp = (linked: (name: string) => string) =>
    lockClientCredentials
      ? "accountName" in lockClientCredentials
        ? linked(lockClientCredentials.accountName)
        : t("linkUnknown")
      : null;
  const grantLockHelp = lockHelp((name) => t("form.grantLocked", { name }));
  const applicationLockHelp = lockHelp((name) =>
    t("form.applicationLocked", { name }),
  );
  const form = useFormContext<OAuthClientFormValues>();
  const grantTypes = useWatch({ control: form.control, name: "grantTypes" });
  const ttls = useWatch({
    control: form.control,
    name: ["accessTokenTtl", "refreshTokenTtl", "authorizationCodeTtl"],
  });
  const { data: applications = [] } = useApplications();
  const usesRedirects = grantTypes.includes("authorization_code");

  const applicationFieldRef = useRef<HTMLFieldSetElement>(null);
  useEffect(() => {
    applicationFieldRef.current
      ?.querySelector('[role="combobox"]')
      ?.setAttribute("aria-label", t("form.application"));
  });

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
        title={t("form.basicTitle")}
        description={t("form.basicDescription")}
      >
        <FormField
          control={form.control}
          name="clientId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {mode === "create"
                  ? t("form.clientIdRequired")
                  : t("form.clientId")}
              </FormLabel>
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
                  ? t("form.clientIdHelpCreate")
                  : t("form.clientIdHelpEdit")}
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
              <FormLabel>{t("form.name")}</FormLabel>
              <FormControl>
                <Input {...field} autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {mode === "edit" ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">{t("secret.label")}</span>
            <div className="flex h-9 items-center gap-2.5 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              <IGRPIcon iconName="Lock" className="size-4" aria-hidden="true" />
              {t("form.secretHidden")}
            </div>
            <p className="text-sm text-muted-foreground">
              {t("form.secretHelp")}
            </p>
          </div>
        ) : null}
        <LimitedTextareaField
          id="description"
          label={t("form.description")}
          maxLength={140}
        />
        <fieldset
          ref={applicationFieldRef}
          disabled={!!applicationLockHelp}
          className="m-0 min-w-0 border-0 p-0"
        >
          <IGRPCombobox
            name="applicationCode"
            label={t("form.application")}
            placeholder={t("form.applicationPlaceholder")}
            searchText={t("form.applicationSearch")}
            selectLabel={t("form.applicationEmpty")}
            disabled={!!applicationLockHelp}
            options={applications.map((app) => ({
              value: app.code,
              label: app.name || app.code,
            }))}
            helperText={applicationLockHelp ?? t("form.applicationHelp")}
          />
        </fieldset>
      </FormSection>

      <FormSection
        id="sec-grants"
        title={t("form.grantsTitle")}
        description={t("form.grantsDescription")}
      >
        {grantTypesFixed ? (
          <div className="flex items-start gap-3 rounded-lg border border-foreground p-3.5 ring-1 ring-foreground">
            <IGRPIcon
              iconName="Lock"
              className="mt-0.5 size-4"
              aria-hidden="true"
            />
            <span className="flex flex-col gap-1">
              <span className="font-mono text-sm font-medium">
                {CLIENT_CREDENTIALS}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("form.grantFixed")}
              </span>
            </span>
          </div>
        ) : (
          <FormField
            control={form.control}
            name="grantTypes"
            render={({ field }) => (
              <FormItem>
                <GrantTypesFieldset>
                  <legend className="sr-only">{t("form.grantsTitle")}</legend>
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
                            {locked
                              ? grantLockHelp
                              : t(`grants.${grant.descriptionKey}`)}
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
        )}
      </FormSection>

      {usesRedirects ? (
        <FormSection
          id="sec-redirects"
          title={t("form.redirectsTitle")}
          description={t.rich("form.redirectsDescription", {
            mono: (chunks) => <span className="font-mono">{chunks}</span>,
          })}
        >
          <FormField
            control={form.control}
            name="redirectUris"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("form.redirectsLabel")}</FormLabel>
                <FormControl>
                  <ChipInput
                    mono
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("form.redirectsPlaceholder")}
                  />
                </FormControl>
                <FormDescription>{t("form.redirectsHelp")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>
      ) : null}

      <FormSection
        id="sec-scopes"
        title={t("form.scopesTitle")}
        description={t("form.scopesDescription")}
      >
        <FormField
          control={form.control}
          name="scopes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("form.scopesTitle")}</FormLabel>
              <FormControl>
                <ChipInput
                  mono
                  value={field.value}
                  onChange={field.onChange}
                  placeholder={t("form.scopesPlaceholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </FormSection>

      <FormSection
        id="sec-ttl"
        title={t("form.ttlTitle")}
        description={t("form.ttlDescription")}
      >
        <div className="flex flex-col gap-4">
          {TTL_FIELDS.map((ttl, i) => (
            <FormField
              key={ttl.name}
              control={form.control}
              name={ttl.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(`form.${ttl.labelKey}`)}</FormLabel>
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
                      {t("form.seconds")}
                    </span>
                  </div>
                  <FormDescription aria-live="polite">
                    {formatSeconds(t, ttls[i])
                      ? t("form.ttlEquals", {
                          value: formatSeconds(t, ttls[i]),
                        })
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
