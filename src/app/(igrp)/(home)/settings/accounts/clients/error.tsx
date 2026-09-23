"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function OAuthClientsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[oauth-clients] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar os clientes OAuth."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={reset}
        />
      }
    />
  );
}
