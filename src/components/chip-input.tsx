"use client";

import { type KeyboardEvent, useState } from "react";

import {cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

interface ChipInputProps {
  /** Optional because the DS `FormControl` (a Radix `Slot`) injects it at runtime. */
  id?: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  mono?: boolean;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}

export function ChipInput({
  id,
  value,
  onChange,
  placeholder = "Adicionar…",
  mono,
  ...aria
}: ChipInputProps) {
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");

  function commit() {
    const next = draft.trim();
    setDraft("");
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
    setAnnouncement(`${next} adicionado`);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring",
        aria["aria-invalid"] && "border-destructive",
      )}
    >
      {value.map((chip) => (
        <span
          key={chip}
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-muted ps-2.5 text-sm",
            mono && "font-mono text-xs",
          )}
        >
          {chip}
          <button
            type="button"
            className="inline-flex size-7 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Remover ${chip}`}
            onClick={() => onChange(value.filter((v) => v !== chip))}
          >
            <IGRPIcon iconName="X" className="size-3.5" aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        id={id}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={commit}
        placeholder={placeholder}
        className={cn(
          "h-7 min-w-48 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground",
          mono && "font-mono text-xs",
        )}
        {...aria}
      />
      <span role="status" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
