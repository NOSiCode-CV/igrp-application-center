import type {
  ApplicationType,
  CreateApplicationRequest,
  Status,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import { fileWithPreviewSchema } from "@/features/files/files-schemas";
import { emptyToNull, statusWithTemporarySchema } from "@/schemas/global";

import { APPLICATIONS_TYPES } from "./app-utils";

export const appTypeCrud = z.enum(APPLICATIONS_TYPES, {
  error: "Selecione o tipo de aplicação",
});

// emptyToNull with the API's 255-char ceiling kept in place: the branch
// schemas below override description/picture, so the bound has to travel
// with the override or it is lost.
const boundedEmptyToNull = (message: string) =>
  z
    .string()
    .trim()
    .max(255, message)
    .transform((value) => (value.length === 0 ? null : value))
    .nullable();

const BaseApp = z
  .object({
    id: z.number().int().positive(),
    // Checks run in order and the form shows the first failure, so the
    // "obrigatório" case has to come before the shape/length rules.
    code: z
      .string({ error: "Código é obrigatório" })
      .trim()
      .min(1, "Código é obrigatório")
      .min(2, "Código deve ter pelo menos 2 caracteres")
      .max(255, "Código deve ter no máximo 255 caracteres")
      .regex(
        /^[A-Z0-9_-]+$/,
        "Use apenas maiúsculas, números, _ e - (ex.: APP_CENTER)",
      ),
    name: z
      .string({ error: "Nome é obrigatório" })
      .trim()
      .min(1, "Nome é obrigatório")
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(255, "Nome deve ter no máximo 255 caracteres"),
    status: z.enum(statusWithTemporarySchema.options, {
      error: "Selecione um estado válido",
    }),
    owner: z
      .string()
      .max(255, "Responsável deve ter no máximo 255 caracteres")
      .optional(),
    description: z
      .string()
      .max(255, "Descrição deve ter no máximo 255 caracteres")
      .optional(),
    picture: z
      .string()
      .max(255, "Imagem deve ter no máximo 255 caracteres")
      .optional(),
    type: appTypeCrud,
    url: z
      .string()
      .url("Indique um URL completo, com https:// (ex.: https://exemplo.com)")
      .optional(),
    slug: z
      .string()
      .max(255, "Slug deve ter no máximo 255 caracteres")
      .optional(),
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
    slug: z
      .string({ error: "Slug é obrigatório" })
      .trim()
      .min(1, "Slug é obrigatório (ex.: /apps/exemplo)")
      .max(255, "Slug deve ter no máximo 255 caracteres"),
  })
  .extend({
    description: boundedEmptyToNull(
      "Descrição deve ter no máximo 255 caracteres",
    ).optional(),
    picture: boundedEmptyToNull(
      "Imagem deve ter no máximo 255 caracteres",
    ).optional(),
    url: emptyToNull.optional(),
  });

const ExternalSpecific = z
  .object({
    type: z.literal(appTypeCrud.enum.EXTERNAL),
    url: z
      .string({ error: "URL é obrigatório" })
      .trim()
      .min(1, "URL é obrigatório")
      .url("Indique um URL completo, com https:// (ex.: https://exemplo.com)"),
  })
  .extend({
    description: boundedEmptyToNull(
      "Descrição deve ter no máximo 255 caracteres",
    ).optional(),
    picture: boundedEmptyToNull(
      "Imagem deve ter no máximo 255 caracteres",
    ).optional(),
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

export const CreateApplicationSchema = z.discriminatedUnion(
  "type",
  [InternalApp.omit(serverManagedOmit), ExternalApp.omit(serverManagedOmit)],
  { error: "Selecione o tipo de aplicação" },
);
export type CreateApplicationArgs = z.infer<typeof CreateApplicationSchema>;

const emptyToUndefined = (v: unknown) =>
  typeof v === "string" && v.trim() === "" ? undefined : v;

const PartialBase = BaseApp.partial()
  .omit(serverManagedOmit)
  .extend({
    url: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .url("Indique um URL completo, com https:// (ex.: https://exemplo.com)")
        .optional(),
    ),
    slug: z.preprocess(
      emptyToUndefined,
      z.string().max(255, "Slug deve ter no máximo 255 caracteres").optional(),
    ),
    description: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .max(255, "Descrição deve ter no máximo 255 caracteres")
        .optional(),
    ),
    picture: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .max(255, "Imagem deve ter no máximo 255 caracteres")
        .optional(),
    ),
  });

const PartialInternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.INTERNAL).optional(),
    slug: z.preprocess(
      emptyToUndefined,
      z.string().max(255, "Slug deve ter no máximo 255 caracteres").optional(),
    ),
  }),
);

const PartialExternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.EXTERNAL).optional(),
    url: z.preprocess(
      emptyToUndefined,
      z
        .string()
        .url("Indique um URL completo, com https:// (ex.: https://exemplo.com)")
        .optional(),
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
        message: "Slug é obrigatório (ex.: /apps/exemplo)",
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
  CreateApplicationFormValues | UpdateApplicationFormValues;

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
