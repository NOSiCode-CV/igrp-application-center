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
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IGRPIcon iconName="FileSearch" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>
          {filtered
            ? "Nenhum evento corresponde aos filtros"
            : "Sem eventos neste período"}
        </EmptyTitle>
        <EmptyDescription>
          {filtered
            ? "Os filtros exigem o valor exato. Limpe-os para confirmar se existem eventos no período."
            : "Alargue o período para ver eventos anteriores."}
        </EmptyDescription>
      </EmptyHeader>
      {filtered && (
        <EmptyContent>
          <Button variant="outline" onClick={onClearFilters}>
            Limpar filtros
          </Button>
        </EmptyContent>
      )}
    </Empty>
  );
}
