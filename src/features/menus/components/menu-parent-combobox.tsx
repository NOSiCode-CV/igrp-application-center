"use client";

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

import { type CreateMenu, menuTypeSchema } from "@/features/menus/menu-schemas";
import { cn } from "@/lib/utils";

interface MenuParentComboboxProps {
  control: Control<CreateMenu>;
  menuType: string;
  parentOptions: IGRPMenuItemArgs[];
  disabled?: boolean;
}

export function MenuParentCombobox({
  control,
  menuType,
  parentOptions,
  disabled,
}: MenuParentComboboxProps) {
  const isFolder = menuType === menuTypeSchema.enum.FOLDER;
  const entityLabel = isFolder ? "grupo" : "pasta";

  return (
    <fieldset className="border border-accent p-4 rounded-md">
      <legend className="text-base font-semibold px-2">Hierarquia</legend>
      <FormField
        control={control}
        name="parentCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              {isFolder ? "Grupo (Opcional)" : "Pasta (Opcional)"}
            </FormLabel>
            <Popover>
              <PopoverTrigger asChild disabled={disabled}>
                <FormControl>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="justify-between w-full"
                  >
                    {field.value
                      ? parentOptions.find((m) => m.code === field.value)?.name
                      : `Selecionar ${entityLabel}...`}
                    <IGRPIcon iconName="ChevronsUpDown" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent
                className="w-[--radix-popover-trigger-width] p-0"
                align="start"
              >
                <Command>
                  <CommandInput placeholder={`Procurar ${entityLabel}...`} />
                  <CommandList>
                    <CommandEmpty>
                      Nenhum {entityLabel} encontrado.
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
                      {parentOptions.map((option) => (
                        <CommandItem
                          key={option.code}
                          onSelect={() => field.onChange(option.code)}
                        >
                          <IGRPIcon
                            iconName={option.icon || "Folder"}
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
