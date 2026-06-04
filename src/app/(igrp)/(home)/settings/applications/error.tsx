"use client";

import { useEffect } from "react";

import { InlineError } from "@/components/inline-error";

export default function ApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[applications] segment error", error);
  }, [error]);

  return (
    <InlineError
      title="Não foi possível carregar as aplicações."
      message={error.message}
      onRetry={reset}
    />
  );
}
