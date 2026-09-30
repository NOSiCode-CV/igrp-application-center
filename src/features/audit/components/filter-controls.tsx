"use client";

import { useEffect, useMemo, useState } from "react";

import {
  IGRPCombobox,
  Input,
  Label,
} from "@igrp/igrp-framework-react-design-system";

import type { FilterOption } from "../lib/audit-labels";

/* Every list filter is an `IGRPCombobox`. Fixed lists carry an explicit
   "Todos" option (a sentinel value) so clearing is one visible choice; the
   combobox also clears when the selected item is picked again (it reports
   ""), which both handlers map to "no filter". */
const ALL = "__all__";

interface FilterFieldProps {
  id: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

/** Short, fixed lists (enums): "Todos" listed first; search from 6 options. */
export function FilterSelect({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: FilterFieldProps) {
  const withAll = useMemo(
    () => [{ label: "Todos", value: ALL }, ...options],
    [options],
  );
  return (
    <IGRPCombobox
      id={id}
      label={label}
      variant="single"
      // The combobox shows a search box unless told otherwise; short lists
      // don't need one.
      showSearch={withAll.length >= 6}
      options={withAll}
      value={value ?? ALL}
      disabled={disabled}
      placeholder="Todos"
      selectLabel="Sem resultados"
      onChange={(next) =>
        onChange(
          typeof next === "string" && next && next !== ALL ? next : undefined,
        )
      }
    />
  );
}

/** Long, searchable lists (users, applications). */
export function FilterCombobox({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: FilterFieldProps) {
  /* IGRPCombobox renders `selected?.label ?? placeholder`: a URL value that
     isn't in `options` (a deleted/renamed user or module, or the options
     query still loading) would silently show "Todos" while the report stays
     filtered. Appending it as its own option keeps the visible value honest. */
  const withValue = useMemo(() => {
    if (!value || options.some((o) => o.value === value)) return options;
    return [...options, { label: value, value }];
  }, [options, value]);

  return (
    <IGRPCombobox
      id={id}
      label={label}
      variant="single"
      showSearch={withValue.length >= 6}
      options={withValue}
      value={value ?? ""}
      disabled={disabled}
      placeholder="Todos"
      searchText="Pesquisar…"
      selectLabel="Sem resultados"
      onChange={(next) =>
        onChange(typeof next === "string" && next ? next : undefined)
      }
    />
  );
}

interface ExactMatchInputProps {
  id: string;
  label: string;
  value?: string;
  onCommit: (value: string | undefined) => void;
  placeholder?: string;
  /** How the server matches this field. Most report filters are exact. */
  hint?: string;
}

/* Report filters are exact-match (guide §9.8), so this commits on Enter or
   blur — not per keystroke — and says under the field how it matches. */
export function ExactMatchInput({
  id,
  label,
  value,
  onCommit,
  placeholder,
  hint = "Correspondência exata",
}: ExactMatchInputProps) {
  const [draft, setDraft] = useState(value ?? "");
  useEffect(() => setDraft(value ?? ""), [value]);

  const commit = () => {
    const next = draft.trim();
    if (next !== (value ?? "")) onCommit(next || undefined);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={draft}
        placeholder={placeholder}
        spellCheck={false}
        aria-describedby={`${id}-hint`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
        }}
      />
      <p id={`${id}-hint`} className="text-xs text-muted-foreground">
        {hint}
      </p>
    </div>
  );
}
