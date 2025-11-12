import type {
  ApplicationType,
  Status,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";
import { fileWithPreviewSchema } from "@/features/files/files-schema";
import { emptyToNull, statusSchema } from "@/schemas/global";
import { APPLICATIONS_TYPES, APPLICATIONS_TYPES_EXCLUDE } from "./app-utils";

export const appTypeCrud = z.enum(APPLICATIONS_TYPES_EXCLUDE);
export const types = z.enum(APPLICATIONS_TYPES);

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
    name: z.string().regex(
        /^[a-zA-Z0-9\sÀ-ÿ()]+$/,
        "O nome não pode conter caracteres especiais"
      ).min(2, "Nome é obrigatório"),
    status: statusSchema,
    owner: z.string().optional(),
    description: z.string().optional(),
    picture: z.string().optional(),
    type: types,
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

// export const applicationSchema = z.discriminatedUnion("type", [
//   InternalApp,
//   ExternalApp,
// ]);

export type ApplicationArgs = z.infer<typeof BaseApp>;

const createOmit = {
  id: true,
  createdBy: true,
  createdDate: true,
  lastModifiedBy: true,
  lastModifiedDate: true,
} as const;

export const CreateApplicationSchema = z.discriminatedUnion("type", [
  InternalApp.omit(createOmit),
  ExternalApp.omit(createOmit),
]);
export type CreateApplicationArgs = z.infer<typeof CreateApplicationSchema>;

const updateOmit = {
  id: true,
  createdBy: true,
  createdDate: true,
  lastModifiedBy: true,
  lastModifiedDate: true,
} as const;

const PartialBase = BaseApp.partial().omit(updateOmit);

const PartialInternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.INTERNAL).optional(),
    slug: z.string().optional(),
  }),
);

const PartialExternal = PartialBase.merge(
  z.object({
    type: z.literal(appTypeCrud.enum.EXTERNAL).optional(),
    url: z.string().url("URL inválida").optional(),
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
export type FormVals = z.input<typeof FormSchema>;
export type FormValsParsed = z.output<typeof FormSchema>;

export function normalizeApplication(values: FormVals, isEdit: boolean) {
  const base = {
    code: values.code as string,
    name: values.name as string,
    type: values.type as ApplicationType,
    status: values.status as Status,
    description: values.description ?? null,
    owner: values.owner as string,
    picture: values.picture ?? null,
    departments: []
  };

  if (values.type === appTypeCrud.enum.INTERNAL) {
    return {
      ...base,
      slug: values.slug ?? null,
      url: null,
    };
  }
  return {
    ...base,
    url: values.url ?? null,
    slug: null,
  };
}
