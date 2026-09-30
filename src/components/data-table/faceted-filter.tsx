"use client";

import { useId } from "react";

import {
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  IGRPBadge,
  IGRPIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
} from "@igrp/igrp-framework-react-design-system";
import type { Column } from "@tanstack/react-table";

export interface FacetedFilterOption {
  value: string;
  label: string;
}

interface FacetedFilterProps {
  label: string;
  options: readonly FacetedFilterOption[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  /**
   * How many rows carry each option, keyed by option value. Omitted when the
   * caller does not know — the count is then left out rather than rendered as
   * a zero the filter cannot vouch for.
   */
  counts?: Record<string, number>;
}

/**
 * The state filter for surfaces that filter plain React state rather than a
 * TanStack table — `/settings/applications`, where there is no `Column` to hand
 * to the design system's `IGRPDataTableFilterFaceted`.
 *
 * It is deliberately built from the SAME primitives that component uses
 * (Popover + Command + a real `Checkbox` per row, selected count as a soft
 * badge in the trigger, "Limpar Filtro" at the foot) so the Estado filter looks
 * and behaves identically on `/settings/applications` and `/settings/users`.
 * The previous version was a `DropdownMenuCheckboxItem` list with the count
 * inlined into the trigger's text — same job, different control, two screens
 * apart.
 *
 * If the design system ever exposes this popover independently of `Column`,
 * delete this file and use it directly.
 */
export function FacetedFilter({
  label,
  options,
  value,
  onChange,
  disabled = false,
  counts,
}: FacetedFilterProps) {
  const id = useId();

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <IGRPIcon iconName="BadgePlus" aria-hidden="true" />
          {label}
          {value.length > 0 && (
            <>
              <Separator orientation="vertical" className="h-2" />
              <IGRPBadge
                variant="soft"
                color="primary"
                badgeClassName="rounded-sm px-1 font-normal"
              >
                {value.length}
              </IGRPBadge>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto min-w-36 p-1" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option, i) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => toggle(option.value)}
                  className="gap-2"
                >
                  <Checkbox
                    id={`${id}-${i}`}
                    checked={value.includes(option.value)}
                    onCheckedChange={() => toggle(option.value)}
                    aria-label={option.label}
                    className="border-foreground"
                  />
                  <label
                    htmlFor={`${id}-${i}`}
                    className="flex-1 cursor-pointer"
                  >
                    {option.label}
                  </label>
                  {counts && (
                    <span className="ml-auto font-mono text-xs">
                      {counts[option.value] ?? 0}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {value.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem onSelect={() => onChange([])}>
                    <IGRPIcon iconName="X" aria-hidden="true" />
                    Limpar Filtro
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ColumnFacetedFilterProps<TData> {
  column: Column<TData, unknown>;
  label: string;
  options: readonly FacetedFilterOption[];
}

/**
 * `FacetedFilter` bound to a TanStack column, for `IGRPDataTable`'s
 * `clientFilters`. Replaces `IGRPDataTableFilterFaceted` so the Estado filter
 * on `/settings/users` is literally the same control as the one on
 * `/settings/applications`, counts included — the design system's version
 * reads its counts from the column's facets, which this does too.
 */
export function ColumnFacetedFilter<TData>({
  column,
  label,
  options,
}: ColumnFacetedFilterProps<TData>) {
  const selected = (column.getFilterValue() as string[] | undefined) ?? [];

  const counts: Record<string, number> = {};
  for (const [value, count] of column.getFacetedUniqueValues()) {
    counts[String(value)] = count;
  }

  return (
    <FacetedFilter
      label={label}
      options={options}
      value={selected}
      /* `undefined` on an empty selection, for the same reason as the search
         box: an empty array still reads as an active filter. */
      onChange={(next) => column.setFilterValue(next.length ? next : undefined)}
      counts={counts}
    />
  );
}
