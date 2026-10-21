"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function ServiceAccountDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("serviceAccounts.error");
  useEffect(() => {
    console.error("[service-account] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title={t("detailTitle")}
          message={error.message}
          onRetry={reset}
        />
      }
    />
  );
}
