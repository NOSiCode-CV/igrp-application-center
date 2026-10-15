import type {
  MenuType,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import type { Messages } from "@/i18n/messages";
import { statusSchema } from "@/schemas/global";

/**
 * Translator for `menus.validation.*` — satisfied by
 * `useTranslations("menus.validation")` / `getTranslations("menus.validation")`.
 */
export type MenusValidationTranslator = (
  key: keyof Messages["menus"]["validation"],
) => string;

export const menuTypeSchema = z.enum([
  "GROUP",
  "FOLDER",
  "MENU_PAGE",
  "EXTERNAL_PAGE",
]);

export const menuTargetSchema = z.enum(["_self", "_blank"]);

export const parentSchema = z.string().optional();
export const applicationSchema = z.string();

/**
 * Validation messages come from the catalog, so the schemas are built per
 * translator (docs/I18N.md, "Zod schemas are factories"). Call sites build
 * them inside a `useMemo` keyed on the translator.
 */
export function makeMenuSchemas(t: MenusValidationTranslator) {
  const menuSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, t("nameRequired")),
    code: z.string().regex(/^[A-Z0-9_]+$/, t("codePattern")),
    type: menuTypeSchema,
    position: z.number().min(0),
    icon: z.string().optional(),
    status: statusSchema,
    target: menuTargetSchema.optional(),
    url: z.string().optional().nullable(),
    parentCode: parentSchema,
    pageSlug: z.string().optional().nullable(),
    applicationCode: applicationSchema,
    createdBy: z.string().optional(),
    createdDate: z.string().optional(),
    lastModifiedBy: z.string().optional(),
    lastModifiedDate: z.string().optional(),
    permissions: z.array(z.string()).optional(),
  });

  const groupMenuSchema = menuSchema.extend({
    type: z.literal(menuTypeSchema.enum.GROUP),
    // Zod 4: a bare `z.undefined()` property is a required key, which fails
    // the form (no parentCode key for a top-level group) on a hidden field.
    parentCode: z.undefined().optional(),
  });

  const folderMenuSchema = menuSchema.extend({
    type: z.literal(menuTypeSchema.enum.FOLDER),
    parentCode: parentSchema,
  });

  const menuPageSchema = menuSchema
    .extend({
      type: z.literal(menuTypeSchema.enum.MENU_PAGE),
      pageSlug: z.string().optional(),
      url: z.string().optional(),
      parentCode: parentSchema,
    })
    .refine((data) => data.pageSlug || data.url, {
      message: t("pageUrlRequired"),
      path: ["pageSlug"],
    });

  const externalPageSchema = menuSchema.extend({
    type: z.literal(menuTypeSchema.enum.EXTERNAL_PAGE),
    url: z
      .string({ error: t("urlRequired") })
      .trim()
      .min(1, t("urlRequired"))
      .url(t("urlInvalid")),
    parent: parentSchema,
  });

  const createMenuSchema = z.discriminatedUnion("type", [
    groupMenuSchema,
    folderMenuSchema,
    menuPageSchema,
    externalPageSchema,
  ]);

  const updateMenuSchema = menuSchema
    .omit({
      id: true,
      createdBy: true,
      createdDate: true,
      lastModifiedBy: true,
      lastModifiedDate: true,
    })
    .extend({
      type: menuTypeSchema,
    });

  return { menuSchema, createMenuSchema, updateMenuSchema };
}

type MenuSchemas = ReturnType<typeof makeMenuSchemas>;

export type MenuArgs = z.infer<MenuSchemas["menuSchema"]>;
export type CreateMenu = z.infer<MenuSchemas["createMenuSchema"]>;
export type UpdateMenu = z.infer<MenuSchemas["updateMenuSchema"]>;

export type MenuTypeArgs = z.infer<typeof menuTypeSchema>;
export type MenuTargetArgs = z.infer<typeof menuTargetSchema>;

export type OnSaveMenu = CreateMenu | UpdateMenu;

/** Uppercase, accents folded to their base letter (é → E, ç → C). */
const foldToUpper = (value: string) =>
  value.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();

/** Code suggested from a menu name: "Página Inicial" → "PAGINA_INICIAL". */
export function menuCodeFromName(name: string): string {
  return foldToUpper(name)
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Code as typed, coerced to the allowed alphabet without trimming. */
export function sanitizeMenuCode(value: string): string {
  return foldToUpper(value).replace(/[^A-Z0-9_]/g, "_");
}

export function normalizeMenu(values: CreateMenu | UpdateMenu) {
  const cleanParent = values.parentCode;

  const common = {
    code: values.code,
    name: values.name,
    type: values.type as MenuType,
    position: values.position,
    icon: values.icon || "",
    status: values.status as Status,
    applicationCode: values.applicationCode,
    parentCode: values.parentCode,
    permissions: values.permissions ?? [],
  };

  if (values.type === menuTypeSchema.enum.MENU_PAGE) {
    return {
      ...common,
      parent: cleanParent,
      pageSlug: values.pageSlug?.trim() || null,
      url: values.url?.trim() || null,
      target: values.target || menuTargetSchema.enum._self,
    };
  }

  if (values.type === menuTypeSchema.enum.EXTERNAL_PAGE) {
    return {
      ...common,
      parent: cleanParent,
      url: values.url?.trim() || null,
      pageSlug: null,
      target: menuTargetSchema.enum._blank,
    };
  }

  if (values.type === menuTypeSchema.enum.FOLDER) {
    return {
      ...common,
      parent: cleanParent,
      url: null,
      pageSlug: null,
      target: undefined,
    };
  }

  // GROUP
  return {
    ...common,
    parent: undefined,
    url: null,
    pageSlug: null,
    target: undefined,
  };
}
