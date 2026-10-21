"use client";

import {
  Button,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

/* A filtered empty page is usually a near-miss on an exact-match filter, not
   missing data (guide §9.8) — so the filtered variant says so and offers the
   way out. */
export function ReportEmptyState({
  filtered,
  onClearFilters,
}: {
  filtered: boolean;
  onClearFilters: () => void;
}) {
  const t = useTranslations("audit");
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IGRPIcon iconName="FileSearch" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {filtered ? t("empty.filteredTitle") : t("empty.title")}
        </EmptyTitle>
        <EmptyDescription>
          {filtered ? t("empty.filteredDescription") : t("empty.description")}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            {t("filters.clear")}
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
