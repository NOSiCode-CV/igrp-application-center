import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";

const settingsConfig: { general: SettingsItem[] } = {
  general: [
    {
      id: "gestao-de-aplicacoes",
      title: "Gestão de Aplicações",
      description: "Crie, edite e gerencie as suas aplicações.",
      icon: "AppWindow",
      href: "/settings/applications",
    },
    {
      id: "gestao-de-utilizadores",
      title: "Gestão de Utilizadores",
      description: "Convide utilizadores e gerencie as suas permissões.",
      icon: "Users",
      href: "/settings/users",
    },
    {
      id: "gestao-de-acessos",
      title: "Gestão de Acessos",
      description: "Gerencie departamentos, perfis e acessos às aplicações.",
      icon: "ShieldCheck",
      href: "/settings/departments",
    },
    {
      id: "customizacao",
      title: "Customização",
      description: "Personalize cores, fontes e imagens da interface.",
      icon: "Palette",
      href: "/settings/theme",
      status: "inativo",
    },
  ],
};

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="text-xl font-semibold">Configurações Gerais</h2>
        <p className="text-sm text-muted-foreground mt-1 mb-6">
          Gerencie aplicações, utilizadores e acessos da plataforma.
        </p>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
          {settingsConfig.general.map((item) => (
            <SettingsCard key={item.id} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
