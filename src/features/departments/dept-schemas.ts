import { z } from 'zod';
import { emptyToNull, statusSchema, trimmed } from '@/schemas/global';
import { DepartmentStatus } from '@igrp/platform-access-management-client-ts';

export const departmentSchema = z
  .object({
    id: z.number().optional(),
    code: z
      .string()
      .regex(/^[A-Z0-9_]+$/, 'O código deve conter maiusculas, números e sublinhados')
      .min(3, 'Código é obrigatório'),
    name: trimmed.min(3, 'Nome é obrigatório (min 3 carateres)'),
    description: z.string().nullable().optional(),
    status: statusSchema,
    parent_code: trimmed.optional(),
  })
  .strict();

export type DepartmentArgs = z.infer<typeof departmentSchema>;

export const createDepartmentSchema = departmentSchema.omit({ id: true, status: true }).extend({
  description: emptyToNull.optional(),
});

export type CreateDepartment = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = departmentSchema
  .omit({ id: true })
  .partial()
  .extend({
    description: emptyToNull.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: 'É necessário fornecer pelo menos um campo para atualização.',
  });

export type UpdateDepartment = z.infer<typeof updateDepartmentSchema>;

export const normalizeDeptartment = (data: Partial<DepartmentArgs>) => {
  return {
    code: data.code?.trim(),
    name: data.name,
    description: data.description ?? null,
    status: data.status as DepartmentStatus,
    parent_code: data.parent_code,
  };
};
