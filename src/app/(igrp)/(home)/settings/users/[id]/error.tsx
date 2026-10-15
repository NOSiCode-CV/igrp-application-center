"use client";

import Link from "next/link";
import { useEffect } from "react";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { InlineError } from "@/components/inline-error";

export default function UserDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[users/:id] segment error", error);
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center gap-4">
          <InlineError
            title="Não foi possível carregar este utilizador."
            message={error.message}
            onRetry={reset}
          />
          <Link
            href="/settings/users"
            className="text-sm underline underline-offset-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
          >
            Voltar à lista de utilizadores
          </Link>
        </div>
      }
    />
  );
}
