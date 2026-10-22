import { describe, expect, it } from "vitest";

import {
  getStatusColor,
  statusClass,
  statusInviteClass,
} from "@/lib/utilities";

const RAW_COLOR =
  /\b(?:bg|text|border)-(?:gray|emerald|yellow|red|rose|amber|green)-\d{2,3}\b/;

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

describe("statusClass", () => {
  it("maps each known status to its semantic token class", () => {
    expect(statusClass("ACTIVE")).toBe("status-active");
    expect(statusClass("INACTIVE")).toBe("status-inactive");
    expect(statusClass("DELETED")).toBe("status-deleted");
  });

  it("tolerates surrounding whitespace", () => {
    expect(statusClass("  ACTIVE  ")).toBe("status-active");
  });

  it("falls back to inactive for empty or unknown statuses", () => {
    expect(statusClass("")).toBe("status-inactive");
    expect(statusClass("WHATEVER")).toBe("status-inactive");
  });

  it("does not emit raw palette colors for any status", () => {
    for (const status of ["ACTIVE", "INACTIVE", "DELETED", "", "x"]) {
      expect(String(statusClass(status))).not.toMatch(RAW_COLOR);
    }
  });
});

describe("statusInviteClass", () => {
  it("maps rejected/canceled invites to the deleted token class", () => {
    expect(statusInviteClass("REJECTED")).toBe("status-deleted");
    expect(statusInviteClass("CANCELED")).toBe("status-deleted");
  });

  it("treats pending and unknown invite statuses as pending", () => {
    expect(statusInviteClass("PENDING")).toBe("status-pending");
    expect(statusInviteClass("SOMETHING")).toBe("status-pending");
  });

  it("falls back to inactive for empty status", () => {
    expect(statusInviteClass("")).toBe("status-inactive");
  });

  it("does not emit raw palette colors for any status", () => {
    for (const status of ["REJECTED", "CANCELED", "PENDING", ""]) {
      expect(String(statusInviteClass(status))).not.toMatch(RAW_COLOR);
    }
  });
});
