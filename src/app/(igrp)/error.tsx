"use client";

// Segment-level error boundary for the `(igrp)` route group.
//
// Rendered *inside* `(igrp)/layout.tsx`, so the header + sidebar chrome stay
// visible. Use `IGRPSegmentError` (not `IGRPGlobalError`) to fit that slot.
// Errors thrown by `(igrp)/layout.tsx` itself propagate higher — the root
// `error.tsx` / `global-error.tsx` catches those.

import { useEffect } from "react";
import { IGRPSegmentError } from "@igrp/framework-next-ui";

import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

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
    <IGRPSegmentError
      error={error}
      reset={reset}
      resolveCopy={resolveErrorCopy}
    />
  );
}
