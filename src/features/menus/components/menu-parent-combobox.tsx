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
import type { Control } from "react-hook-form";
import { useFormContext, useWatch } from "react-hook-form";

import { type CreateMenu, menuTypeSchema } from "@/features/menus/menu-schemas";
import { cn } from "@/lib/utils";

interface MenuParentComboboxProps {
  control: Control<CreateMenu>;
  menuType: string;
  groupOptions: IGRPMenuItemArgs[];
  folderOptions: IGRPMenuItemArgs[];
  disabled?: boolean;
}

export function MenuParentCombobox({
  control,
  menuType,
  groupOptions,
  folderOptions,
  disabled,
}: MenuParentComboboxProps) {
  const isFolder = menuType === menuTypeSchema.enum.FOLDER;
  const isPage =
    menuType === menuTypeSchema.enum.MENU_PAGE ||
    menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  const [parentType, setParentType] = useState<"GROUP" | "FOLDER">("GROUP");
  const { setValue } = useFormContext<CreateMenu>();
  const parentCode = useWatch({ control, name: "parentCode" });

  // Sync radio to match the current parentCode when form resets (e.g. on edit open)
  useEffect(() => {
    if (parentCode && isPage) {
      setParentType(
        folderOptions.some((f) => f.code === parentCode) ? "FOLDER" : "GROUP",
      );
    }
  }, [parentCode, isPage, folderOptions]);

  function handleParentTypeChange(type: "GROUP" | "FOLDER") {
    setParentType(type);
    setValue("parentCode", undefined);
  }

  const activeOptions = isPage
    ? parentType === "GROUP"
      ? groupOptions
      : folderOptions
    : groupOptions;

  const placeholder = isFolder
    ? "Selecionar grupo..."
    : parentType === "GROUP"
      ? "Selecionar grupo..."
      : "Selecionar pasta...";

  const fieldLabel = isFolder
    ? "Grupo (Opcional)"
    : parentType === "GROUP"
      ? "Grupo (Opcional)"
      : "Pasta (Opcional)";

  return (
    <fieldset className="border border-accent p-4 rounded-md">
      <legend className="text-base font-semibold px-2">Hierarquia</legend>

      {isPage && (
        <div className="flex gap-2 mb-4">
          {(["GROUP", "FOLDER"] as const).map((type) => (
            <label
              key={type}
              className={cn(
                "flex flex-1 items-center gap-2 px-3 py-2 rounded-md border cursor-pointer text-sm font-medium transition-colors",
                parentType === type
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-input bg-background text-foreground hover:bg-accent",
                disabled && "pointer-events-none opacity-50",
              )}
            >
              <input
                type="radio"
                name="parentType"
                value={type}
                checked={parentType === type}
                disabled={disabled}
                onChange={() => handleParentTypeChange(type)}
                className="accent-primary"
              />
              {type === "GROUP" ? "Grupo" : "Pasta"}
            </label>
          ))}
        </div>
      )}

      <FormField
        control={control}
        name="parentCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>{fieldLabel}</FormLabel>
            <Popover>
              <PopoverTrigger asChild disabled={disabled}>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between w-full"
                  >
                    {field.value
                      ? activeOptions.find((m) => m.code === field.value)?.name
                      : placeholder}
                    <IGRPIcon iconName="ChevronsUpDown" />
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
                        ? "Nenhum grupo encontrado."
                        : "Nenhuma pasta encontrada."}
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem onSelect={() => field.onChange(undefined)}>
                        Nenhum (Raiz)
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
        )}
      />
    </fieldset>
  );
}
