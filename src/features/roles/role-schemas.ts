import type { Status } from "@igrp/platform-access-management-client-ts";
import { z } from "zod";
import { emptyToNull, statusSchema } from "@/schemas/global";

export const roleSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(3, "Nome é obrigatório (min 3 caracteres)")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(
      /^[A-Za-z0-9_-]+$/,
      "Nome deve conter apenas letras, números, hífens e underscores"
    ),
  code: z
      .string()
      .min(5, "Código é obrigatório"),  
  description: z.string().optional().nullable(),
  departmentCode: z
    .string()
    .min(4, "Código de departamento é obrigatório (min 4 carateres)"),
  parentCode: z.string().optional().nullable(),
  status: statusSchema,
});

export type RoleArgs = z.infer<typeof roleSchema>;

export const createRoleSchema = roleSchema.omit({ id: true }).extend({
  description: emptyToNull.optional(),
  parentCode: emptyToNull.optional(),
});

export type CreateRoleArgs = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = roleSchema.omit({ id: true }).partial().extend({
  description: emptyToNull.optional(),
  parentCode: emptyToNull.optional(),
});

export type UpdateRoleArgs = z.infer<typeof updateRoleSchema>;

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
