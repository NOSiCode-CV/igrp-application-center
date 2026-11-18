import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  saveMembership,
  useMembershipEditor,
} from "@/components/data-table/use-membership-editor";

type Row = { code: string };
// Module scope: stable references, as the hook requires.
const rows: Row[] = [{ code: "A" }, { code: "B" }, { code: "C" }];
const linked: Row[] = [{ code: "A" }];
const getKey = (r: Row) => r.code;
const diff = (selected: Row[], existing: Row[]) => {
  const sel = new Set(selected.map(getKey));
  const ex = new Set(existing.map(getKey));
  return {
    toAdd: [...sel].filter((c) => !ex.has(c)),
    toRemove: [...ex].filter((c) => !sel.has(c)),
  };
};

describe("useMembershipEditor", () => {
  it("starts with the linked rows selected and nothing to save", () => {
    const { result } = renderHook(() =>
      useMembershipEditor({ rows, existing: linked, getKey, diff }),
    );
    expect(result.current.rowSelection).toEqual({ A: true });
    expect(result.current.hasChanges).toBe(false);
  });

  it("turns selection changes into adds and removes", () => {
    const { result } = renderHook(() =>
      useMembershipEditor({ rows, existing: linked, getKey, diff }),
    );
    act(() => result.current.setRowSelection({ B: true }));
    expect(result.current.toAdd).toEqual(["B"]);
    expect(result.current.toRemove).toEqual(["A"]);
  });

  it("keeps the user's edits when the caller rebuilds equal arrays each render", () => {
    const { result, rerender } = renderHook(() =>
      // New array identities every render, as a caller sorting inline would pass.
      useMembershipEditor({
        rows: [...rows],
        existing: [...linked],
        getKey,
        diff,
      }),
    );
    act(() => result.current.setRowSelection({ B: true }));
    rerender();
    expect(result.current.rowSelection).toEqual({ B: true });
  });

  it("re-seeds when the linked set changes", () => {
    const { result, rerender } = renderHook(
      ({ existing }) => useMembershipEditor({ rows, existing, getKey, diff }),
      { initialProps: { existing: linked } },
    );
    act(() => result.current.setRowSelection({}));
    rerender({ existing: [{ code: "C" }] });
    expect(result.current.rowSelection).toEqual({ C: true });
  });
});

describe("saveMembership", () => {
  it("adds before it removes and skips empty sides", async () => {
    const calls: string[] = [];
    const add = vi.fn(async () => {
      calls.push("add");
      return { success: true as const, data: null };
    });
    const remove = vi.fn(async () => {
      calls.push("remove");
      return { success: true as const, data: null };
    });
    await saveMembership({ toAdd: ["B"], toRemove: ["A"] }, add, remove);
    expect(calls).toEqual(["add", "remove"]);
    await saveMembership({ toAdd: [], toRemove: ["A"] }, add, remove);
    expect(add).toHaveBeenCalledTimes(1);
  });

  it("stops and throws the API message when adding fails", async () => {
    const remove = vi.fn();
    await expect(
      saveMembership(
        { toAdd: ["B"], toRemove: ["A"] },
        async () => ({ success: false as const, error: "proibido" }),
        remove,
      ),
    ).rejects.toThrow("proibido");
    expect(remove).not.toHaveBeenCalled();
  });
});
