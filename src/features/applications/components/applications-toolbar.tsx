"use client";

import { useRef } from "react";

import { IGRPIcon, Input } from "@igrp/igrp-framework-react-design-system";

import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ApplicationsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (next: string[]) => void;
  disabled?: boolean;
  /** How many applications carry each status, shown beside each option. */
  statusCounts?: Record<string, number>;
}

export function ApplicationsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
  statusCounts,
}: ApplicationsToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clearSearch = () => {
    onSearchChange("");
    /* Keep the caret where the user was: clearing is a correction, not an
       exit, and they almost always type again straight after. */
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
      <div className="relative w-full max-w-sm">
        <IGRPIcon
          iconName="Search"
          aria-hidden="true"
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          ref={inputRef}
          type="search"
          aria-label="Pesquisar aplicações"
          spellCheck={false}
          placeholder="Pesquisar aplicações…"
          /* `pr-8` reserves the clear button's column so long queries never
             run under it. The `::-webkit-search-cancel-button` reset drops
             Chrome's own clear affordance, which would otherwise sit beside
             ours as a second, differently-styled X. */
          className="w-full bg-background pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape" && searchTerm) {
              e.preventDefault();
              clearSearch();
            }
          }}
          disabled={disabled}
        />
        {searchTerm && !disabled && (
          <button
            type="button"
            onClick={clearSearch}
            aria-label="Limpar pesquisa"
            className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background"
          >
            <IGRPIcon
              iconName="X"
              aria-hidden="true"
              className="h-3.5 w-3.5"
              strokeWidth={2}
            />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <FacetedFilter
          label="Estado"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          disabled={disabled}
          counts={statusCounts}
        />
      </div>
    </div>
  );
}
