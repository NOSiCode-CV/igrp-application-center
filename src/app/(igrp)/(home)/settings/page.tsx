"use client";

import { useRouter } from "next/navigation";
import { cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

const settingsConfig = {
  personal: [
    {
      id: "gestao-de-aplicacoes",
      title: "Gestão de Aplicações",
      description:
        "Aqui voce pode gerenciar as suas aplicações, incluindo criar, editar e excluir.",
      icon: "AppWindow",
      href: "/settings/applications",
    },
    {
      id: "gestao-de-utilizadores",
      title: "Gestão de Utilizadores",
      description:
        "Aqui voce pode gerenciar os seus utilizadores, convidar e gerenciar as suas permissões.",
      icon: "Users",
      href: "/settings/users",
    },
    {
      id: "gestao-de-acessos",
      title: "Gestão de Acessos",
      description:
        "Aqui voce pode gerenciar os seus acessos, departamentos e perfis e aplicações.",
      icon: "ShieldCheck",
      href: "/settings/departments",
    },
    {
      id: "customizacao",
      title: "Customização",
      description:
        "Aqui voce pode personalizar a sua interface, incluindo cores, fontes e imagens.",
      icon: "Palette",
      href: "/settings/theme",
      status: "inativo",
    },
  ],
};

export default function SettingsPage() {
  const router = useRouter();

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <div className="mx-auto space-y-12">
      <section>
        <h2 className="text-xl font-semibold mb-6">Configurações Gerais</h2>
        <div className="grid gap-4 grid-cols-none sm:grid-cols-3 md:grid-cols-4">
          {settingsConfig.personal.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.href)}
              disabled={item.status === "inativo"}
              className={cn(
                "text-left p-5 rounded-lg border-0 bg-accent/20 cursor-pointer hover:bg-accent/50 transition-colors",
                {
                  "opacity-50 cursor-not-allowed": item.status === "inativo",
                },
              )}
            >
              <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-md bg-primary/10 shrink-0">
                  <IGRPIcon
                    iconName={item.icon as any}
                    className="w-5 h-5 text-primary"
                  />
                </div>
                <div className="space-y-1 min-w-0">
                  <h3 className="font-medium text-primary">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-snug">
                    {item.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
