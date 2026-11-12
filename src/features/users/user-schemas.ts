import type { Messages } from "next-intl";
import { z } from "zod";

/**
 * Translator for `users.validation.*` — satisfied by
 * `useTranslations("users.validation")` / `getTranslations("users.validation")`.
 */
export type UsersValidationTranslator = (
  key: keyof Messages["users"]["validation"],
) => string;

const makeEmailSchema = (t: UsersValidationTranslator) =>
  z.email({ message: t("emailInvalid") }).max(254);

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
