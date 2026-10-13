// Translated labels for the platform's entity statuses (`common.status.*`).
//
// Replaces `showStatus()` / `STATUS_OPTIONS` labels (pt only) in migrated
// code: the status codes stay the API's, only the label is translated.

import { useMemo } from "react";

import { useTranslations } from "next-intl";

export type StatusKey = "active" | "inactive" | "temporary" | "deleted";

const STATUS_KEYS: Record<string, StatusKey> = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  TEMPORARY: "temporary",
  DELETED: "deleted",
};

/** API status code → `common.status.*` key (undefined when unknown). */
export function statusKey(status: unknown): StatusKey | undefined {
  return typeof status === "string" ? STATUS_KEYS[status] : undefined;
}

/**
 * `label(status)`: the translated label, or the raw code for a status the
 * catalog does not know (never an empty badge).
 */
export function useStatusLabel(): (
  status: string | null | undefined,
) => string {
  const t = useTranslations("common.status");
  return (status) => {
    const key = statusKey(status);
    return key ? t(key) : (status ?? "");
  };
}

/** The shared ACTIVE/INACTIVE options, translated (replaces `STATUS_OPTIONS`). */
export function useStatusOptions(): { value: string; label: string }[] {
  const t = useTranslations("common.status");
  return useMemo(
    () => [
      { value: "ACTIVE", label: t("active") },
      { value: "INACTIVE", label: t("inactive") },
    ],
    [t],
  );
}
