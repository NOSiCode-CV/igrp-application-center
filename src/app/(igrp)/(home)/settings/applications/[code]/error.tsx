"use client";

import { useEffect } from "react";

import { InlineError } from "@/components/inline-error";

export default function ApplicationDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[applications/:code] segment error", error);
  }, [error]);

  return (
    <InlineError
      title="Não foi possível carregar esta aplicação."
      message={error.message}
      onRetry={reset}
    />
  );
}
