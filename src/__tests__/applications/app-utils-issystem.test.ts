import type { ApplicationDTO } from "@igrp/platform-access-management-client-ts";
import { describe, expect, it } from "vitest";

import { isSystemApp } from "@/features/applications/app-utils";

describe("isSystemApp", () => {
  it("returns true when type is SYSTEM", () => {
    expect(isSystemApp({ type: "SYSTEM" } as unknown as ApplicationDTO)).toBe(
      true,
    );
  });

  it("returns false for INTERNAL or EXTERNAL", () => {
    expect(isSystemApp({ type: "INTERNAL" } as unknown as ApplicationDTO)).toBe(
      false,
    );
    expect(isSystemApp({ type: "EXTERNAL" } as unknown as ApplicationDTO)).toBe(
      false,
    );
  });

  it("returns false when type is missing", () => {
    expect(isSystemApp({} as ApplicationDTO)).toBe(false);
  });
});
