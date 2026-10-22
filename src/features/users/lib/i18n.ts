import type { useTranslations } from "next-intl";

import { statusKey } from "@/i18n/status";

/** `useTranslations("users")` / `getTranslations("users")` result. */
export type UsersTranslator = ReturnType<typeof useTranslations<"users">>;

type InviteStatusKey = "pending" | "canceled" | "rejected";

/** `useTranslations("common.status")` result. */
export type StatusTranslator = ReturnType<
  typeof useTranslations<"common.status">
>;

/**
 * Invitation status code → `users.invite.status.*` key. Mirrors the former
 * `geInviteTitle`: anything that is not PENDING/CANCELED reads as "rejected".
 */
export function inviteStatusKey(status: string): InviteStatusKey {
  switch (status) {
    case "PENDING":
      return "pending";
    case "CANCELED":
      return "canceled";
    default:
      return "rejected";
  }
}

/** Translated label of an ACTIVE/INACTIVE status (undefined when unknown). */
export function userStatusLabel(
  t: StatusTranslator,
  status: unknown,
): string | undefined {
  const key = statusKey(status);
  return key ? t(key) : undefined;
}

export function inviteStatusLabel(t: UsersTranslator, status: string): string {
  return t(`invite.status.${inviteStatusKey(status)}`);
}
