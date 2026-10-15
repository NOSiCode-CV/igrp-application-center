"use client";

// Segment-level error boundary for the `(auth)` route group — covers
// /login, /logout, and anything else rendered under the auth layout.
//
// Auth failures are the most common concrete reason a user sees this screen,
// so the fallback copy is tuned toward provider / config issues.

import { useEffect } from "react";

import {
  IGRPSegmentError,
  type IGRPSegmentErrorProps,
} from "@igrp/framework-next-ui";

import { useErrorCopy } from "@/components/errors/use-error-copy";
import { reportError } from "@/lib/report-error";

export default function AuthSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { resolveErrorCopy, labels, t } = useErrorCopy();

  useEffect(() => {
    reportError(error, { segment: "(auth)" });
  }, [error]);

  const resolveAuthCopy: NonNullable<IGRPSegmentErrorProps["resolveCopy"]> = (
    err,
  ) => {
    // If the framework didn't tag the error with a known code, swap in the
    // auth-scoped fallback instead of the generic one.
    if (!err || typeof err !== "object" || !("code" in (err as object))) {
      return { title: t("auth.title"), description: t("auth.description") };
    }
    return resolveErrorCopy(err);
  };

  return (
    <IGRPSegmentError
      error={error}
      reset={reset}
      resolveCopy={resolveAuthCopy}
      {...labels}
    />
  );
}
