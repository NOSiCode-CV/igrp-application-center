"use client";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";

/** An audit timestamp in the platform zone (ADR-0001); a dash when absent or unparseable. */
export function AuditDateTime({ value }: { value?: string | null }) {
  const { formatDateTime } = useIGRPFormat();
  return (
    formatDateTime(value, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) || "—"
  );
}
