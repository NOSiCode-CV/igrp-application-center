
import type { MenuType, Status } from "@igrp/platform-access-management-client-ts";
import { z } from "zod";
import { statusSchema } from "@/schemas/global";

export const menuTypeSchema = z.enum(["GROUP", "FOLDER", "MENU_PAGE", "EXTERNAL_PAGE"]);

export const menuTargetSchema = z.enum(["_self", "_blank"]);

export const parentSchema = z.object({
  code: z.string(),
  description: z.string(),
}).optional();

export const applicationSchema = z.object({
  code: z.string(),
});

export const menuSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(5, "Nome deve ter no mínimo 5 caracteres"),
  code: z
    .string()
    .regex(/^[A-Z0-9_]+$/, "Permite letras maiúsculas, números e sublinhados."),
  type: menuTypeSchema,
  position: z.number().min(0),
  icon: z.string().optional(),
  status: statusSchema,
  target: menuTargetSchema.optional(),
  url: z.string().optional().nullable(),
  parent: parentSchema,
  pageSlug: z.string().optional().nullable(),
  application: applicationSchema,
  createdBy: z.string().optional(),
  createdDate: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedDate: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

// Schema para GROUP
export const groupMenuSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.GROUP),
  parent: z.undefined(),
});

// Schema para FOLDER
export const folderMenuSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.FOLDER),
  parent: parentSchema,
});

// Schema para MENU_PAGE
export const menuPageSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.MENU_PAGE),
  pageSlug: z.string().min(3, "URL relativo é obrigatório"),
  parent: parentSchema,
});

// Schema para EXTERNAL_PAGE
export const externalPageSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.EXTERNAL_PAGE),
  url: z.string().url("URL é obrigatório"),
  parent: parentSchema,
});

export const createMenuSchema = z.discriminatedUnion("type", [
  groupMenuSchema,
  folderMenuSchema,
  menuPageSchema,
  externalPageSchema,
]);

export const updateMenuSchema = menuSchema
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

export function normalizeMenu(values: CreateMenu | UpdateMenu) {
  const cleanParent = values.parent?.code 
    ? { code: values.parent.code, description: values.parent.description }
    : undefined;

  const common = {
    code: values.code,
    name: values.name,
    type: values.type as MenuType,
    position: values.position,
    icon: values.icon || "",
    status: values.status as Status,
    application: { code: values.application.code },
    permissions: values.permissions ?? [],
  };

  if (values.type === menuTypeSchema.enum.MENU_PAGE) {
    return {
      ...common,
      parent: cleanParent,
      pageSlug: values.pageSlug?.trim() || null,
      url: values.pageSlug?.trim() || null,
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

export type MenuArgs = z.infer<typeof menuSchema>;
export type GroupMenu = z.infer<typeof groupMenuSchema>;
export type FolderMenu = z.infer<typeof folderMenuSchema>;
export type MenuPage = z.infer<typeof menuPageSchema>;
export type ExternalPage = z.infer<typeof externalPageSchema>;

export type MenuTypeArgs = z.infer<typeof menuTypeSchema>;
export type MenuTargetArgs = z.infer<typeof menuTargetSchema>;
export type ParentArgs = z.infer<typeof parentSchema>;
export type ApplicationArgs = z.infer<typeof applicationSchema>;

export type CreateMenu = z.infer<typeof createMenuSchema>;
export type UpdateMenu = z.infer<typeof updateMenuSchema>;

export type OnSaveMenu = CreateMenu | UpdateMenu;