"use client";

import Link from "next/link";

import {
  Button,
  IGRPButton,
  IGRPCombobox,
  IGRPIcon,
  type IGRPOptionsProps,
} from "@igrp/igrp-framework-react-design-system";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { ROUTES } from "@/lib/constants";

export interface ServiceAccountFilters {
  search: string;
  /** Application code, "—" for accounts without one, "" for all. */
  application: string;
  status: string[];
}

export const EMPTY_SERVICE_ACCOUNT_FILTERS: ServiceAccountFilters = {
  search: "",
  application: "",
  status: [],
};

const STATUS = [
  { value: "ACTIVE", label: "Ativa" },
  { value: "INACTIVE", label: "Inativa" },
];

export function ServiceAccountToolbar({
  filters,
  onFiltersChange,
  applicationOptions,
  statusCounts,
  disabled = false,
}: {
  filters: ServiceAccountFilters;
  onFiltersChange: (next: ServiceAccountFilters) => void;
  applicationOptions: IGRPOptionsProps[];
  statusCounts: Record<string, number>;
  disabled?: boolean;
}) {
  const isFiltered =
    filters.search !== "" ||
    filters.application !== "" ||
    filters.status.length > 0;
  const set = <K extends keyof ServiceAccountFilters>(
    key: K,
    value: ServiceAccountFilters[K],
  ) => onFiltersChange({ ...filters, [key]: value });

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
      <div className="flex w-full flex-col gap-2 md:flex-row md:items-start">
        <SearchInput
          value={filters.search}
          onChange={(v) => set("search", v)}
          label="Pesquisar contas"
          placeholder="Pesquisar por nome ou client ID…"
          disabled={disabled}
        />
        <div className="flex flex-wrap items-start gap-2">
          {/* Same control and width as the Clientes OAuth tab: outside a
              form IGRPCombobox puts `className` on the trigger, so the width
              goes on this wrapper. */}
          <div className="w-60">
            <IGRPCombobox
              variant="single"
              showSearch
              options={applicationOptions}
              value={filters.application}
              onChange={(v) =>
                set("application", typeof v === "string" ? v : "")
              }
              placeholder="Aplicação"
              searchText="Pesquisar aplicações…"
              selectLabel="Nenhuma aplicação encontrada."
              disabled={disabled}
            />
          </div>
          <FacetedFilter
            label="Estado"
            options={STATUS}
            value={filters.status}
            onChange={(v) => set("status", v)}
            counts={statusCounts}
            disabled={disabled}
          />
          {isFiltered && !disabled ? (
            <IGRPButton
              variant="ghost"
              showIcon
              iconName="X"
              onClick={() => onFiltersChange(EMPTY_SERVICE_ACCOUNT_FILTERS)}
            >
              Limpar
            </IGRPButton>
          ) : null}
        </div>
      </div>
      <Button asChild className="shrink-0">
        <Link href={ROUTES.SERVICE_ACCOUNT_NEW}>
          <IGRPIcon iconName="Plus" aria-hidden="true" />
          Nova conta de serviço
        </Link>
      </Button>
    </div>
  );
}
