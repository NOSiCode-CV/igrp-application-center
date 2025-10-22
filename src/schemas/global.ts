import z from "zod";

export const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export type StatusArgs = z.infer<typeof statusSchema>;

export const trimmed = z.string().trim();

export const emptyToNull = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable();
