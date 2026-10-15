import type { DepartmentStatus } from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import { statusSchema, trimmed } from "@/schemas/global";

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
        /^[a-zA-Z0-9\sÀ-ÿ()&.,/-]+$/,
        "O nome não pode conter caracteres especiais",
      ),
    description: z.string().optional().nullable(),
    status: statusSchema,
    parentCode: trimmed.optional(),
  })
  .strict();

export type DepartmentArgs = z.infer<typeof departmentSchema>;

export const normalizeDepartment = (data: DepartmentArgs) => {
  return {
    code: data.code?.trim(),
    name: data.name,
    description: data.description,
    status: data.status as DepartmentStatus,
    parentCode: data.parentCode,
  };
};
