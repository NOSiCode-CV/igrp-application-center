"use client";

import { useContext, useId, useMemo, useState } from "react";

import {
  Badge,
  Button,
  Checkbox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  cn,
  IGRPFormContext,
  IGRPIcon,
  type IGRPOptionsProps,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@igrp/igrp-framework-react-design-system";

export type MultiSelectOption = IGRPOptionsProps & { disabled?: boolean };

/**
 * O schema aceita string solta além de `string[]` (ver `apiOptionalStringArray`
 * em pedido-schema.ts), por isso o valor do campo normaliza-se sempre em lista.
 */
function toList(raw: unknown): string[] {
  if (Array.isArray(raw))
    return raw.filter((v): v is string => typeof v === "string");
  if (typeof raw === "string" && raw !== "") return [raw];
  return [];
}

export interface MultiSelectFieldProps {
  /** Field name in the surrounding `IGRPForm` schema. Ignored in controlled mode. */
  name?: string;
  label?: string;
  options: MultiSelectOption[];
  required?: boolean;
  disabled?: boolean;
  helperText?: string;
  /** Error message override; by default the form's own error for `name` is shown. */
  errorText?: string;
  /** Text on the trigger while nothing is picked. */
  placeholder?: string;
  /** Text inside the dropdown when no option matches the search. */
  emptyLabel?: string;
  searchPlaceholder?: string;
  /** Force the search box on/off. Default: shown from 8 options up. */
  showSearch?: boolean;
  /** Hide the "Selecionar tudo" / "Limpar" row. */
  hideBulkActions?: boolean;
  /** Cap on how many options can be picked. */
  maxSelected?: number;
  className?: string;
  /** Controlled mode (outside `IGRPForm`): pass both. */
  value?: string[];
  onChange?: (value: string[]) => void;
}

/**
 * Multi-select field for `IGRPForm` — o substituto de
 * `IGRPCombobox variant="multiple"`, cujo modo múltiplo não mantém o valor em
 * lista sincronizado com o formulário (`DESIGN_SYSTEM_REQUESTS.md §11`).
 *
 * Selection lives in a popover list with checkboxes; the picked options are
 * echoed underneath as removable chips, so the choices stay readable without
 * reopening the dropdown and no interactive control ends up nested inside the
 * trigger button.
 *
 * Works either bound to the form by `name`, or controlled via `value`/`onChange`.
 */
export function MultiSelectField({
  name,
  label,
  options,
  required,
  disabled,
  helperText,
  errorText,
  placeholder = "Selecione as opções",
  emptyLabel = "Sem opções disponíveis.",
  searchPlaceholder = "Pesquisar…",
  showSearch,
  hideBulkActions,
  maxSelected,
  className,
  value: valueProp,
  onChange,
}: MultiSelectFieldProps) {
  const fieldId = useId();
  const listId = `${fieldId}-list`;
  const helperId = `${fieldId}-helper`;
  const [open, setOpen] = useState(false);

  // `useIGRPFormContext` atira fora de um `IGRPForm`; o modo controlado tem de
  // funcionar em formulários react-hook-form normais, daí ler o contexto direto.
  const form = useContext(IGRPFormContext)?.form;
  const controlled = valueProp !== undefined;
  const rawValue = controlled
    ? valueProp
    : name
      ? form?.watch?.(name)
      : undefined;

  const selected = useMemo(() => toList(rawValue), [rawValue]);

  /**
   * O valor tal como está *agora*, não o da renderização que registou o
   * handler: dois cliques no mesmo tick (remover dois chips em sequência
   * rápida) partiam ambos do mesmo `selected` e o segundo desfazia o primeiro.
   */
  function selectedNow(): string[] {
    if (controlled) return selected;
    if (!name) return selected;
    return toList(form?.getValues?.(name));
  }

  const fieldError =
    errorText ??
    (name
      ? (form?.formState?.errors?.[name]?.message as string | undefined)
      : undefined);

  const optionByValue = useMemo(
    () => new Map(options.map((o) => [o.value, o])),
    [options],
  );
  const selectableValues = useMemo(
    () => options.filter((o) => !o.disabled).map((o) => o.value),
    [options],
  );
  const allSelected =
    selectableValues.length > 0 &&
    selectableValues.every((v) => selected.includes(v));
  const atLimit = maxSelected !== undefined && selected.length >= maxSelected;

  function commit(next: string[]) {
    if (controlled) {
      onChange?.(next);
      return;
    }
    onChange?.(next);
    if (!name) return;
    form?.setValue?.(name, next, {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    });
  }

  function toggle(optionValue: string) {
    const atual = selectedNow();
    if (atual.includes(optionValue)) {
      commit(atual.filter((v) => v !== optionValue));
      return;
    }
    if (maxSelected !== undefined && atual.length >= maxSelected) return;
    // Mantém a ordem das opções, não a ordem dos cliques — é o que o utilizador
    // vê na lista e o que torna o valor gravado estável entre edições.
    const next = options
      .map((o) => o.value)
      .filter((v) => v === optionValue || atual.includes(v));
    commit(next);
  }

  function remove(optionValue: string) {
    commit(selectedNow().filter((v) => v !== optionValue));
  }

  const searchVisible = showSearch ?? options.length >= 8;
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length === 1
        ? (optionByValue.get(selected[0])?.label ?? selected[0])
        : `${selected.length} opções selecionadas`;

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2", className)}>
      {label ? (
        <label
          htmlFor={fieldId}
          className="text-sm font-medium leading-none text-foreground"
        >
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </label>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={fieldId}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-invalid={fieldError ? true : undefined}
            aria-describedby={helperText ? helperId : undefined}
            disabled={disabled}
            className={cn(
              "w-full justify-between gap-2 font-normal",
              selected.length === 0 && "text-muted-foreground",
              fieldError && "border-destructive",
            )}
          >
            <span className="truncate">{summary}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              {selected.length > 1 ? (
                <Badge variant="secondary" className="tabular-nums">
                  {selected.length}
                </Badge>
              ) : null}
              <IGRPIcon
                iconName="ChevronsUpDown"
                className="size-4 opacity-50"
              />
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent
          align="start"
          className="w-72 min-w-(--radix-popover-trigger-width) max-w-[calc(100vw-2rem)] p-0"
        >
          <Command>
            {searchVisible ? (
              <CommandInput placeholder={searchPlaceholder} className="h-9" />
            ) : null}
            <CommandList id={listId} className="max-h-64">
              <CommandEmpty>{emptyLabel}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const isSelected = selected.includes(option.value);
                  const itemDisabled =
                    option.disabled || (atLimit && !isSelected);

                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      disabled={itemDisabled}
                      onSelect={() => toggle(option.value)}
                      className="flex items-start gap-3"
                    >
                      <Checkbox
                        checked={isSelected}
                        disabled={itemDisabled}
                        tabIndex={-1}
                        aria-hidden
                        className="pointer-events-none mt-0.5"
                      />
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="flex items-center gap-2 text-sm leading-snug">
                          {option.icon ? (
                            <IGRPIcon
                              iconName={option.icon}
                              className="size-4 shrink-0 text-muted-foreground"
                            />
                          ) : null}
                          {option.label}
                        </span>
                        {option.description ? (
                          <span className="text-xs leading-relaxed text-muted-foreground">
                            {option.description}
                          </span>
                        ) : null}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>

            {hideBulkActions || options.length === 0 ? null : (
              <div className="flex items-center justify-between gap-2 border-t p-2">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {selected.length} de {options.length}
                  {maxSelected !== undefined ? ` (máx. ${maxSelected})` : ""}
                </span>
                <span className="flex items-center gap-1">
                  {maxSelected === undefined ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={allSelected || selectableValues.length === 0}
                      onClick={() => commit(selectableValues)}
                    >
                      Selecionar tudo
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={selected.length === 0}
                    onClick={() => commit([])}
                  >
                    Limpar
                  </Button>
                </span>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((v) => {
            const option = optionByValue.get(v);
            return (
              <li key={v}>
                <Badge
                  variant="secondary"
                  className="gap-1 py-1 pr-1 pl-2 font-normal"
                >
                  <span className="truncate">{option?.label ?? v}</span>
                  {disabled ? null : (
                    <button
                      type="button"
                      onClick={() => remove(v)}
                      aria-label={`Remover ${option?.label ?? v}`}
                      className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
                    >
                      <IGRPIcon iconName="X" className="size-3" />
                    </button>
                  )}
                </Badge>
              </li>
            );
          })}
        </ul>
      ) : null}

      {fieldError ? (
        <p className="text-xs text-destructive">{fieldError}</p>
      ) : helperText ? (
        <p id={helperId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
