import type { Status } from "@igrp/platform-access-management-client-ts";
import type { Messages } from "next-intl";
import { z } from "zod";

import { emptyToNull, statusSchema } from "@/schemas/global";

/**
 * Translator for `roles.validation.*`, satisfied by
 * `useTranslations("roles.validation")`.
 */
export type RolesValidationTranslator = (
  key: keyof Messages["roles"]["validation"],
) => string;

/** Validation messages come from the catalog, so the schemas are built per translator. */
export function makeRoleSchemas(t: RolesValidationTranslator) {
  const roleSchema = z.object({
    id: z.number().optional(),
    name: z
      .string()
      .min(3, t("nameRequired"))
      .max(50, t("nameMax"))
      .regex(/^[a-zA-Z0-9\sÀ-ÿ()]+$/, t("namePattern")),
    code: z.string().min(2, t("codeRequired")),
    description: z.string().optional().nullable(),
    departmentCode: z.string().min(1, t("departmentRequired")),
    parentCode: z.string().optional().nullable(),
    status: statusSchema,
  });

  const createRoleSchema = roleSchema.omit({ id: true }).extend({
    description: emptyToNull.optional(),
    parentCode: emptyToNull.optional(),
  });

  const updateRoleSchema = roleSchema.omit({ id: true }).partial().extend({
    description: emptyToNull.optional(),
    parentCode: emptyToNull.optional(),
  });

  return { roleSchema, createRoleSchema, updateRoleSchema };
}

type RoleSchemas = ReturnType<typeof makeRoleSchemas>;

export type RoleArgs = z.infer<RoleSchemas["roleSchema"]>;
export type CreateRoleArgs = z.infer<RoleSchemas["createRoleSchema"]>;
export type UpdateRoleArgs = z.infer<RoleSchemas["updateRoleSchema"]>;

export const normalizeRole = (data: CreateRoleArgs) => {
  return {
    name: data.name.trim(),
    departmentCode: data.departmentCode,
    parentCode: data.parentCode ?? null,
    code: data.code,
    description: data.description ?? null,
    status: data.status as Status,
  };
};

export const RoleFiltersSchema = z.object({
  departmentCode: z.string().trim().optional(),
  username: z.string().trim().optional(),
  fetchAllWhenNoDept: z.boolean().default(false),
  enabled: z.boolean().optional(),
});

export type RoleFiltersArgs = z.infer<typeof RoleFiltersSchema>;
