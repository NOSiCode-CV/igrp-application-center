"use client";

import { useEffect, useId } from "react";
import { useFormContext } from "react-hook-form";
import { IGRPTextarea, cn } from "@igrp/igrp-framework-react-design-system";

function fieldValueLength(value: unknown): number {
  if (value == null) return 0;
  return String(value).length;
}

export function LimitedTextareaField({
  id,
  label,
  maxLength,
  rows = 3,
  className,
  readOnly,
  placeholder,
  required,
}: {
  id: string;
  label: string;
  maxLength: number;
  rows?: number;
  className?: string;
  readOnly?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  const counterId = useId();
  const form = useFormContext();
  const value = form?.watch?.(id);
  const length = fieldValueLength(value);
  const atLimit = length >= maxLength;
  const nearLimit = length >= maxLength - 30;

  useEffect(() => {
    if (!form || length <= maxLength) return;
    form.setValue(id, String(value ?? "").slice(0, maxLength), {
      shouldValidate: true,
      shouldDirty: true,
    });
  }, [form, id, length, maxLength, value]);

  return (
    <div className="flex flex-col gap-2">
      <IGRPTextarea
        id={id}
        label={label}
        rows={rows}
        maxLength={maxLength}
        className={className}
        readOnly={readOnly}
        placeholder={placeholder}
        required={required}
        aria-describedby={counterId}
      />

      <div
        className="h-0.5 w-full overflow-hidden rounded-full bg-border/60"
        aria-hidden
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-300 ease-out",
            atLimit && "bg-destructive",
            nearLimit && !atLimit && "bg-warning",
            !nearLimit && "bg-primary/35",
          )}
          style={{
            width: `${Math.min(100, (length / maxLength) * 100)}%`,
          }}
        />
      </div>

      <div className="flex items-center justify-end">
        <p
          id={counterId}
          role="status"
          aria-live="polite"
          className={cn(
            "tabular-nums text-xs tracking-tight transition-colors",
            atLimit && "font-medium text-destructive",
            nearLimit && !atLimit && "text-warning-subtle-foreground",
            !nearLimit && "text-muted-foreground",
          )}
        >
          <span className="sr-only">Caracteres utilizados: </span>
          {length}
          <span aria-hidden="true"> / </span>
          <span className="sr-only"> de </span>
          {maxLength}
        </p>
      </div>
    </div>
  );
}
