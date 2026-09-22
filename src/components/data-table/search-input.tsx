"use client";

import { useRef } from "react";

import { IGRPIcon, Input } from "@igrp/igrp-framework-react-design-system";
import type { Column } from "@tanstack/react-table";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Placeholder AND accessible name — one string, so they never drift apart. */
  placeholder: string;
  label: string;
  disabled?: boolean;
}

/**
 * The search field shared by the list surfaces — `/settings/applications`,
 * which filters plain React state, and `/settings/users`, which filters a
 * TanStack column through `ColumnSearchInput` below.
 *
 * One component rather than two look-alikes: the two pages previously showed a
 * `Search`-icon box with a small square X on one and the design system's
 * `ListFilter`-icon box with a full-height `CircleX` on the other, at different
 * widths, with Escape clearing on only one of them.
 */
export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  disabled = false,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const clear = () => {
    onChange("");
    /* Keep the caret where the user was: clearing is a correction, not an
       exit, and they almost always type again straight after. */
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-sm">
      <IGRPIcon
        iconName="Search"
        aria-hidden="true"
        className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
        strokeWidth={2}
      />
      <Input
        ref={inputRef}
        type="search"
        aria-label={label}
        spellCheck={false}
        placeholder={placeholder}
        /* `pr-8` reserves the clear button's column so long queries never
           run under it. The `::-webkit-search-cancel-button` reset drops
           Chrome's own clear affordance, which would otherwise sit beside
           ours as a second, differently-styled X. */
        className="w-full bg-background pl-8 pr-8 [&::-webkit-search-cancel-button]:appearance-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && value) {
            e.preventDefault();
            clear();
          }
        }}
        disabled={disabled}
      />
      {value && !disabled && (
        <button
          type="button"
          onClick={clear}
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
  );
}

interface ColumnSearchInputProps<TData> {
  column: Column<TData, unknown>;
  placeholder: string;
  label: string;
}

/**
 * `SearchInput` bound to a TanStack column, for `IGRPDataTable`'s
 * `clientFilters`. Replaces `IGRPDataTableFilterInput` so the tables on
 * `/settings/users` search through the same control as
 * `/settings/applications`.
 */
export function ColumnSearchInput<TData>({
  column,
  placeholder,
  label,
}: ColumnSearchInputProps<TData>) {
  return (
    <SearchInput
      value={(column.getFilterValue() as string) ?? ""}
      /* `undefined`, not `""`, once the box is empty: an empty string still
         counts as an active column filter, which would leave the table's
         "Limpar Filtro" button standing with nothing to clear. */
      onChange={(next) => column.setFilterValue(next || undefined)}
      placeholder={placeholder}
      label={label}
    />
  );
}
