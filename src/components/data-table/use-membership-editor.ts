"use client";

import { useEffect, useMemo, useState } from "react";

import type { RowSelectionState } from "@tanstack/react-table";

import type { ActionResult } from "@/actions/types";

export interface MembershipDiff {
  toAdd: string[];
  toRemove: string[];
}

/**
 * The selection behind an "edit what X is linked to" table: rows already
 * linked start selected, and the diff says what to add and remove. Each
 * caller brings its own `diff`, because the matching rule differs (codes vs
 * case-insensitive names).
 */
export function useMembershipEditor<T>({
  rows,
  existing,
  getKey,
  diff,
}: {
  rows: T[];
  existing: T[];
  /** Must match the table's `getRowId`. Keep it stable (module scope or useCallback). */
  getKey: (row: T) => string;
  diff: (selected: T[], existing: T[]) => MembershipDiff;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const existingKeys = useMemo(
    () => new Set(existing.map(getKey)),
    [existing, getKey],
  );

  // Re-seed when the row keys or the linked keys change (a new department, a
  // refetch with different data). Keyed on the keys, not the arrays, so a
  // caller that rebuilds an equal array each render neither loops nor wipes
  // the user's edits.
  const rowKeys = rows.map(getKey).join("\n");
  const linkedKeys = [...existingKeys].join("\n");
  // biome-ignore lint/correctness/useExhaustiveDependencies: rows/existingKeys are read through their key strings.
  useEffect(() => {
    const next: RowSelectionState = {};
    for (const row of rows) {
      const key = getKey(row);
      if (existingKeys.has(key)) next[key] = true;
    }
    setRowSelection(next);
  }, [rowKeys, linkedKeys]);

  const { toAdd, toRemove } = useMemo(
    () =>
      diff(
        rows.filter((row) => rowSelection[getKey(row)]),
        existing,
      ),
    [rows, rowSelection, getKey, diff, existing],
  );

  return {
    rowSelection,
    setRowSelection,
    toAdd,
    toRemove,
    hasChanges: toAdd.length > 0 || toRemove.length > 0,
  };
}

/** Adds first, then removes; throws the API's message when either refuses. */
export async function saveMembership(
  { toAdd, toRemove }: MembershipDiff,
  add: (codes: string[]) => Promise<ActionResult<unknown>>,
  remove: (codes: string[]) => Promise<ActionResult<unknown>>,
): Promise<void> {
  for (const [codes, run] of [
    [toAdd, add],
    [toRemove, remove],
  ] as const) {
    if (!codes.length) continue;
    const result = await run(codes);
    if (!result.success) throw new Error(result.error);
  }
}
