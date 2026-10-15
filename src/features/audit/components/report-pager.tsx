"use client";

import {
  Button,
  IGRPCombobox,
  IGRPIcon,
} from "@igrp/igrp-framework-react-design-system";

import { PAGE_SIZES } from "../lib/report-query";

/* Our own pager, not IGRPDataTable's: the table keeps its page index in
   internal state from 0 and cannot be seeded from the URL. Laid out like the
   table's own pager (outline icon buttons, numbered pages) so the audit
   screen reads like every other list in the app. */
const SIZE_OPTIONS = PAGE_SIZES.map((s) => ({
  label: String(s),
  value: String(s),
}));
const count = new Intl.NumberFormat("pt-PT");

/**
 * 0-based page indexes to show as numbered buttons, with "gap" where pages
 * are skipped: always the first and last page, plus the current one and its
 * neighbours. Short runs are shown in full rather than as "1 … 3".
 */
export function pageWindow(page: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i);
  const start = Math.max(1, Math.min(page - 1, pages - 5));
  const end = Math.min(pages - 2, Math.max(page + 1, 4));
  const middle = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  return [
    0,
    ...(start > 1 ? (["gap"] as const) : []),
    ...middle,
    ...(end < pages - 2 ? (["gap"] as const) : []),
    pages - 1,
  ];
}

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
  const first = totalElements === 0 ? 0 : page * size + 1;
  const last = Math.min((page + 1) * size, totalElements);
  const atStart = disabled || page <= 0;
  const atEnd = disabled || page >= pages - 1;

  return (
    <nav
      aria-label="Paginação do relatório"
      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
    >
      <p className="text-sm text-muted-foreground tabular-nums">
        {first === last
          ? `${count.format(first)} de ${count.format(totalElements)}`
          : `${count.format(first)}–${count.format(last)} de ${count.format(totalElements)}`}{" "}
        {totalElements === 1 ? "evento" : "eventos"}
      </p>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="whitespace-nowrap text-sm text-muted-foreground"
          >
            Linhas por página
          </span>
          {/* Picking the current size again makes the combobox report "",
              which is not a size: ignore it. */}
          <IGRPCombobox
            id="report-page-size"
            showSearch={false}
            label="Linhas por página"
            labelClassName="sr-only"
            className="w-20"
            variant="single"
            options={SIZE_OPTIONS}
            value={String(size)}
            disabled={disabled}
            selectLabel="Sem resultados"
            onChange={(v) => {
              const next = Number(v);
              if (typeof v === "string" && next > 0) onSizeChange(next);
            }}
          />
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            aria-label="Primeira página"
            disabled={atStart}
            onClick={() => onPageChange(0)}
          >
            <IGRPIcon iconName="ChevronsLeft" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Página anterior"
            disabled={atStart}
            onClick={() => onPageChange(page - 1)}
          >
            <IGRPIcon iconName="ChevronLeft" aria-hidden="true" />
          </Button>

          {/* Numbered pages from `sm` up; on a phone the count alone. */}
          <ol className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, pages).map((p, i) =>
              p === "gap" ? (
                <li
                  // biome-ignore lint/suspicious/noArrayIndexKey: a gap has no identity beyond its position
                  key={`gap-${i}`}
                  aria-hidden="true"
                  className="w-6 text-center text-sm text-muted-foreground"
                >
                  …
                </li>
              ) : (
                <li key={p}>
                  <Button
                    variant={p === page ? "default" : "ghost"}
                    size="icon"
                    aria-label={`Página ${p + 1}`}
                    aria-current={p === page ? "page" : undefined}
                    disabled={disabled && p !== page}
                    className="tabular-nums"
                    onClick={() => {
                      if (p !== page) onPageChange(p);
                    }}
                  >
                    {p + 1}
                  </Button>
                </li>
              ),
            )}
          </ol>
          <span className="whitespace-nowrap px-2 text-sm tabular-nums sm:hidden">
            Página {page + 1} de {pages}
          </span>

          <Button
            variant="outline"
            size="icon"
            aria-label="Página seguinte"
            disabled={atEnd}
            onClick={() => onPageChange(page + 1)}
          >
            <IGRPIcon iconName="ChevronRight" aria-hidden="true" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Última página"
            disabled={atEnd}
            onClick={() => onPageChange(pages - 1)}
          >
            <IGRPIcon iconName="ChevronsRight" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
