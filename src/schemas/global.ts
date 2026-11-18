import z from "zod";

export const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export type StatusArgs = z.infer<typeof statusSchema>;
export const statusWithTemporarySchema = z.enum([
  "ACTIVE",
  "TEMPORARY",
  "INACTIVE",
  "DELETED",
]);

export type StatusWithTemporaryArgs = z.infer<typeof statusWithTemporarySchema>;

export const HTTP_URL_PATTERN = /^https?:\/\//i;

export const trimmed = z.string().trim();

export const emptyToNull = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable();
