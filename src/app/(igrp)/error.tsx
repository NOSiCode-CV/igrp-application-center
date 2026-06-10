"use client";

// Segment-level error boundary for the `(igrp)` route group.
//
// Rendered *inside* `(igrp)/layout.tsx`, so the header + sidebar chrome stay
// visible. HTTP failures (thrown as `HttpStatusError`) render the full-page
// status UI; anything else uses `IGRPSegmentError` as before. Errors thrown
// by `(igrp)/layout.tsx` itself propagate higher — the root `error.tsx` /
// `global-error.tsx` catches those.

import { useEffect } from "react";

import { IGRPSegmentError } from "@igrp/framework-next-ui";

import { StatusAwareError } from "@/components/errors/status-aware-error";
import { resolveErrorCopy } from "@/config/error-messages";
import { reportError } from "@/lib/report-error";

export default function IgrpSegmentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { segment: "(igrp)" });
  }, [error]);

  return (
    <StatusAwareError
      error={error}
      fallback={
        <IGRPSegmentError
          error={error}
          reset={reset}
          resolveCopy={resolveErrorCopy}
        />
      }
    />
  );
}
