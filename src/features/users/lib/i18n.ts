import { useMemo } from "react";

import type { IGRPOptionsProps } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { statusKey } from "@/i18n/status";
import { STATUS_OPTIONS } from "@/lib/constants";

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

/** Translated label of an ACTIVE/INACTIVE status (undefined when unknown, like `showStatus`). */
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

/** `STATUS_OPTIONS` with labels in the current language. */
export function useUserStatusOptions(): IGRPOptionsProps[] {
  const t = useTranslations("common.status");
  return useMemo(
    () =>
      STATUS_OPTIONS.map((option) => ({
        ...option,
        label: userStatusLabel(t, option.value) ?? option.label,
      })),
    [t],
  );
}
