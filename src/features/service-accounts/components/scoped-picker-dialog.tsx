"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";

import {
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  IGRPCombobox,
  IGRPInputText,
  Label,
} from "@igrp/igrp-framework-react-design-system";

import { useDepartments } from "@/features/departments/use-departments";

export type PickerItem = {
  id: number;
  label: string;
  description?: string | null;
};

/**
 * Department-scoped multi-select (spec §5.4). Only the chosen department's
 * items are visible; `onConfirm` reports that scope so the caller replaces
 * the selection inside it and keeps the rest (`mergeScopedSelection`).
 */
export function ScopedPickerDialog({
  open,
  onOpenChange,
  title,
  description,
  departmentCode,
  onDepartmentChange,
  items,
  isLoading,
  isError,
  selectedIds,
  onConfirm,
  isSaving,
  confirmLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  departmentCode: string | undefined;
  onDepartmentChange: (code: string) => void;
  items: readonly PickerItem[];
  isLoading: boolean;
  isError: boolean;
  selectedIds: readonly number[];
  onConfirm: (r: { scopeIds: number[]; selectedIds: number[] }) => void;
  isSaving: boolean;
  confirmLabel: string;
}) {
  const id = useId();
  const { data: departments = [] } = useDepartments();
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<number>>(new Set());

  // Read through a ref: an account refetch hands us a new `selectedIds`
  // array, which must not wipe the ticks the admin is making.
  const selectedIdsRef = useRef(selectedIds);
  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // Seed only when the dialog opens or the visible scope changes
  // (department switch or load).
  // biome-ignore lint/correctness/useExhaustiveDependencies: departmentCode and open are re-seed triggers, not values read here.
  useEffect(() => {
    if (!open) return;
    const current = new Set(selectedIdsRef.current);
    setSelected(
      new Set(items.filter((i) => current.has(i.id)).map((i) => i.id)),
    );
  }, [open, departmentCode, items]);

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term
      ? items.filter((i) =>
          `${i.label} ${i.description ?? ""}`.toLowerCase().includes(term),
        )
      : items;
  }, [items, filter]);

  function toggle(itemId: number, on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (on) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] md:min-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {/* Both are Horizon fields, so labels and controls share one layout
            and line up side by side. */}
        <div className="grid gap-3 sm:grid-cols-2 sm:items-start">
          <IGRPCombobox
            id={`${id}-dept`}
            label="Departamento"
            variant="single"
            showSearch={departments.length >= 6}
            options={departments.map((d) => ({
              value: d.code,
              label: d.name,
            }))}
            value={departmentCode ?? ""}
            onChange={(v) => {
              if (typeof v === "string" && v) onDepartmentChange(v);
            }}
            placeholder="Selecionar departamento"
            searchText="Pesquisar departamento…"
            selectLabel="Nenhum departamento encontrado."
          />
          <IGRPInputText
            id={`${id}-filter`}
            label="Filtrar"
            placeholder="Nome ou código"
            showIcon
            iconName="Search"
            iconPlacement="start"
            value={filter}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setFilter(e.target.value)
            }
            disabled={!departmentCode}
          />
        </div>
        <div className="max-h-80 overflow-y-auto rounded-md border border-border">
          {!departmentCode ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Escolha um departamento para ver o que pode atribuir.
            </p>
          ) : isLoading ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              A carregar…
            </p>
          ) : isError ? (
            <p className="p-6 text-center text-sm text-destructive">
              Não foi possível carregar a lista. Feche e tente novamente.
            </p>
          ) : visible.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              Nada encontrado.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-border">
              {visible.map((item) => (
                <li key={item.id}>
                  <Label
                    htmlFor={`${id}-${item.id}`}
                    className="flex cursor-pointer items-start gap-3 p-3 font-normal"
                  >
                    <Checkbox
                      id={`${id}-${item.id}`}
                      checked={selected.has(item.id)}
                      onCheckedChange={(c) => toggle(item.id, c === true)}
                    />
                    <span className="flex flex-col gap-0.5">
                      <span className="font-mono text-sm">{item.label}</span>
                      {item.description ? (
                        <span className="text-sm text-muted-foreground">
                          {item.description}
                        </span>
                      ) : null}
                    </span>
                  </Label>
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            disabled={!departmentCode || isLoading || isError || isSaving}
            onClick={() =>
              onConfirm({
                scopeIds: items.map((i) => i.id),
                selectedIds: [...selected],
              })
            }
          >
            {isSaving ? "A guardar…" : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
