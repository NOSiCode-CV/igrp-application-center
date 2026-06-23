import type {
  ApplicationType,
  CreateApplicationRequest,
  Status,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import { fileWithPreviewSchema } from "@/features/files/files-schemas";
import { emptyToNull, statusSchema } from "@/schemas/global";

import { APPLICATIONS_TYPES } from "./app-utils";

export const appTypeCrud = z.enum(APPLICATIONS_TYPES);

const BaseApp = z
  .object({
    id: z.number().int().positive(),
    code: z
      .string()
      .regex(
        /^[A-Z0-9_]+$/,
        "Deve conter apenas maiúsculas, números e sublinhados",
      )
      .min(2, "Código deve ter no mínimo 2 caracteres"),
    name: z
      .string()
      // .regex(
      //   /^[a-zA-Z0-9\sÀ-ÿ()]+$/,
      //   "O nome não pode conter caracteres especiais",
      // )
      .min(2, "Nome é obrigatório")
      .max(255, "Nome deve ter no máximo 255 caracteres"),
    status: statusSchema,
    owner: z.string().optional(),
    description: z.string().optional(),
    picture: z.string().optional(),
    type: appTypeCrud,
    url: z.string().url().optional(),
    slug: z.string().optional(),
    createdBy: z.string().optional(),
    createdDate: z.string().optional(),
    lastModifiedBy: z.string().optional(),
    lastModifiedDate: z.string().optional(),
    image: fileWithPreviewSchema.nullable().optional(),
  })
  .strict();

const InternalSpecific = z
  .object({
    type: z.literal(appTypeCrud.enum.INTERNAL),
    slug: z.string().min(1, "URL Relativo é obrigatório"),
  })
  .extend({
    description: emptyToNull.optional(),
    picture: emptyToNull.optional(),
    url: emptyToNull.optional(),
  });

const ExternalSpecific = z
  .object({
    type: z.literal(appTypeCrud.enum.EXTERNAL),
    url: z.string().url("URL inválida"),
  })
  .extend({
    description: emptyToNull.optional(),
    picture: emptyToNull.optional(),
    slug: emptyToNull.optional(),
  });

const InternalApp = BaseApp.merge(InternalSpecific);
const ExternalApp = BaseApp.merge(ExternalSpecific);

export type ApplicationArgs = z.infer<typeof BaseApp>;

// Server-managed fields omitted from both create and update payloads.
const serverManagedOmit = {
  id: true,
  createdBy: true,
  createdDate: true,
  lastModifiedBy: true,
  lastModifiedDate: true,
} as const;

export const CreateApplicationSchema = z.discriminatedUnion("type", [
  InternalApp.omit(serverManagedOmit),
  ExternalApp.omit(serverManagedOmit),
]);
export type CreateApplicationArgs = z.infer<typeof CreateApplicationSchema>;

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const PartialBase = BaseApp.partial()
  .omit(serverManagedOmit)
  .extend({
    url: z.preprocess(
      emptyToUndefined,
      z.string().url("URL inválida").optional(),
    ),
    slug: z.preprocess(emptyToUndefined, z.string().optional()),
    description: z.preprocess(emptyToUndefined, z.string().optional()),
    picture: z.preprocess(emptyToUndefined, z.string().optional()),
  });

const PartialInternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.INTERNAL).optional(),
    slug: z.preprocess(emptyToUndefined, z.string().optional()),
  }),
);

const PartialExternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.EXTERNAL).optional(),
    url: z.preprocess(
      emptyToUndefined,
      z.string().url("URL inválida").optional(),
    ),
  }),
);

export const UpdateApplicationSchema = z
  .union([PartialInternal, PartialExternal])
  .superRefine((data, ctx) => {
    if (data.type === appTypeCrud.enum.INTERNAL && !data.slug) {
      ctx.addIssue({
        path: ["slug"],
        code: z.ZodIssueCode.custom,
        message: "URL Relativo é obrigatório",
      });
    }
    if (data.type === appTypeCrud.enum.EXTERNAL && !data.url) {
      ctx.addIssue({
        path: ["url"],
        code: z.ZodIssueCode.custom,
        message: "URL é obrigatório",
      });
    }
  });

export type UpdateApplicationArgs = z.infer<typeof UpdateApplicationSchema>;

export const FormSchema = z.union([
  CreateApplicationSchema,
  UpdateApplicationSchema,
]);

export type CreateApplicationFormValues = z.output<
  typeof CreateApplicationSchema
>;
export type UpdateApplicationFormValues = z.output<
  typeof UpdateApplicationSchema
>;
export type ApplicationFormValues =
  | CreateApplicationFormValues
  | UpdateApplicationFormValues;

function toNullableString(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function normalizeCreateApplication(
  values: CreateApplicationFormValues,
): CreateApplicationRequest {
  const base = {
    code: values.code,
    name: values.name,
    type: values.type as ApplicationType,
    status: values.status as Status,
    description: toNullableString(values.description),
    owner: values.owner ?? "",
    picture: toNullableString(values.picture),
    departments: [],
  };

  if (values.type === appTypeCrud.enum.INTERNAL) {
    return {
      ...base,
      slug: toNullableString(values.slug),
      url: null,
    };
  }
  return {
    ...base,
    url: values.url ?? null,
    slug: null,
  };
}

export function normalizeUpdateApplication(
  values: UpdateApplicationFormValues,
): UpdateApplicationRequest {
  const base = {
    code: values.code,
    name: values.name,
    type: values.type as ApplicationType | undefined,
    status: values.status as Status | undefined,
    description: toNullableString(values.description),
    owner: values.owner,
    picture: toNullableString(values.picture),
    departments: [],
  };

  if (values.type === appTypeCrud.enum.INTERNAL) {
    return {
      ...base,
      slug: toNullableString(values.slug),
      url: null,
    };
  }
  if (values.type === appTypeCrud.enum.EXTERNAL) {
    return {
      ...base,
      url: values.url ?? null,
      slug: null,
    };
  }
  return base;
}
