"use client";

import { IGRPBadge } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { statusDisplay } from "../lib/i18n";

export function AuditStatusBadge({ status }: { status?: string | null }) {
  const t = useTranslations("audit");
  const display = statusDisplay(t, status);
  if (!display) return <span className="text-muted-foreground">—</span>;
  return (
    <IGRPBadge variant="soft" color={display.color}>
      {display.label}
    </IGRPBadge>
  );
}
