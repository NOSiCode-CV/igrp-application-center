import z from "zod";

// Matches DepartmentDTO, the only status enum in the API without TEMPORARY.
export const statusSchema = z.enum(["ACTIVE", "INACTIVE", "DELETED"]);

export type StatusArgs = z.infer<typeof statusSchema>;

// Application, User, Menu, Role and Permission DTOs all add TEMPORARY. Records
// already in that state must parse, or their edit form refuses to open.
export const statusWithTemporarySchema = z.enum([
  "ACTIVE",
  "TEMPORARY",
  "INACTIVE",
  "DELETED",
]);

export type StatusWithTemporaryArgs = z.infer<typeof statusWithTemporarySchema>;

export const trimmed = z.string().trim();

export const emptyToNull = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .nullable();
