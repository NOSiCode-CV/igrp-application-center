"use client";

import { IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { ButtonLink } from "@/components/button-link";

interface Props {
  variant: "sidebar-empty" | "sidebar-no-results" | "main-no-departments";
  onCreate?: () => void;
}

const copy = {
  "sidebar-empty": {
    iconSize: "size-8",
    iconStroke: 1.5,
    title: "Nenhum departamento",
    body: "Use o botão 'Novo Departamento' para criar o primeiro departamento para organizar perfis e permissões.",
  },
  "sidebar-no-results": {
    iconSize: "size-8",
    iconStroke: 1.5,
    title: "Nenhum departamento encontrado",
    body: "Tente outro termo na pesquisa ou limpe o campo.",
  },
  "main-no-departments": {
    iconSize: "size-12",
    iconStroke: 1.5,
    title: "Comece por um departamento",
    body: "Os departamentos organizam perfis, permissões e menus. Crie o primeiro para configurar o sistema.",
  },
} as const;

export function DepartmentEmptyState({ variant, onCreate }: Props) {
  const c = copy[variant];
  const isMain = variant === "main-no-departments";

  return (
    <div
      className={
        isMain
          ? "flex flex-col items-center justify-center min-h-[320px] px-6 text-center"
          : "flex flex-col items-center justify-center py-8 px-4 text-center border border-dashed rounded-lg bg-muted/30"
      }
    >
      <div
        className={
          isMain
            ? "p-4 rounded-full bg-muted/50 mb-5"
            : "p-3 rounded-full bg-muted mb-4"
        }
      >
        <IGRPIcon
          iconName="Building2"
          className={`${c.iconSize} text-muted-foreground`}
          strokeWidth={c.iconStroke}
        />
      </div>
      <h3
        className={
          isMain ? "text-lg font-semibold mb-2" : "text-sm font-semibold mb-1"
        }
      >
        {c.title}
      </h3>
      <p
        className={
          isMain
            ? "text-muted-foreground text-sm max-w-sm mb-6"
            : "text-muted-foreground text-xs mb-4 max-w-[220px]"
        }
      >
        {c.body}
      </p>
      {onCreate && (
        <ButtonLink
          onClick={onCreate}
          icon="Plus"
          href="#"
          label="Novo Departamento"
        />
      )}
    </div>
  );
}
