import type { DepartmentStatus } from "@igrp/platform-access-management-client-ts";
import { z } from "zod";
import { emptyToNull, statusSchema, trimmed } from "@/schemas/global";

export const departmentSchema = z
  .object({
    id: z.number().optional(),
    code: z
      .string()
      .regex(
        /^[A-Z0-9_]+$/,
        "O código deve conter maiusculas, números e sublinhados",
      )
      .min(2, "Código é obrigatório (min 2 carateres)"),
    name: z
      .string()
      .min(2, "Nome é obrigatório (min 2 carateres)")
      .regex(
        /^[a-zA-Z0-9\sÀ-ÿ()]+$/,
        "O nome não pode conter caracteres especiais",
      ),
    description: z
      .string()
      // .regex(
      //   /^[a-zA-Z0-9\sÀ-ÿ]+$/,
      //   "A descrição não pode conter caracteres especiais"
      // )
      .optional()
      .nullable(),
    status: statusSchema,
    parentCode: trimmed.optional(),
  })
  .strict();

export type DepartmentArgs = z.infer<typeof departmentSchema>;

export const createDepartmentSchema = departmentSchema.omit({
  id: true,
  status: true,
});

export type CreateDepartment = z.infer<typeof createDepartmentSchema>;

export const updateDepartmentSchema = departmentSchema
  .omit({ id: true })
  .partial()
  .extend({
    description: emptyToNull.optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "É necessário fornecer pelo menos um campo para atualização.",
  });

export type UpdateDepartment = z.infer<typeof updateDepartmentSchema>;

export const normalizeDeptartment = (data: DepartmentArgs) => {
  return {
    code: data.code?.trim(),
    name: data.name,
    description: data.description,
    status: data.status as DepartmentStatus,
    parentCode: data.parentCode,
  };
};
