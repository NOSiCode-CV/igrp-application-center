"use client";

import type { ReactNode } from "react";

import { parseHttpStatusDigest } from "@/lib/errors";

import { StatusErrorPage } from "./status-error-page";

export interface StatusAwareErrorProps {
  error: Error & { digest?: string };
  /** Rendered when the error does NOT carry an HTTP status digest. */
  fallback: ReactNode;
}

/**
 * Shared logic for segment `error.tsx` boundaries: HTTP failures thrown as
 * `HttpStatusError` render the full-page status UI; anything else falls
 * back to the segment's existing error UI.
 */
export function StatusAwareError({ error, fallback }: StatusAwareErrorProps) {
  const parsed = parseHttpStatusDigest(error.digest);
  if (parsed) {
    return <StatusErrorPage status={parsed.status} message={parsed.message} />;
  }
  return <>{fallback}</>;
}
