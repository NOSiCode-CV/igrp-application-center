import { z } from "zod";

import {
  isFaviconFile,
  isOnMinioHost,
  minioBaseUrl,
} from "./lib/branding-rules";
import { isEditorColor } from "./lib/color-normalize";

export type BrandingSchemaMessage =
  | "errors.invalidColor"
  | "errors.logoHost"
  | "errors.favicon"
  | "errors.image"
  | "errors.darkWithoutLight";

/** Editor rules (spec §9, marked "editor"). The server re-checks in saveBranding. */
export function createBrandingSchema(
  t: (key: BrandingSchemaMessage) => string,
) {
  const minio = minioBaseUrl();

  const color = z.string().refine((v) => v.trim() === "" || isEditorColor(v), {
    message: t("errors.invalidColor"),
  });

  const image = z
    .union([z.instanceof(File), z.string()])
    .refine(
      (v) => typeof v !== "string" || v === "" || isOnMinioHost(v, minio),
      {
        message: t("errors.logoHost"),
      },
    );

  const slot = z
    .object({
      light: image,
      dark: image,
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
    })
    .refine((s) => s.dark === "" || s.light !== "", {
      message: t("errors.darkWithoutLight"),
      path: ["light"],
    });

  /* File checks per slot. FileUploadField's `accept` does not stop drag-and-drop. */
  const files = (ok: (file: File) => boolean, message: string) =>
    slot.superRefine((s, ctx) => {
      for (const variant of ["light", "dark"] as const) {
        const value = s[variant];
        if (value instanceof File && !ok(value)) {
          ctx.addIssue({ code: "custom", path: [variant], message });
        }
      }
    });
  const picture = files((f) => f.type.startsWith("image/"), t("errors.image"));
  const favicon = files(isFaviconFile, t("errors.favicon"));

  return z.object({
    tokens: z.object({
      light: z.record(z.string(), color),
      dark: z.record(z.string(), color),
    }),
    logos: z.object({ header: picture, wide: picture, favicon }),
  });
}
