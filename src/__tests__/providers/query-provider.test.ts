import { describe, expect, it } from "vitest";

import { makeQueryClient } from "@/providers/query-client";

describe("makeQueryClient", () => {
  it("returns a client with sane defaults for hydration", () => {
    const client = makeQueryClient();
    const defaults = client.getDefaultOptions().queries;
    expect(defaults?.staleTime).toBeGreaterThanOrEqual(30_000);
    expect(defaults?.refetchOnWindowFocus).toBe(false);
    expect(defaults?.retry).toBe(false);
  });
});
