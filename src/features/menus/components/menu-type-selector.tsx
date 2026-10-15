"use client";

import { cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { menuTypeSchema } from "@/features/menus/menu-schemas";

interface MenuTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

/** Type value → `menus.types.*` key (label) and `menus.types.*Description`. */
const MENU_TYPES = [
  { value: menuTypeSchema.enum.GROUP, key: "group", icon: "FolderTree" },
  { value: menuTypeSchema.enum.FOLDER, key: "folder", icon: "Folder" },
  { value: menuTypeSchema.enum.MENU_PAGE, key: "page", icon: "FileText" },
] as const;

/**
 * First step of "New menu": one click picks the type and moves on, so each
 * option is a plain button. Ordered top-down as the tree nests them.
 */
export function MenuTypeSelector({
  value,
  onChange,
  disabled,
}: MenuTypeSelectorProps) {
  const t = useTranslations("menus.types");
  return (
    <div className="flex flex-col gap-2">
      {MENU_TYPES.map((type) => {
        const isSelected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            disabled={disabled}
            aria-pressed={isSelected}
            className={cn(
              "group flex items-center gap-3 rounded-lg border bg-background p-3 text-left transition-colors",
              "hover:border-primary/60 hover:bg-muted/40",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              isSelected && "border-primary bg-primary/5",
            )}
          >
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-md",
                type.value === menuTypeSchema.enum.GROUP
                  ? "bg-primary/10 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <IGRPIcon
                iconName={type.icon}
                className="size-5"
                strokeWidth={2}
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="text-sm font-semibold">{t(type.key)}</span>
              <span className="text-sm text-muted-foreground text-pretty">
                {t(`${type.key}Description`)}
              </span>
            </span>
            <IGRPIcon
              iconName="ChevronRight"
              className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none"
            />
          </button>
        );
      })}
    </div>
  );
}
