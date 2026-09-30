"use client";

import type { ReactNode } from "react";

import {
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  cn,
  IGRPIcon,
  Separator,
} from "@igrp/igrp-framework-react-design-system";

import { useLocalStorageState } from "@/hooks/use-local-storage-state";

import { formatYmd } from "../lib/platform-time";
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
  const [open, setOpen] = useLocalStorageState(PANEL_OPEN_KEY, true);

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section
        aria-label="Período e filtros"
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
              Período e filtros
            </Button>
          </CollapsibleTrigger>
          {open ? null : (
            <p className="text-sm text-muted-foreground">
              {queryLabel(range, filterCount)}
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
              Limpar filtros
            </Button>
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
  );
}

const PANEL_OPEN_KEY = "audit.query-panel.open";

const PRESET_LABEL = {
  "24h": "Últimas 24 horas",
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
} as const;

/** "Últimos 7 dias, 2 filtros": what the folded card is still applying. */
export function queryLabel(
  range: DateRangeSelection,
  filterCount: number,
): string {
  const period =
    range.preset !== "custom"
      ? PRESET_LABEL[range.preset]
      : range.from === range.to
        ? formatYmd(range.from)
        : `${formatYmd(range.from)} a ${formatYmd(range.to)}`;
  if (filterCount === 0) return `${period}, sem filtros`;
  return `${period}, ${filterCount} ${filterCount === 1 ? "filtro" : "filtros"}`;
}
