import type { Metadata } from "next";

import { igrpAuthorize } from "@igrp/framework-next";

import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";
import { AUDIT_VIEW_PERMISSION } from "@/lib/constants";

/* Titles match the heading of the page each card opens, so the label promises
   exactly what the destination delivers. Descriptions name the actions that
   are actually available there — nothing the screen cannot do. */
const settingsConfig: { general: SettingsItem[] } = {
  general: [
    {
      id: "gestao-de-aplicacoes",
      title: "Gestão de Aplicações",
      description:
        "Registe aplicações, edite os seus dados e controle o estado de cada uma.",
      icon: "AppWindow",
      href: "/settings/applications",
      accent: "primary",
    },
    {
      id: "gestao-de-utilizadores",
      title: "Gestão de Utilizadores",
      description:
        "Convide utilizadores e faça a gestão das contas, perfis e permissões.",
      icon: "Users",
      href: "/settings/users",
      accent: "info",
    },
    {
      id: "gestao-de-departamentos",
      title: "Gestão de Departamentos",
      description:
        "Organize a estrutura de departamentos e os perfis, permissões e menus associados.",
      icon: "ShieldCheck",
      href: "/settings/departments",
      accent: "success",
    },
    {
      id: "gestao-contas-servicos",
      title: "Contas e Serviços",
      description:
        "Registe clientes OAuth e faça a gestão das contas de serviço que acedem às APIs.",
      icon: "KeyRound",
      href: "/settings/accounts",
      accent: "primary",
    },
    {
      id: "auditoria-relatorios",
      title: "Auditoria e Relatórios",
      description:
        "Consulte os acessos e as alterações de configuração registados na plataforma.",
      icon: "FileChartColumn",
      href: "/settings/audit",
      accent: "info",
    },
    /* `status: "inativo"` renders these as plain, non-focusable divs with the
       "Em breve" badge. The `href`s are the routes they will take once built;
       nothing links to them while the status is set. */
    {
      id: "customizacao",
      title: "Customização",
      description:
        "Ajuste a identidade visual da plataforma — tema, cores e logotipos.",
      icon: "Palette",
      href: "/settings/customization",
      accent: "warning",
      status: "inativo",
    },
  ],
};

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerir aplicações, utilizadores e acessos da plataforma.",
};

export default async function SettingsPage() {
  const canViewAudit = await igrpAuthorize(AUDIT_VIEW_PERMISSION);
  const items = settingsConfig.general.filter(
    (item) => item.id !== "auditoria-relatorios" || canViewAudit,
  );

  return (
    <div className="flex flex-col gap-12">
      <section>       
        <h1 className="text-xl font-semibold tracking-tight">
          Configurações Gerais
        </h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Escolha a área que quer administrar.
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
