"use client";

import {
  FieldLegend,
  FieldSet,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Switch,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

import {
  type CreateMenu,
  menuTargetSchema,
  menuTypeSchema,
} from "@/features/menus/menu-schemas";

import { MenuChoiceGroup } from "./menu-choice-group";

interface MenuPageConfigFieldsProps {
  form: UseFormReturn<CreateMenu>;
  menuType: string;
  disabled?: boolean;
}

type PageType = "MENU_PAGE" | "EXTERNAL_PAGE";

/** Where a page leads: a route inside the application, or an external URL. */
export function MenuPageConfigFields({
  form,
  menuType,
  disabled,
}: MenuPageConfigFieldsProps) {
  const t = useTranslations("menus.form");
  const isMenuPage = menuType === menuTypeSchema.enum.MENU_PAGE;
  const isExternalPage = menuType === menuTypeSchema.enum.EXTERNAL_PAGE;

  if (!isMenuPage && !isExternalPage) {
    return null;
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">{t("sections.destination")}</FieldLegend>
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="sr-only">{t("pageType")}</FormLabel>
              <FormControl>
                <MenuChoiceGroup<PageType>
                  name="page-type"
                  aria-label={t("pageType")}
                  value={field.value as PageType}
                  options={[
                    {
                      value: menuTypeSchema.enum.MENU_PAGE,
                      label: t("internalPage"),
                    },
                    {
                      value: menuTypeSchema.enum.EXTERNAL_PAGE,
                      label: t("externalPage"),
                    },
                  ]}
                  onChange={(value) => {
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
                />
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
                  {t("relativeUrl")}
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("relativeUrlPlaceholder")}
                    autoComplete="off"
                    spellCheck={false}
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                <FormDescription>{t("relativeUrlHint")}</FormDescription>
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
                  {t("externalUrl")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="url"
                    inputMode="url"
                    autoComplete="off"
                    placeholder={t("externalUrlPlaceholder")}
                    {...field}
                    value={field.value ?? ""}
                    disabled={disabled}
                  />
                </FormControl>
                {/* normalizeMenu always saves external pages with _blank. */}
                <FormDescription>{t("externalUrlHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {isMenuPage && (
          <FormField
            control={form.control}
            name="target"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <FormLabel htmlFor="menu-target-switch">
                    {t("openInNewTab")}
                  </FormLabel>
                  <FormDescription>{t("openInNewTabHint")}</FormDescription>
                </div>
                <FormControl>
                  <Switch
                    id="menu-target-switch"
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
                </FormControl>
              </FormItem>
            )}
          />
        )}
      </div>
    </FieldSet>
  );
}
