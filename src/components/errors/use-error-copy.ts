"use client";

import { useTranslations } from "next-intl";

import { parseHttpStatusDigest, parsePublicDigest } from "@/lib/errors";
import { isDefaultApiErrorMessage } from "@/lib/utilities";

export type ErrorCopy = {
  title: string;
  description: string;
};

/** Framework `IgrpError.code` → `errors.codes.*` message key. */
const CODE_KEYS = {
  IGRP_CONFIG_NOT_INITIALIZED: "configNotInitialized",
  IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING: "accessManagementConfigMissing",
  IGRP_APP_CODE_MISSING: "appCodeMissing",
  IGRP_APP_HOME_SLUG_INVALID: "appHomeSlugInvalid",
  IGRP_AUTH_CONFIG_INVALID: "authConfigInvalid",
  IGRP_LAYOUT_DATA_FAILED: "layoutDataFailed",
} as const;

type CodeKey = (typeof CODE_KEYS)[keyof typeof CODE_KEYS];

function codeKeyOf(code: unknown): CodeKey | undefined {
  return typeof code === "string" && code in CODE_KEYS
    ? CODE_KEYS[code as keyof typeof CODE_KEYS]
    : undefined;
}

/**
 * Public message carried by the error across the server→client edge: the
 * API `detail` of an `HttpStatusError`, or the public message of an
 * `AppError`. Generic per-status fallbacks are not API messages → ignored.
 */
export function getPublicErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const digest = (error as { digest?: string }).digest;
  const message =
    parseHttpStatusDigest(digest)?.message ?? parsePublicDigest(digest).message;
  return message && !isDefaultApiErrorMessage(message) ? message : undefined;
}

/**
 * Error-boundary copy in the current language (replaces the removed
 * `src/config/error-messages.ts`). Preference order:
 *
 *   1. Known framework `code` → `errors.codes.<key>`.
 *   2. The API `detail` / AppError public message, shown as-is (FR-21).
 *   3. Generic `errors.unexpected`.
 *
 * Also returns the translated labels for the framework error components.
 */
export function useErrorCopy() {
  const t = useTranslations("errors");
  const tActions = useTranslations("common.actions");

  const resolveErrorCopy = (error: unknown): ErrorCopy => {
    const codeKey = codeKeyOf((error as { code?: unknown } | null)?.code);
    if (codeKey) {
      return {
        title: t(`codes.${codeKey}.title`),
        description: t(`codes.${codeKey}.description`),
      };
    }

    const message = getPublicErrorMessage(error);
    return {
      title: t("unexpected.title"),
      description: message ?? t("unexpected.description"),
    };
  };

  const labels = {
    homeLabel: tActions("backHome"),
    resetLabel: tActions("retry"),
    retryingLabel: tActions("retrying"),
    errorRefLabel: t("errorRef"),
  };

  return { resolveErrorCopy, labels, t };
}
