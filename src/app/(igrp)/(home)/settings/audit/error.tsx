"use client";

import { useEffect } from "react";

import { useTranslations } from "next-intl";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function AuditError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("audit.error");
  useEffect(() => {
    console.error("[audit-segment] error:", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError title={t("page")} message={t("message")} onRetry={reset} />
      }
    />
  );
}
