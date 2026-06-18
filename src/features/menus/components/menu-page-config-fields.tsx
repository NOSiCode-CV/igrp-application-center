"use client";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "@igrp/igrp-framework-react-design-system";
import type { UseFormReturn } from "react-hook-form";

import {
  type CreateMenu,
  menuTargetSchema,
  menuTypeSchema,
} from "@/features/menus/menu-schemas";

interface MenuPageConfigFieldsProps {
  form: UseFormReturn<CreateMenu>;
  menuType: string;
  disabled?: boolean;
}

export function MenuPageConfigFields({
  form,
  menuType,
  disabled,
}: MenuPageConfigFieldsProps) {
  const isMenuPage = menuType === menuTypeSchema.enum.MENU_PAGE;
  const isExternalPage = menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  if (!isMenuPage && !isExternalPage) {
    return null;
  }

  return (
    <fieldset className="border border-accent p-4 rounded-md">
      <legend className="text-base font-semibold px-2">
        Configurações de Página
      </legend>
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Página</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value === menuTypeSchema.enum.EXTERNAL_PAGE) {
                      form.setValue("pageSlug", undefined as never);
                      form.setValue("target", menuTargetSchema.enum._blank);
                    } else {
                      form.setValue("url", undefined as never);
                      form.setValue("target", menuTargetSchema.enum._self);
                    }
                  }}
                  disabled={disabled}
                  className="flex flex-row"
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={menuTypeSchema.enum.MENU_PAGE}
                      id="internal"
                    />
                    <label htmlFor="internal" className="cursor-pointer">
                      Página Interna
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      value={menuTypeSchema.enum.EXTERNAL_PAGE}
                      id="external"
                    />
                    <label htmlFor="external" className="cursor-pointer">
                      Página Externa
                    </label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {isMenuPage && (
          <FormField
            control={form.control}
            name="pageSlug"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='after:content-["*"] after:text-destructive'>
                  URL Relativo
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="page-slug"
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isExternalPage && (
          <FormField
            control={form.control}
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className='after:content-["*"] after:text-destructive'>
                  URL Externa
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="target"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>Abrir em nova aba</FormLabel>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {field.value === menuTargetSchema.enum._blank
                      ? "Sim"
                      : "Não"}
                  </span>
                  <Switch
                    checked={field.value === menuTargetSchema.enum._blank}
                    onCheckedChange={(checked) =>
                      field.onChange(
                        checked
                          ? menuTargetSchema.enum._blank
                          : menuTargetSchema.enum._self,
                      )
                    }
                    disabled={disabled}
                  />
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </fieldset>
  );
}
