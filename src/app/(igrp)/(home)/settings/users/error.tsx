"use client";

import { useEffect } from "react";

import { IGRPButton, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { StatusAwareError } from "@/components/errors/status-aware-error";

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

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center gap-4 p-10 text-center">
          <IGRPIcon
            iconName="AlertTriangle"
            className="size-10 text-destructive"
          />
          <h2 className="text-lg font-semibold">
            Não foi possível carregar os utilizadores
          </h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {error.message}
          </p>
          <IGRPButton onClick={reset}>Tentar novamente</IGRPButton>
        </div>
      }
    />
  );
}
