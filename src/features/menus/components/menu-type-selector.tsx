"use client";

import {
  IGRPCardPrimitive,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { menuTypeSchema } from "@/features/menus/menu-schemas";

interface MenuTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const MENU_TYPES = [
  {
    value: "GROUP",
    label: "Grupo",
    icon: "FolderTree",
    description: "Agrupa pastas e menus no nível mais alto",
  },
  {
    value: menuTypeSchema.enum.FOLDER,
    label: "Pasta",
    icon: "Folder",
    description: "Pasta que pode pertencer a um grupo",
  },
  {
    value: menuTypeSchema.enum.MENU_PAGE,
    label: "Página Interna",
    icon: "FileText",
    description: "Menu que abre uma página interna da aplicação",
  },
  {
    value: menuTypeSchema.enum.EXTERNAL_PAGE,
    label: "Página Externa",
    icon: "ExternalLink",
    description: "Menu que abre um link externo",
  },
] as const;

export function MenuTypeSelector({
  value,
  onChange,
  disabled,
}: MenuTypeSelectorProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {MENU_TYPES.map((type) => (
        <button
          key={type.value}
          type="button"
          onClick={() => !disabled && onChange(type.value)}
          disabled={disabled}
          className={`
            text-left rounded-lg border-2 p-0 transition-all
            ${
              value === type.value
                ? "border-primary ring-2 ring-primary/20"
                : "border-transparent hover:border-primary/50"
            }
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <IGRPCardPrimitive className="py-2 border-0">
            <div className="p-3 flex flex-row items-center gap-3">
              <div className="p-3 rounded-full bg-primary/10">
                <IGRPIcon
                  iconName={type.icon}
                  className="size-6 text-primary"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h3 className="font-semibold">{type.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {type.description}
                </p>
              </div>
            </div>
          </IGRPCardPrimitive>
        </button>
      ))}
    </div>
  );
}
