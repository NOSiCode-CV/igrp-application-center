// src/__tests__/lib/use-local-storage-state.test.ts
import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { useLocalStorageState } from "@/hooks/use-local-storage-state";

beforeEach(() => localStorage.clear());

describe("useLocalStorageState", () => {
  it("returns the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorageState("k", "init"));
    expect(result.current[0]).toBe("init");
  });

  it("persists and rehydrates the value", () => {
    const { result, unmount } = renderHook(() =>
      useLocalStorageState("k", "init"),
    );
    act(() => result.current[1]("next"));
    expect(JSON.parse(localStorage.getItem("k") as string)).toBe("next");
    unmount();
    const again = renderHook(() => useLocalStorageState("k", "init"));
    expect(again.result.current[0]).toBe("next");
  });

  it("supports updater functions", () => {
    const { result } = renderHook(() => useLocalStorageState("n", 1));
    act(() => result.current[1]((p) => p + 1));
    expect(result.current[0]).toBe(2);
  });
});
