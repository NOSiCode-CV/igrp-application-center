import type { Metadata } from "next";

import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";

const settingsConfig: { general: SettingsItem[] } = {
  general: [
    {
      id: "gestao-de-aplicacoes",
      title: "Gestão de Aplicações",
      description: "Crie, edite e faça a gestão das suas aplicações.",
      icon: "AppWindow",
      href: "/settings/applications",
    },
    {
      id: "gestao-de-utilizadores",
      title: "Gestão de Utilizadores",
      description: "Convide utilizadores e faça a gestão das suas permissões.",
      icon: "Users",
      href: "/settings/users",
    },
    {
      id: "gestao-de-departamentos",
      title: "Gestão de Departamentos",
      description:
        "Organize departamentos e os perfis, permissões e menus associados.",
      icon: "ShieldCheck",
      href: "/settings/departments",
    },
  ],
};

export const metadata: Metadata = {
  title: "Configurações",
  description: "Gerir aplicações, utilizadores e acessos da plataforma.",
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-xl font-semibold">Configurações Gerais</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Faça a gestão de aplicações, utilizadores e acessos da plataforma.
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {settingsConfig.general.map((item) => (
            <SettingsCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
