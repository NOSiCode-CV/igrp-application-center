import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Badge: () => null,
  Button: () => null,
  IGRPIcon: () => null,
  Tooltip: () => null,
  TooltipContent: () => null,
  TooltipTrigger: () => null,
}));

vi.mock("next/image", () => ({ default: () => null }));

vi.mock("@/components/button-link-tooltip", () => ({
  ButtonLinkTooltip: () => null,
}));

import { filterApplications } from "@/features/applications/components/applications-grid";

const apps = [
  { code: "ALPHA", name: "Alpha", description: "first", status: "ACTIVE" },
  { code: "BETA", name: "Beta", description: "second", status: "INACTIVE" },
  { code: "GAMMA", name: "Gamma", description: undefined, status: "ACTIVE" },
] as unknown as ApplicationDTO[];

describe("filterApplications", () => {
  it("returns all when search and filter are empty", () => {
    expect(filterApplications(apps, "", [])).toHaveLength(3);
  });

  it("matches by name (case-insensitive)", () => {
    expect(filterApplications(apps, "alp", []).map((a) => a.code)).toEqual([
      "ALPHA",
    ]);
  });

  it("matches by code", () => {
    expect(filterApplications(apps, "beta", []).map((a) => a.code)).toEqual([
      "BETA",
    ]);
  });

  it("matches by description", () => {
    expect(filterApplications(apps, "second", []).map((a) => a.code)).toEqual([
      "BETA",
    ]);
  });

  it("filters by status", () => {
    expect(
      filterApplications(apps, "", ["ACTIVE"]).map((a) => a.code),
    ).toEqual(["ALPHA", "GAMMA"]);
  });

  it("combines search and status", () => {
    expect(
      filterApplications(apps, "a", ["ACTIVE"]).map((a) => a.code),
    ).toEqual(["ALPHA", "GAMMA"]);
  });
});
