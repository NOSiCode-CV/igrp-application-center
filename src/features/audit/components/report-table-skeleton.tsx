"use client";

import { Skeleton } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

export function ReportTableSkeleton() {
  const t = useTranslations("audit");
  return (
    <div className="flex flex-col gap-2" role="status" aria-busy="true">
      <span className="sr-only">{t("loading.events")}</span>
      {Array.from({ length: 8 }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton loader
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
