import type { Status } from "@igrp/platform-access-management-client-ts";
import type { Messages } from "next-intl";
import { z } from "zod";

/**
 * Translator for `permissions.validation.*` — satisfied by
 * `useTranslations("permissions.validation")`.
 */
export type PermissionsValidationTranslator = (
  key: keyof Messages["permissions"]["validation"],
) => string;

export const permissionStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

/** Built per translator; call sites build it in a `useMemo`. */
export function makePermissionSchemas(t: PermissionsValidationTranslator) {
  const permissionFormSchema = z.object({
    id: z.number().optional(),
    name: z
      .string()
      .min(3, t("nameMin"))
      .regex(/^[a-z0-9_-]+$/, t("namePattern")),
    description: z.string().optional().nullable(),
    departmentCode: z.string().min(5, t("departmentCodeMin")),
    status: permissionStatusSchema,
  });

  const createPermissionSchema = permissionFormSchema.omit({ id: true });

  const updatePermissionSchema = permissionFormSchema
    .omit({ id: true })
    .partial()
    .refine((val) => Object.keys(val).length > 0, {
      message: t("atLeastOneField"),
    });

  return {
    permissionFormSchema,
    createPermissionSchema,
    updatePermissionSchema,
  };
}

export type PermissionArgs = z.infer<
  ReturnType<typeof makePermissionSchemas>["permissionFormSchema"]
>;
export type CreatePermissionArgs = z.infer<
  ReturnType<typeof makePermissionSchemas>["createPermissionSchema"]
>;
export type UpdatePermissionArgs = z.infer<
  ReturnType<typeof makePermissionSchemas>["updatePermissionSchema"]
>;

export const normalizePermission = (data: PermissionArgs) => {
  return {
    name: data.name.trim(),
    departmentCode: data.departmentCode,
    description: data.description ?? null,
    status: data.status as Status,
  };
};
