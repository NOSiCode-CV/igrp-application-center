"use client";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

import type { ReportSort } from "../lib/report-query";

/* Same look as IGRPDataTable's `IGRPDataTableHeaderSortToggle` (ghost button,
   up / down / both-ways chevron), but driven by the URL instead of the
   table's internal sort state: that state can't be seeded from a link and is
   lost whenever the table remounts, and it would only sort the page on
   screen. Here the click asks the server for the whole report in order. */
export function SortableHeader({
  title,
  field,
  sort,
  onSort,
}: {
  title: string;
  field: string;
  sort?: ReportSort;
  onSort: (field: string) => void;
}) {
  const t = useTranslations("audit.sort");
  const direction = sort?.field === field ? sort.direction : undefined;
  const icon =
    direction === "asc"
      ? "ChevronUp"
      : direction === "desc"
        ? "ChevronDown"
        : "ArrowUpDown";

  return (
    <Button
      variant="ghost"
      size="sm"
      className="px-0 py-0 has-[>svg]:px-0"
      title={t("by", { title })}
      onClick={() => onSort(field)}
    >
      <span>{title}</span>
      <IGRPIcon
        iconName={icon}
        className="ms-2 text-muted-foreground"
        aria-hidden="true"
      />
      {direction && <span className="sr-only">, {t(direction)}</span>}
    </Button>
  );
}
