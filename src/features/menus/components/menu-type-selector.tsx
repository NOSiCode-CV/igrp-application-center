"use client";

import {
  IGRPCardPrimitive,
  IGRPRadioGroupItemPrimitive,
  IGRPRadioGroupPrimitive,
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
    <IGRPRadioGroupPrimitive
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {MENU_TYPES.map((type) => (
        <label key={type.value} className="cursor-pointer">
          <IGRPRadioGroupItemPrimitive
            value={type.value}
            id={type.value}
            className="peer sr-only"
          />
          <IGRPCardPrimitive className="peer-data-[state=checked]:border-primary peer-data-[state=checked]:ring-2 peer-data-[state=checked]:ring-primary/20 hover:border-primary/50 transition-all">
            <div className="p-4 flex flex-col items-center text-center gap-3">
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
        </label>
      ))}
    </IGRPRadioGroupPrimitive>
  );
}