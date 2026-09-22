"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function SettingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[settings] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar as configurações."
          message={error.message}
          onRetry={reset}
        />
      }
    />
  );
}
