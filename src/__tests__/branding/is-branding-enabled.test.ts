import { afterEach, describe, expect, it, vi } from "vitest";

import { isBrandingEnabled } from "@/lib/utilities";

afterEach(() => vi.unstubAllEnvs());

describe("isBrandingEnabled", () => {
  it("is true only when the flag is exactly 'true' and auth is not bypassed", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
    expect(isBrandingEnabled()).toBe(true);
  });

  it.each(["", "false", "TRUE", "1"])("is false for flag %j", (value) => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", value);
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
    expect(isBrandingEnabled()).toBe(false);
  });

  it("is false in preview mode", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    expect(isBrandingEnabled()).toBe(false);
  });

  it("is false when AUTH_PROVIDER=none", () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "false");
    vi.stubEnv("AUTH_PROVIDER", "none");
    expect(isBrandingEnabled()).toBe(false);
  });
});
