"use client";

import {
  Button,
  IGRPIcon,
  IGRPSelect,
} from "@igrp/igrp-framework-react-design-system";

import { PAGE_SIZES } from "../lib/report-query";

/* Our own pager, not IGRPDataTable's: the table keeps its page index in
   internal state from 0 and cannot be seeded from the URL. */
const SIZE_OPTIONS = PAGE_SIZES.map((s) => ({
  label: `${s} por página`,
  value: String(s),
}));
const count = new Intl.NumberFormat("pt-PT");

interface ReportPagerProps {
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function ReportPager({
  page,
  size,
  totalPages,
  totalElements,
  onPageChange,
  onSizeChange,
  disabled = false,
}: ReportPagerProps) {
  const pages = Math.max(totalPages, 1);
  return (
    <nav
      aria-label="Paginação do relatório"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <p className="text-sm text-muted-foreground">
        {count.format(totalElements)}{" "}
        {totalElements === 1 ? "evento" : "eventos"}
      </p>
      <div className="flex items-center gap-2">
        <IGRPSelect
          id="report-page-size"
          label="Linhas por página"
          labelClassName="sr-only"
          options={SIZE_OPTIONS}
          value={String(size)}
          disabled={disabled}
          onValueChange={(v) => onSizeChange(Number(v))}
        />
        <Button
          variant="outline"
          size="icon"
          aria-label="Página anterior"
          disabled={disabled || page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          <IGRPIcon iconName="ChevronLeft" aria-hidden="true" />
        </Button>
        <span className="text-sm tabular-nums">
          Página {page + 1} de {pages}
        </span>
        <Button
          variant="outline"
          size="icon"
          aria-label="Página seguinte"
          disabled={disabled || page >= pages - 1}
          onClick={() => onPageChange(page + 1)}
        >
          <IGRPIcon iconName="ChevronRight" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
