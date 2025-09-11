import { z } from 'zod';
import { emptyToNull, statusSchema } from '@/schemas/global';
import { Status } from '@igrp/platform-access-management-client-ts';

export const roleSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, 'Nome é obrigatório (min 3 carateres)'),
  description: z.string().optional().nullable(),
  departmentCode: z.string().min(4, 'Código de departamento é obrigatório (min 4 carateres)'),
  parentName: z.string().optional(),
  status: statusSchema,
});

export type RoleArgs = z.infer<typeof roleSchema>;

export const createRoleSchema = roleSchema.omit({ id: true }).extend({
  description: emptyToNull.optional(),
  parentName: emptyToNull.optional(),
});

export type CreateRoleArgs = z.infer<typeof createRoleSchema>;

export const updateRoleSchema = roleSchema.omit({ id: true }).partial().extend({
  description: emptyToNull.optional(),
  parentName: emptyToNull.optional(),
});

export type UpdateRoleArgs = z.infer<typeof updateRoleSchema>;

export const normalizeRole = (data: CreateRoleArgs) => {
  return {
    name: data.name.trim(),
    departmentCode: data.departmentCode,
    parentName: data.parentName ?? null,
    description: data.description ?? null,
    status: data.status as Status,
  };
};
