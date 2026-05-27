"use client";

import { IGRPIcon, Input } from "@igrp/igrp-framework-react-design-system";
import { FacetedFilter } from "@/components/data-table/faceted-filter";
import { STATUS_OPTIONS } from "@/lib/constants";

interface ApplicationsToolbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string[];
  onStatusFilterChange: (next: string[]) => void;
  disabled?: boolean;
}

export function ApplicationsToolbar({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  disabled = false,
}: ApplicationsToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 w-full">
      <div className="relative w-full max-w-sm">
        <IGRPIcon
          iconName="Search"
          className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
          strokeWidth={2}
        />
        <Input
          type="search"
          placeholder="Pesquisar aplicações..."
          className="w-full bg-background pl-8"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <FacetedFilter
          label="Estado"
          options={STATUS_OPTIONS}
          value={statusFilter}
          onChange={onStatusFilterChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
