import type {
  ApplicationType,
  CreateApplicationRequest,
  Status,
  UpdateApplicationRequest,
} from "@igrp/platform-access-management-client-ts";
import { z } from "zod";

import { fileWithPreviewSchema } from "@/features/files/files-schemas";
import type { Messages } from "@/i18n/messages";
import { emptyToNull, statusWithTemporarySchema } from "@/schemas/global";

import { APPLICATIONS_TYPES } from "./app-utils";

/**
 * Translator for `applications.validation.*` — satisfied by
 * `useTranslations("applications.validation")` /
 * `getTranslations("applications.validation")`.
 */
export type ApplicationsValidationTranslator = (
  key: keyof Messages["applications"]["validation"],
) => string;

/** The application types, for their enum values (`appTypeCrud.enum.INTERNAL`). */
export const appTypeCrud = z.enum(APPLICATIONS_TYPES);

/**
 * Validation messages come from the catalog, so the schemas are built per
 * translator (docs/I18N.md, "Zod schemas are factories"). Call sites build
 * them inside a `useMemo` keyed on the translator.
 */
export function makeApplicationSchemas(t: ApplicationsValidationTranslator) {
  const appType = z.enum(APPLICATIONS_TYPES, { error: t("typeRequired") });
  const urlSchema = () => z.string().url(t("urlInvalid"));

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
        .string({ error: t("codeRequired") })
        .trim()
        .min(1, t("codeRequired"))
        .min(2, t("codeMin"))
        .max(255, t("codeMax"))
        .regex(/^[A-Z0-9_-]+$/, t("codePattern")),
      name: z
        .string({ error: t("nameRequired") })
        .trim()
        .min(1, t("nameRequired"))
        .min(2, t("nameMin"))
        .max(255, t("nameMax")),
      status: z.enum(statusWithTemporarySchema.options, {
        error: t("statusInvalid"),
      }),
      owner: z.string().max(255, t("ownerMax")).optional(),
      description: z.string().max(255, t("descriptionMax")).optional(),
      picture: z.string().max(255, t("pictureMax")).optional(),
      type: appType,
      url: urlSchema().optional(),
      slug: z.string().max(255, t("slugMax")).optional(),
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
        .string({ error: t("slugRequired") })
        .trim()
        .min(1, t("slugRequired"))
        .max(255, t("slugMax")),
    })
    .extend({
      description: boundedEmptyToNull(t("descriptionMax")).optional(),
      picture: boundedEmptyToNull(t("pictureMax")).optional(),
      url: emptyToNull.optional(),
    });

  const ExternalSpecific = z
    .object({
      type: z.literal(appTypeCrud.enum.EXTERNAL),
      url: z
        .string({ error: t("urlRequired") })
        .trim()
        .min(1, t("urlRequired"))
        .url(t("urlInvalid")),
    })
    .extend({
      description: boundedEmptyToNull(t("descriptionMax")).optional(),
      picture: boundedEmptyToNull(t("pictureMax")).optional(),
      slug: emptyToNull.optional(),
    });

  const InternalApp = BaseApp.merge(InternalSpecific);
  const ExternalApp = BaseApp.merge(ExternalSpecific);

  // Server-managed fields omitted from both create and update payloads.
  const serverManagedOmit = {
    id: true,
    createdBy: true,
    createdDate: true,
    lastModifiedBy: true,
    lastModifiedDate: true,
  } as const;

  const CreateApplicationSchema = z.discriminatedUnion(
    "type",
    [InternalApp.omit(serverManagedOmit), ExternalApp.omit(serverManagedOmit)],
    { error: t("typeRequired") },
  );

  const emptyToUndefined = (v: unknown) =>
    typeof v === "string" && v.trim() === "" ? undefined : v;

  const PartialBase = BaseApp.partial()
    .omit(serverManagedOmit)
    .extend({
      url: z.preprocess(emptyToUndefined, urlSchema().optional()),
      slug: z.preprocess(
        emptyToUndefined,
        z.string().max(255, t("slugMax")).optional(),
      ),
      description: z.preprocess(
        emptyToUndefined,
        z.string().max(255, t("descriptionMax")).optional(),
      ),
      picture: z.preprocess(
        emptyToUndefined,
        z.string().max(255, t("pictureMax")).optional(),
      ),
    });

  const PartialInternal = PartialBase.merge(
    z.object({
      type: z.literal(appTypeCrud.enum.INTERNAL).optional(),
      slug: z.preprocess(
        emptyToUndefined,
        z.string().max(255, t("slugMax")).optional(),
      ),
    }),
  );

  const PartialExternal = PartialBase.merge(
    z.object({
      type: z.literal(appTypeCrud.enum.EXTERNAL).optional(),
      url: z.preprocess(emptyToUndefined, urlSchema().optional()),
    }),
  );

  const UpdateApplicationSchema = z
    .union([PartialInternal, PartialExternal])
    .superRefine((data, ctx) => {
      if (data.type === appTypeCrud.enum.INTERNAL && !data.slug) {
        ctx.addIssue({
          path: ["slug"],
          code: z.ZodIssueCode.custom,
          message: t("slugRequired"),
        });
      }
      if (data.type === appTypeCrud.enum.EXTERNAL && !data.url) {
        ctx.addIssue({
          path: ["url"],
          code: z.ZodIssueCode.custom,
          message: t("urlRequired"),
        });
      }
    });

  return { BaseApp, CreateApplicationSchema, UpdateApplicationSchema };
}

type ApplicationSchemas = ReturnType<typeof makeApplicationSchemas>;

export type ApplicationArgs = z.infer<ApplicationSchemas["BaseApp"]>;
export type CreateApplicationArgs = z.infer<
  ApplicationSchemas["CreateApplicationSchema"]
>;
export type UpdateApplicationArgs = z.infer<
  ApplicationSchemas["UpdateApplicationSchema"]
>;

export type CreateApplicationFormValues = z.output<
  ApplicationSchemas["CreateApplicationSchema"]
>;
export type UpdateApplicationFormValues = z.output<
  ApplicationSchemas["UpdateApplicationSchema"]
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
