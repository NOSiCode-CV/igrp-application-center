import type { DepartmentStatus } from "@igrp/platform-access-management-client-ts";
import type { Messages } from "next-intl";
import { z } from "zod";

import { statusSchema, trimmed } from "@/schemas/global";

/**
 * Translator for `departments.validation.*`, satisfied by
 * `useTranslations("departments.validation")`.
 */
export type DepartmentsValidationTranslator = (
  key: keyof Messages["departments"]["validation"],
) => string;

/** Validation messages come from the catalog, so the schema is built per translator. */
export function makeDepartmentSchema(t: DepartmentsValidationTranslator) {
  return z
    .object({
      id: z.number().optional(),
      code: z
        .string()
        .regex(/^[A-Z0-9_]+$/, t("codePattern"))
        .min(2, t("codeMin")),
      name: z
        .string()
        .min(2, t("nameMin"))
        .regex(/^[a-zA-Z0-9\sÀ-ÿ()&.,/-]+$/, t("namePattern")),
      description: z.string().optional().nullable(),
      status: statusSchema,
      parentCode: trimmed.optional(),
    })
    .strict();
}

export type DepartmentArgs = z.infer<ReturnType<typeof makeDepartmentSchema>>;

export const normalizeDepartment = (data: DepartmentArgs) => {
  return {
    code: data.code?.trim(),
    name: data.name,
    description: data.description,
    status: data.status as DepartmentStatus,
    parentCode: data.parentCode,
  };
};
