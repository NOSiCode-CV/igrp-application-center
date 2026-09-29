import { z } from "zod";

import type { Messages } from "@/i18n/messages";

import { statusSchema } from "../../schemas/global";

/**
 * Translator for `users.validation.*` — satisfied by
 * `useTranslations("users.validation")` / `getTranslations("users.validation")`.
 */
export type UsersValidationTranslator = (
  key: keyof Messages["users"]["validation"],
) => string;

const makeNameSchema = (t: UsersValidationTranslator) =>
  z.string().trim().min(3, t("nameMin")).max(120);

// const UsernameSchema = z
//   .string()
//   .trim()
//   .min(3, "Username deve ter mínimo 3 caracteres")
//   .max(50);

export const makeEmailSchema = (t: UsersValidationTranslator) =>
  z.email({ message: t("emailInvalid") }).max(254);

export const makeUserSchema = (t: UsersValidationTranslator) =>
  z.object({
    id: z.number().int().positive().optional(),
    name: makeNameSchema(t),
    //username: UsernameSchema,
    email: makeEmailSchema(t),
    status: statusSchema,
    picture: z.string().optional(),
    signature: z.string().optional(),
    username: z.string().optional(),
  });

export const makeCreateUserSchema = (t: UsersValidationTranslator) =>
  makeUserSchema(t).omit({ id: true });
export const makeUpdateUserSchema = (t: UsersValidationTranslator) =>
  makeUserSchema(t)
    .omit({
      id: true,
      //username: true,
    })
    .partial();

export type UserArgs = z.infer<ReturnType<typeof makeUserSchema>>;
export type CreateUserArgs = z.infer<ReturnType<typeof makeCreateUserSchema>>;
export type UpdateUserArgs = z.infer<ReturnType<typeof makeUpdateUserSchema>>;

export const makeFormUserSchema = (t: UsersValidationTranslator) =>
  z.object({
    name: makeNameSchema(t),
    //username: UsernameSchema,
    email: makeEmailSchema(t),
  });

export type FormUserArgs = z.infer<ReturnType<typeof makeFormUserSchema>>;

export const makeFormSchema = (t: UsersValidationTranslator) =>
  z.object({
    users: z.array(makeFormUserSchema(t)).min(1, { message: t("usersMin") }),
    departmentCode: z.string().optional(),
    roleNames: z.array(z.string()).optional(),
  });

export type FormSchema = z.infer<ReturnType<typeof makeFormSchema>>;

export const makeInviteEmailFormSchema = (t: UsersValidationTranslator) =>
  z.object({
    email: makeEmailSchema(t),
  });
export type InviteEmailFormArgs = z.infer<
  ReturnType<typeof makeInviteEmailFormSchema>
>;

export const makeInviteOtpFormSchema = (t: UsersValidationTranslator) =>
  z.object({
    otpCode: z.string().regex(/^\d{6}$/, { message: t("otpDigits") }),
  });
export type InviteOtpFormArgs = z.infer<
  ReturnType<typeof makeInviteOtpFormSchema>
>;
