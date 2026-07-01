import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  IGRPIconList,
  type IGRPIconName,
  type IGRPOptionsProps,
} from "@igrp/igrp-framework-react-design-system";

import { formatIconString } from "@/lib/app-utilities";

import { menuTargetSchema, menuTypeSchema } from "./menu-schemas";

export const LUCIDE_ICON_OPTIONS: IGRPOptionsProps[] = (
  Object.keys(IGRPIconList) as IGRPIconName[]
)
  .sort((a, b) => a.localeCompare(b))
  .map((name) => ({ value: name, label: formatIconString(name) }));

export function getNextMenuPosition(
  menus: IGRPMenuItemArgs[],
  parentCode?: string | null,
): number {
  const normalizedParent = parentCode ?? null;
  const siblings = menus.filter(
    (m) => (m.parentCode ?? null) === normalizedParent,
  );
  if (siblings.length === 0) return 0;
  return Math.max(...siblings.map((m) => m.position ?? 0)) + 1;
}

export const menuTypeOptions = [
  { value: "GROUP", label: "Grupo" },
  { value: menuTypeSchema.enum.FOLDER, label: "Pasta" },
  { value: menuTypeSchema.enum.MENU_PAGE, label: "Página Interna" },
  { value: menuTypeSchema.enum.EXTERNAL_PAGE, label: "Página Externa" },
] as const;

export const menuTargetOptions = [
  { value: menuTargetSchema.enum._self, label: "Neste separador" },
  { value: menuTargetSchema.enum._blank, label: "Novo separador" },
] as const;

export const MENU_VIEW = "view";
