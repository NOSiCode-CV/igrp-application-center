import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ assert: vi.fn() }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));
vi.mock("@igrp/framework-next", () => ({
  igrpAssertAuthorize: (name: string) => mocks.assert(name),
}));
vi.mock("@/features/branding/components/branding-screen", () => ({
  BrandingScreen: () => null,
}));

import CustomizationPage from "@/app/(igrp)/(home)/settings/customization/page";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
});
afterEach(() => vi.unstubAllEnvs());

describe("/settings/customization", () => {
  it("is not found when the flag is off, before any permission check", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "false");
    await expect(CustomizationPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mocks.assert).not.toHaveBeenCalled();
  });

  it("is not found when auth is bypassed", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("AUTH_PROVIDER", "none");
    await expect(CustomizationPage()).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("asserts the customize permission when enabled", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    await CustomizationPage();
    expect(mocks.assert).toHaveBeenCalledWith("igrp.applications.customize");
  });
});
