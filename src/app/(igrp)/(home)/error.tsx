"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";
import { useErrorMessage } from "@/i18n/server-error";

export default function HomeError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("workspace");
  const errorMessage = useErrorMessage();
  useEffect(() => {
    console.error("[home] segment error", error);
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
