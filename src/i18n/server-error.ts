// Server actions fall back to their own Portuguese strings when the API fails
// without a detail. Show those as the translated generic message; a real API
// detail already arrives translated through Accept-Language, so it passes through.

import { useCallback } from "react";

import { useTranslations } from "next-intl";

import { isDefaultApiErrorMessage } from "@/lib/utilities";

export function useServerErrorMessage(): (error?: string) => string {
  const t = useTranslations("common");
  return useCallback(
    (error) =>
      error && !isDefaultApiErrorMessage(error) ? error : t("serverError"),
    [t],
  );
}
