"use client";
import { IGRPGlobalError } from "@igrp/framework-next-ui";
import { useEffect } from "react";
import { resolveErrorCopy } from "@/config/error-messages";
import { reportError } from "@/lib/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { segment: "global" });
  }, [error]);
  void resolveErrorCopy(error);
  return (
    <html lang="pt-PT">
      <body>
        <IGRPGlobalError error={error} reset={reset} />
      </body>
    </html>
  );
}
