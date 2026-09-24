"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function ServiceAccountsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[service-accounts] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar as contas de serviço."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={reset}
        />
      }
    />
  );
}
