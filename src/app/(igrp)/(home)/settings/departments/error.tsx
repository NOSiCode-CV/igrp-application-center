"use client";

import { useEffect } from "react";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { parseHttpStatusDigest } from "@/lib/errors";
import { reportError } from "@/lib/report-error";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function DepartmentsError({ error, reset }: Props) {
  useEffect(() => {
    // Skip reporting expected client errors (4xx like 401/403/404) — they are
    // routine authorization/not-found outcomes, not observability signal.
    const status = parseHttpStatusDigest(error.digest)?.status;
    const isExpectedClientError =
      status !== undefined && status >= 400 && status < 500;
    if (!isExpectedClientError) {
      reportError(error, { segment: "settings/departments" });
    }
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[320px] gap-4 px-6 text-center">
          <IGRPIcon
            iconName="TriangleAlert"
            className="size-10 text-destructive"
            strokeWidth={1.5}
          />
          <h2 className="text-lg font-semibold">
            Não foi possível carregar departamentos
          </h2>
          <p className="text-muted-foreground text-sm max-w-md">
            Ocorreu um erro ao obter a lista. Tenta novamente; se persistir,
            contacta o suporte.
          </p>
          <Button onClick={reset} variant="outline">
            <IGRPIcon iconName="RefreshCw" className="size-4" strokeWidth={2} />
            Tentar novamente
          </Button>
          {error.digest && (
            <p className="text-muted-foreground text-xs">Ref: {error.digest}</p>
          )}
        </div>
      }
    />
  );
}
