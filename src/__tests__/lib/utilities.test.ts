import { describe, expect, it } from "vitest";

import { getStatusColor } from "@/lib/utilities";

describe("getStatusColor", () => {
  it("returns the semantic active token for ACTIVE", () => {
    expect(getStatusColor("ACTIVE")).toBe("status-active");
  });

  it("returns the semantic inactive token for INACTIVE (no raw palette colors)", () => {
    const result = getStatusColor("INACTIVE");
    expect(result).toBe("status-inactive");
    expect(result).not.toMatch(/amber|bg-\w+-\d{3}/);
  });

  it("treats any non-ACTIVE status as inactive", () => {
    expect(getStatusColor("DELETED")).toBe("status-inactive");
    expect(getStatusColor("")).toBe("status-inactive");
  });
});
