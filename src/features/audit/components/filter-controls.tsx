"use client";

import { useEffect, useMemo, useState } from "react";

import {
  IGRPCombobox,
  IGRPSelect,
  Input,
  Label,
} from "@igrp/igrp-framework-react-design-system";

import type { FilterOption } from "../lib/audit-labels";

/* `IGRPSelect` keeps its selection in internal state and never re-reads
   `value`, so it is keyed on the value: "Limpar filtros" (or a back
   navigation) remounts it showing the URL's truth. Radix Select rejects an
   empty-string item, hence the sentinel for "Todos". */
const ALL = "__all__";

interface FilterFieldProps {
  id: string;
  label: string;
  options: FilterOption[];
  value?: string;
  onChange: (value: string | undefined) => void;
  disabled?: boolean;
}

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
    <IGRPSelect
      key={value ?? ALL}
      id={id}
      label={label}
      options={withAll}
      value={value ?? ALL}
      disabled={disabled}
      onValueChange={(next) => onChange(next === ALL ? undefined : next)}
    />
  );
}

export function FilterCombobox({
  id,
  label,
  options,
  value,
  onChange,
  disabled,
}: FilterFieldProps) {
  return (
    <IGRPCombobox
      id={id}
      label={label}
      variant="single"
      showSearch
      options={options}
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
