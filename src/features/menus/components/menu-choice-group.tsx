"use client";

import {
  cn,
  RadioGroup,
  RadioGroupItem,
} from "@igrp/igrp-framework-react-design-system";

interface MenuChoiceGroupProps<T extends string> {
  /** Prefix for the radio ids, unique within the form. */
  name: string;
  value: T;
  options: ReadonlyArray<{ value: T; label: string }>;
  onChange: (value: T) => void;
  disabled?: boolean;
  "aria-label"?: string;
}

/** Side-by-side radio options for a short either/or choice in the menu form. */
export function MenuChoiceGroup<T extends string>({
  name,
  value,
  options,
  onChange,
  disabled,
  "aria-label": ariaLabel,
}: MenuChoiceGroupProps<T>) {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onChange(next as T)}
      disabled={disabled}
      aria-label={ariaLabel}
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
    >
      {options.map((option) => (
        <label
          key={option.value}
          htmlFor={`${name}-${option.value}`}
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
            "has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
            value === option.value
              ? "border-primary bg-primary/5"
              : "bg-background hover:bg-muted/50",
            disabled && "pointer-events-none opacity-60",
          )}
        >
          <RadioGroupItem id={`${name}-${option.value}`} value={option.value} />
          {option.label}
        </label>
      ))}
    </RadioGroup>
  );
}
