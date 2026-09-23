import { useMemo } from "react";

import type { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { STATUS_OPTIONS } from "@/lib/constants";

/** `useTranslations("users")` / `getTranslations("users")` result. */
export type UsersTranslator = ReturnType<typeof useTranslations<"users">>;

type UserStatusKey = "active" | "inactive";
type InviteStatusKey = "pending" | "canceled" | "rejected";

const USER_STATUS_KEYS: Record<string, UserStatusKey> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

/** Status code sent by the API → `users.status.*` key (undefined when unknown). */
export function userStatusKey(status: unknown): UserStatusKey | undefined {
  return typeof status === "string" ? USER_STATUS_KEYS[status] : undefined;
}

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

/** Translated label of an ACTIVE/INACTIVE status (undefined when unknown, like `showStatus`). */
export function userStatusLabel(
  t: UsersTranslator,
  status: unknown,
): string | undefined {
  const key = userStatusKey(status);
  return key ? t(`status.${key}`) : undefined;
}

export function inviteStatusLabel(t: UsersTranslator, status: string): string {
  return t(`invite.status.${inviteStatusKey(status)}`);
}

/** `STATUS_OPTIONS` with labels in the current language. */
export function useUserStatusOptions(): IGRPOptionsProps[] {
  const t = useTranslations("users");
  return useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        ...option,
        label: userStatusLabel(t, option.value) ?? option.label,
      })),
    [t],
  );
}
