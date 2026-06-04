"use client";

// Root-level segment error boundary.
//
// Catches errors thrown in any child segment that doesn't define its own
// `error.tsx`, e.g. the root `page.tsx`, or segments that render outside
// the `(igrp)` layout group. Errors thrown by the ROOT layout itself bubble
// past this file to `global-error.tsx`.

import { IGRPSegmentError } from "@igrp/framework-next-ui";
import { useEffect } from "react";

import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

export default function RootSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { segment: "root" });
  }, [error]);

  return (
    <IGRPSegmentError
      error={error}
      reset={reset}
      resolveCopy={resolveErrorCopy}
    />
  );
}
