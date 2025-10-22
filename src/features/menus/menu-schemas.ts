import type {
  MenuType,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";
import { nullIfEmpty } from "@/lib/utils";
import { statusSchema } from "@/schemas/global";

export const menuTypeSchema = z.enum(["MENU_PAGE", "EXTERNAL_PAGE", "FOLDER"]);

export const menuTargetSchema = z.enum(["_self", "_blank"]);

export const menuSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Nome é obrigatório"),
  code: z
    .string()
    .regex(/^[A-Z0-9_]+$/, "Permite letras maiúsculas, números e sublinhados."),
  type: menuTypeSchema,
  position: z.number().min(0),
  icon: z.string().optional(),
  status: statusSchema,
  target: menuTargetSchema.optional(),
  url: z.string().optional().nullable(),
  parentCode: z.string().optional(),
  pageSlug: z.string().optional().nullable(),
  applicationCode: z.string(),
  createdBy: z.string().optional(),
  createdDate: z.string().optional(),
  lastModifiedBy: z.string().optional(),
  lastModifiedDate: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const folderMenuSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.FOLDER),
});

export const menuPageSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.MENU_PAGE),
  pageSlug: z.string().min(3, "Url relátivo é obrigatório"),
});

export const externalPageSchema = menuSchema.extend({
  type: z.literal(menuTypeSchema.enum.EXTERNAL_PAGE),
  url: z.string().url("URL é obrigatório"),
});

export const createMenuSchema = z.discriminatedUnion("type", [
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
  const common = {
    code: values.code,
    name: values.name,
    type: values.type as MenuType,
    position: values.position,
    icon: values.icon || "",
    status: values.status as Status,
    applicationCode: values.applicationCode,
    parentCode: nullIfEmpty(values.parentCode),
    permissions: values.permissions ?? [],
  };

  if (values.type === menuTypeSchema.enum.MENU_PAGE) {
    return {
      ...common,
      pageSlug: values.pageSlug?.trim() ? values.pageSlug : null,
      url: values.pageSlug?.trim() ? values.pageSlug : null,
      target: values.target,
    };
  }

  if (values.type === menuTypeSchema.enum.EXTERNAL_PAGE) {
    return {
      ...common,
      url: values.url?.trim() ? values.url : null,
      pageSlug: nullIfEmpty(values.pageSlug),
      target: menuTargetSchema.enum._blank,
    };
  }

  return {
    ...common,
    url: null,
    pageSlug: null,
    target: undefined,
  };
}

export type MenuArgs = z.infer<typeof menuSchema>;
export type FolderMenu = z.infer<typeof folderMenuSchema>;
export type MenuPage = z.infer<typeof menuPageSchema>;
export type ExternalPage = z.infer<typeof externalPageSchema>;

export type MenuTypeArgs = z.infer<typeof menuTypeSchema>;
export type MenuTargetArgs = z.infer<typeof menuTargetSchema>;

export type CreateMenu = z.infer<typeof createMenuSchema>;
export type UpdateMenu = z.infer<typeof updateMenuSchema>;

export type OnSaveMenu = CreateMenu | UpdateMenu;
