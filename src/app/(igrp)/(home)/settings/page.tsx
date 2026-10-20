import type { Metadata } from "next";

import { igrpAuthorize } from "@igrp/framework-next";
import { getTranslations } from "next-intl/server";

import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";
import { AUDIT_VIEW_PERMISSION, CUSTOMIZE_PERMISSION } from "@/lib/constants";
import { isBrandingEnabled } from "@/lib/utilities";

/** `settings.items.*` key of each card. */
type SettingsItemKey =
  | "applications"
  | "users"
  | "departments"
  | "oauthClients"
  | "audit"
  | "customization";

/* Titles match the heading of the page each card opens, so the label promises
   exactly what the destination delivers. Descriptions name the actions that
   are actually available there — nothing the screen cannot do. Both live in
   the messages under `settings.items.<key>`. */
const settingsConfig: {
  general: (Omit<SettingsItem, "title" | "description"> & {
    key: SettingsItemKey;
  })[];
} = {
  general: [
    {
      id: "gestao-de-aplicacoes",
      key: "applications",
      icon: "AppWindow",
      href: "/settings/applications",
      accent: "primary",
    },
    {
      id: "gestao-de-utilizadores",
      key: "users",
      icon: "Users",
      href: "/settings/users",
      accent: "info",
    },
    {
      id: "gestao-de-departamentos",
      key: "departments",
      icon: "ShieldCheck",
      href: "/settings/departments",
      accent: "success",
    },
    {
      id: "gestao-contas-servicos",
      key: "oauthClients",
      icon: "KeyRound",
      href: "/settings/accounts",
      accent: "primary",
    },
    {
      id: "auditoria-relatorios",
      key: "audit",
      icon: "FileChartColumn",
      href: "/settings/audit",
      accent: "info",
    },
    /* Flag off: a plain, non-focusable div with the "Em breve" badge. Flag on:
       a link for users with the customize permission, hidden for the rest
       (like the audit card). */
    {
      id: "customizacao",
      key: "customization",
      icon: "Palette",
      href: "/settings/customization",
      accent: "warning",
    },
  ],
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settings.meta");
  return { title: t("title"), description: t("description") };
}

export default async function SettingsPage() {
  const brandingEnabled = isBrandingEnabled();
  const [canViewAudit, canCustomize, t] = await Promise.all([
    igrpAuthorize(AUDIT_VIEW_PERMISSION),
    brandingEnabled && igrpAuthorize(CUSTOMIZE_PERMISSION),
    getTranslations("settings"),
  ]);
  const items: SettingsItem[] = settingsConfig.general
    .filter((item) => item.id !== "auditoria-relatorios" || canViewAudit)
    .filter(
      (item) =>
        item.key !== "customization" || !brandingEnabled || canCustomize,
    )
    .map(({ key, ...item }) => ({
      ...item,
      ...(key === "customization" && !brandingEnabled
        ? { status: "inativo" as const }
        : {}),
      title: t(`items.${key}.title`),
      description: t(`items.${key}.description`),
    }));

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          {t("subtitle")}
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <SettingsCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
