"use client";

import { IGRPButton } from "@igrp/igrp-framework-react-design-system";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { SearchInput } from "@/components/data-table/search-input";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ApplicationsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (next: string[]) => void;
  disabled?: boolean;
  /** How many applications carry each status, shown beside each option. */
  statusCounts?: Record<string, number>;
  /** Drops the search term and the status selection in one press. */
  onClearFilters: () => void;
}

export function ApplicationsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
  statusCounts,
  onClearFilters,
}: ApplicationsToolbarProps) {
  const isFiltered = searchTerm !== "" || statusFilter.length > 0;

  return (
    /* Same row as the tables' own filter bar on `/settings/users`
       (`flex gap-2 flex-col md:flex-row md:items-center`), so the search box
       and the Estado button sit at the same spacing and break to a column at
       the same width on both pages. */
    <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
      <SearchInput
        value={searchTerm}
        onChange={onSearchChange}
        label="Pesquisar aplicações"
        placeholder="Pesquisar aplicações…"
        disabled={disabled}
      />
      <div className="flex flex-wrap items-center gap-2">
        <FacetedFilter
          label="Estado"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          disabled={disabled}
          counts={statusCounts}
        />

        {/* The tables on `/settings/users` grow this button as soon as any
            filter is set, and it disappears again once nothing is filtered.
            Same control, same wording ("Limpar", the design system's
            `dataTable.clearFilters` default), same appear/disappear rule. */}
        {isFiltered && !disabled && (
          <IGRPButton
            variant="ghost"
            showIcon
            iconName="X"
            onClick={onClearFilters}
          >
            Limpar
          </IGRPButton>
        )}
      </div>
    </div>
  );
}
