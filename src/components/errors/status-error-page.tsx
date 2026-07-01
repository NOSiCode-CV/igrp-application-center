"use client";

import { useRouter } from "next/navigation";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

import {
  FALLBACK_STATUS_COPY,
  STATUS_ERROR_COPY,
} from "@/config/error-messages";
import { isDefaultApiErrorMessage } from "@/lib/app-utilities";

export interface StatusErrorPageProps {
  /** HTTP status from the failed access-manager call, when known. */
  status?: number;
  /** Message extracted from the API error, shown as secondary text. */
  message?: string;
}

/**
 * Full-page error for HTTP failures (401/403/404/500/503 + fallback).
 * The default copy for the status is always shown; the API message is
 * rendered smaller below it, and suppressed when it merely repeats the
 * generic per-status fallback.
 */
export function StatusErrorPage({ status, message }: StatusErrorPageProps) {
  const router = useRouter();
  const copy =
    (status !== undefined && STATUS_ERROR_COPY[status]) || FALLBACK_STATUS_COPY;
  const apiMessage =
    message && !isDefaultApiErrorMessage(message) ? message : undefined;

  return (
    <div
      role="alert"
      className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center"
    >
      {status !== undefined && (
        <span className="text-8xl font-extrabold tracking-tight">{status}</span>
      )}
      <h2 className="text-lg font-semibold">{copy.title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">
        {copy.description}
      </p>
      {apiMessage && (
        <p className="text-muted-foreground/80 max-w-md text-xs">
          {apiMessage}
        </p>
      )}
      <div className="mt-2 flex gap-3">
        <IGRPButton variant="outline" onClick={() => router.back()}>
          Voltar
        </IGRPButton>
        <IGRPButton onClick={() => router.push("/")}>Início</IGRPButton>
      </div>
    </div>
  );
}
