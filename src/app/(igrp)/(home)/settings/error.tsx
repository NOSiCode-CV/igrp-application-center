"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";
import { useErrorMessage } from "@/i18n/server-error";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("settings");
  const errorMessage = useErrorMessage();
  useEffect(() => {
    console.error("[settings] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title={t("loadError")}
          message={errorMessage(error)}
          onRetry={reset}
        />
      }
    />
  );
}
