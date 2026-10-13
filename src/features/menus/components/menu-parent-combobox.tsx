"use client";

import { useEffect, useState } from "react";

import type { IGRPMenuItemArgs } from "@igrp/framework-next-types";
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  cn,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  IGRPIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import type { Control } from "react-hook-form";
import { useFormContext, useWatch } from "react-hook-form";

import { type CreateMenu, menuTypeSchema } from "@/features/menus/menu-schemas";

import { MenuChoiceGroup } from "./menu-choice-group";

interface MenuParentComboboxProps {
  control: Control<CreateMenu>;
  menuType: string;
  groupOptions: IGRPMenuItemArgs[];
  folderOptions: IGRPMenuItemArgs[];
  disabled?: boolean;
  /** Parent fixed by the caller (e.g. "Add page" on a folder): shown, not editable. */
  locked?: boolean;
}

type ParentType = "GROUP" | "FOLDER";

/** Parent type → `menus.types.*` key. */
const PARENT_TYPE_KEYS = { GROUP: "group", FOLDER: "folder" } as const;

function parentTypeOf(
  folderOptions: IGRPMenuItemArgs[],
  code?: string,
): ParentType {
  return folderOptions.some((f) => f.code === code) ? "FOLDER" : "GROUP";
}

export function MenuParentCombobox({
  control,
  menuType,
  groupOptions,
  folderOptions,
  disabled,
  locked,
}: MenuParentComboboxProps) {
  const t = useTranslations("menus");
  const isFolder = menuType === menuTypeSchema.enum.FOLDER;
  const isPage =
    menuType === menuTypeSchema.enum.MENU_PAGE ||
    menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  const { setValue } = useFormContext<CreateMenu>();
  const parentCode = useWatch({ control, name: "parentCode" });
  const isReadOnly = disabled || locked;

  // Derived on mount so a page opened under a folder never passes through
  // GROUP — a switch there clears the parent (handleParentTypeChange).
  const [parentType, setParentType] = useState<ParentType>(() =>
    parentTypeOf(folderOptions, parentCode),
  );

  useEffect(() => {
    if (parentCode && isPage) {
      setParentType(parentTypeOf(folderOptions, parentCode));
    }
  }, [parentCode, isPage, folderOptions]);

  function handleParentTypeChange(type: ParentType) {
    if (isReadOnly || type === parentType) return;
    setParentType(type);
    setValue("parentCode", undefined);
  }

  const activeOptions = isPage
    ? parentType === "GROUP"
      ? groupOptions
      : folderOptions
    : groupOptions;

  const isGroupParent = isFolder || parentType === "GROUP";

  const placeholder = isGroupParent
    ? t("form.selectGroup")
    : t("form.selectFolder");

  const fieldLabel = isGroupParent
    ? t("form.groupOptional")
    : t("form.folderOptional");

  return (
    <div className="flex flex-col gap-4">
      {isPage && (
        <MenuChoiceGroup<ParentType>
          name="parent-type"
          aria-label={t("form.parentType")}
          value={parentType}
          options={(["GROUP", "FOLDER"] as const).map((type) => ({
            value: type,
            label: t(`types.${PARENT_TYPE_KEYS[type]}`),
          }))}
          onChange={handleParentTypeChange}
          disabled={isReadOnly}
        />
      )}

      <FormField
        control={control}
        name="parentCode"
        render={({ field }) => {
          const selected = activeOptions.find((m) => m.code === field.value);
          return (
            <FormItem>
              <FormLabel>{fieldLabel}</FormLabel>
              <Popover>
                <PopoverTrigger asChild disabled={isReadOnly}>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal"
                    >
                      {selected ? (
                        <span className="flex min-w-0 items-center gap-2">
                          <IGRPIcon
                            iconName={
                              selected.icon ||
                              (isGroupParent ? "FolderTree" : "Folder")
                            }
                            className="size-4 shrink-0 text-muted-foreground"
                          />
                          <span className="truncate">{selected.name}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">
                          {t("form.noneRoot")}
                        </span>
                      )}
                      <IGRPIcon
                        iconName="ChevronsUpDown"
                        className="text-muted-foreground"
                      />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[--radix-popover-trigger-width] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder={placeholder} />
                    <CommandList>
                      <CommandEmpty>
                        {parentType === "GROUP"
                          ? t("form.noGroupFound")
                          : t("form.noFolderFound")}
                      </CommandEmpty>
                      <CommandGroup>
                        <CommandItem onSelect={() => field.onChange(undefined)}>
                          {t("form.noneRoot")}
                          <IGRPIcon
                            iconName="Check"
                            className={cn(
                              "ml-auto opacity-0",
                              !field.value && "opacity-100",
                            )}
                          />
                        </CommandItem>
                        <CommandSeparator />
                        {activeOptions.map((option) => (
                          <CommandItem
                            key={option.code}
                            onSelect={() => field.onChange(option.code)}
                          >
                            <IGRPIcon
                              iconName={
                                option.icon ||
                                (parentType === "GROUP" ? "Layers" : "Folder")
                              }
                              className="mr-2 size-4"
                            />
                            {option.name}
                            <IGRPIcon
                              iconName="Check"
                              className={cn(
                                "ml-auto opacity-0",
                                option.code === field.value && "opacity-100",
                              )}
                            />
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          );
        }}
      />
    </div>
  );
}
