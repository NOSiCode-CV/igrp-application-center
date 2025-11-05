import type { Status } from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

export const permissionStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const permissionFormSchema = z.object({
  id: z.number().optional(),
  name: z
    .string()
    .min(3, "Nome é obrigatório (min 3 carateres)")
    .regex(
      /^[a-z0-9_-]+$/,
      "Apenas são permitidas letras minúsculas, números, underscore (_) e hífen (-).",
    ),
  description: z.string().optional().nullable(),
  departmentCode: z
    .string()
    .min(5, "Código de departamento é obrigatório (min 4 carateres)"),
  status: permissionStatusSchema,
});

export type PermissionArgs = z.infer<typeof permissionFormSchema>;

export const createPermissionSchema = permissionFormSchema.omit({ id: true });

export type CreatePermissionArgs = z.infer<typeof createPermissionSchema>;

export const updatePermissionSchema = permissionFormSchema
  .omit({ id: true })
  .partial()
  .refine((val) => Object.keys(val).length > 0, {
    message: "É necessário fornecer pelo menos um campo para atualização.",
  });

export type UpdatePermissionArgs = z.infer<typeof updatePermissionSchema>;

export const normalizePermission = (data: PermissionArgs) => {
  return {
    name: data.name.trim(),
    departmentCode: data.departmentCode,
    description: data.description ?? null,
    status: data.status as Status,
  };
};
