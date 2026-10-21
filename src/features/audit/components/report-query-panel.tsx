"use client";

import type { ReactNode } from "react";

import { useIGRPFormat } from "@igrp/framework-next/i18n/client";
import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  IGRPIcon,
  Separator,
} from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import { useLocalStorageState } from "@/hooks/use-local-storage-state";

import type { AuditTranslator } from "../lib/i18n";
import type { DateRangeSelection } from "../lib/report-query";

/* Everything that defines the Report on screen, in one place. The separator
   splits what survives a tab switch (the period) from what doesn't (the
   tab's own filters). "Limpar filtros" stays in place, disabled, so the row
   doesn't jump when the first filter is set. The card folds away to give the
   table room; folded, its header still says what is applied, and the choice
   is remembered per browser. */
export function ReportQueryPanel({
  period,
  filters,
  range,
  filterCount,
  onClearFilters,
}: {
  period?: ReactNode;
  filters: ReactNode;
  range: DateRangeSelection;
  filterCount: number;
  onClearFilters: () => void;
}) {
  const t = useTranslations("audit");
  const { formatDate } = useIGRPFormat();
  const [open, setOpen] = useLocalStorageState(PANEL_OPEN_KEY, true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section
        aria-label={t("panel.title")}
        className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 md:p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 px-2 font-semibold"
            >
              <IGRPIcon
                iconName="ChevronDown"
                className={cn(
                  "transition-transform motion-reduce:transition-none",
                  !open && "-rotate-90",
                )}
                aria-hidden="true"
              />
              {t("panel.title")}
            </Button>
          </CollapsibleTrigger>
          {open ? null : (
            <p className="text-sm text-muted-foreground">
              {queryLabel(t, formatDate, range, filterCount)}
            </p>
          )}
        </div>
        <CollapsibleContent className="flex flex-col gap-4">
          {period ? (
            <>
              {period}
              <Separator />
            </>
          ) : null}
          {filters}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              disabled={filterCount === 0}
              onClick={onClearFilters}
            >
              <IGRPIcon iconName="X" aria-hidden="true" />
              {t("filters.clear")}
            </Button>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

const PANEL_OPEN_KEY = "audit.query-panel.open";

const PRESET_KEY = {
  "24h": "last24h",
  "7d": "last7d",
  "30d": "last30d",
} as const;

/** "Last 7 days, 2 filters": what the folded card is still applying. */
export function queryLabel(
  t: AuditTranslator,
  formatDate: (value: string) => string,
  range: DateRangeSelection,
  filterCount: number,
): string {
  const period =
    range.preset !== "custom"
      ? t(`period.${PRESET_KEY[range.preset]}`)
      : range.from === range.to
        ? formatDate(range.from)
        : t("panel.dateSpan", {
            from: formatDate(range.from),
            to: formatDate(range.to),
          });
  if (filterCount === 0) return t("panel.noFilters", { period });
  return t("panel.filterCount", { period, count: filterCount });
}
