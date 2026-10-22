// Server actions fall back to their own Portuguese strings when the API fails
// without a detail. Show those as the translated generic message; a real API
// detail already arrives translated through Accept-Language, so it passes through.

import { useCallback } from "react";

import { useTranslations } from "next-intl";

import { getDisplayableErrorMessage } from "@/lib/errors";
import { isDefaultApiErrorMessage } from "@/lib/utilities";

export function useServerErrorMessage(): (error?: string) => string {
  const t = useTranslations("common");
  return useCallback(
    (error) =>
      error && !isDefaultApiErrorMessage(error) ? error : t("serverError"),
    [t],
  );
}

/**
 * For errors rendered inside a page (query errors, error boundaries): an
 * AppError's public message or a real API detail is kept; Next's production
 * redaction text, the actions' pt fallbacks and non-errors become the
 * translated generic message.
 */
export function useErrorMessage(): (error: unknown) => string {
  const serverError = useServerErrorMessage();
  return useCallback(
    (error) =>
      serverError(
        error instanceof Error
          ? getDisplayableErrorMessage(error, "").message
          : undefined,
      ),
    [serverError],
  );
}
