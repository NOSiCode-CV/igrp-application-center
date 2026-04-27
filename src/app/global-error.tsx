"use client";
import { useEffect } from "react";
import { IGRPGlobalError } from "@igrp/framework-next-ui";
import { reportError } from "@/lib/report-error";
import { resolveErrorCopy } from "@/config/error-messages";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, { segment: "global" }); }, [error]);
  void resolveErrorCopy(error);
  return (
    <html lang="pt-PT">
      <body><IGRPGlobalError error={error} reset={reset} /></body>
    </html>
  );
}
