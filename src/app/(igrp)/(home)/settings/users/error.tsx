"use client";

import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[users-segment] error:", error);
  }, [error]);

  /* `InlineError`, like every other settings segment: this route had its own
     hand-rolled fallback with its own icon, its own heading level and the raw
     `error.message` shown to an administrator. One vocabulary — and the message
     an API returns is not copy anyone wrote for this screen. */
  return (
    <StatusAwareError
      error={error}
      fallback={
        <InlineError
          title="Não foi possível carregar os utilizadores."
          message="Tente novamente. Se o problema persistir, contacte o suporte."
          onRetry={reset}
        />
      }
    />
  );
}
