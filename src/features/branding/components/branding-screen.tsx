"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import type {
  IGRPBranding,
  IGRPBrandingMode,
} from "@igrp/framework-next-types";
import {
  Form,
  IGRPButton,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useIGRPToast,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import { type FieldErrors, type Resolver, useForm } from "react-hook-form";

import { createBrandingSchema } from "../branding-schemas";
import { BRANDING_GROUPS } from "../catalog";
import {
  type BrandingFormValues,
  LOGO_SLOTS,
  toFormValues,
} from "../lib/branding-mapper";
import { BrandingSaveError } from "../lib/branding-save-error";
import { useBrandingConfig, useSaveBranding } from "../use-branding";
import { LivePreview } from "./live-preview";
import { LogoField } from "./logo-field";
import { ModeSwitch } from "./mode-switch";
import { TokenGroup } from "./token-group";

type Tab = "colors" | "logos";

export function BrandingScreen() {
  const query = useBrandingConfig();
  if (query.isPending) return <Skeleton className="h-96 w-full" />;
  // Page-critical data: let the route error boundary handle it.
  if (query.isError && query.data === undefined) throw query.error;
  return <BrandingEditor saved={query.data} />;
}

function BrandingEditor({ saved }: { saved: IGRPBranding | null }) {
  const t = useTranslations("branding");
  const router = useRouter();
  const { igrpToast } = useIGRPToast();
  const save = useSaveBranding();
  const [mode, setMode] = useState<IGRPBrandingMode>("light");
  const [tab, setTab] = useState<Tab>("colors");

  const schema = useMemo(() => createBrandingSchema(t), [t]);
  const defaults = useMemo(() => toFormValues(saved), [saved]);
  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(schema) as Resolver<BrandingFormValues>,
    defaultValues: defaults,
    mode: "onChange",
  });
  // A save refetches the Brand; the new saved values become the clean state.
  useEffect(() => form.reset(defaults), [defaults, form]);

  const draft = form.watch(`tokens.${mode}`);
  const logos = form.watch("logos");
  const { isDirty } = form.formState;

  function describe(error: unknown): string {
    if (!(error instanceof BrandingSaveError)) return t("errors.generic");
    switch (error.reason) {
      case "upload":
        return t("errors.upload", {
          slot: t(`logos.${error.detail as (typeof LOGO_SLOTS)[number]}.title`),
        });
      case "forbidden":
        return t("errors.forbidden");
      case "invalid":
        return t("errors.invalid");
      default:
        return error.detail || t("errors.generic");
    }
  }

  async function onValid(values: BrandingFormValues) {
    try {
      await save.mutateAsync(values);
      igrpToast({ type: "success", title: t("saved") });
      router.refresh();
    } catch (error) {
      igrpToast({
        type: "error",
        title: t("errors.saveTitle"),
        description: describe(error),
      });
    }
  }

  // Show the first error: switch tab, then Mode, so it is never hidden.
  function onInvalid(errors: FieldErrors<BrandingFormValues>) {
    if (!errors.tokens) {
      setTab("logos");
      return;
    }
    setTab("colors");
    if (!errors.tokens[mode]) setMode(mode === "light" ? "dark" : "light");
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onValid, onInvalid)}
        className="flex flex-col gap-6"
      >
        <header className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
          <Tabs
            value={tab}
            onValueChange={(v) => setTab(v as Tab)}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <TabsList>
                <TabsTrigger value="colors">{t("tabs.colors")}</TabsTrigger>
                <TabsTrigger value="logos">{t("tabs.logos")}</TabsTrigger>
              </TabsList>
              <ModeSwitch mode={mode} onChange={setMode} />
            </div>
            <TabsContent value="colors" className="flex flex-col gap-3">
              {BRANDING_GROUPS.map((group) => (
                <TokenGroup
                  key={group.key}
                  group={group}
                  mode={mode}
                  defaultOpen={group.key === "brand"}
                />
              ))}
            </TabsContent>
            <TabsContent value="logos" className="flex flex-col gap-4">
              {LOGO_SLOTS.map((slot) => (
                <LogoField key={slot} slot={slot} />
              ))}
            </TabsContent>
          </Tabs>

          <LivePreview mode={mode} tokens={draft} logos={logos} />
        </div>

        <div className="sticky bottom-4 flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-sm">
          <p className="text-sm text-muted-foreground" role="status">
            {isDirty ? t("unsaved") : null}
          </p>
          <div className="flex flex-wrap gap-2">
            <IGRPButton
              type="button"
              variant="ghost"
              onClick={() =>
                form.reset(toFormValues(null), { keepDefaultValues: true })
              }
            >
              {t("actions.reset")}
            </IGRPButton>
            <IGRPButton
              type="button"
              variant="outline"
              disabled={!isDirty}
              onClick={() => form.reset(defaults)}
            >
              {t("actions.discard")}
            </IGRPButton>
            <IGRPButton type="submit" disabled={!isDirty || save.isPending}>
              {save.isPending ? t("actions.saving") : t("actions.save")}
            </IGRPButton>
          </div>
        </div>
      </form>
    </Form>
  );
}
