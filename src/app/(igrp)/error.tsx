"use client";
import { useEffect } from "react";
import { IGRPSegmentError } from "@igrp/framework-next-ui";
import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

export default function IgrpSegmentError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, { segment: "(igrp)" }); }, [error]);
  return <IGRPSegmentError error={error} reset={reset} resolveCopy={resolveErrorCopy} />;
}
