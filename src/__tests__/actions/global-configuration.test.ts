import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  authorize: vi.fn(),
  invalidate: vi.fn(),
  cookieSet: vi.fn(),
  revalidatePath: vi.fn(),
  calls: [] as string[],
}));

vi.mock("@/actions/access-client", () => ({
  getClientAccess: vi.fn(async () => ({
    globalConfiguration: {
      getGlobalConfiguration: mocks.get,
      setGlobalConfiguration: mocks.set,
    },
  })),
}));
vi.mock("@igrp/framework-next", () => ({
  igrpAuthorize: (name: string) => mocks.authorize(name),
  igrpInvalidateBranding: (...a: unknown[]) => {
    mocks.calls.push("invalidate");
    mocks.invalidate(...a);
  },
  BRAND_FRESHNESS_COOKIE: "igrp_brand_v",
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    set: (...a: unknown[]) => {
      mocks.calls.push("cookie");
      mocks.cookieSet(...a);
    },
  }),
}));
vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => {
    mocks.calls.push("revalidate");
    mocks.revalidatePath(...a);
  },
}));

import { getBranding, saveBranding } from "@/actions/global-configuration";

const MINIO = "https://minio.example/igrp";
const valid = {
  version: 1,
  tokens: { light: { "--primary": "oklch(0.45 0.18 250)" }, dark: {} },
  logos: { header: { light: `${MINIO}/public/branding/u/mark.png` } },
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls.length = 0;
  vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
  vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO);
  mocks.authorize.mockResolvedValue(true);
  mocks.set.mockImplementation(async () => {
    mocks.calls.push("post");
    return { data: {} };
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getBranding", () => {
  it("parses the stored ORGANIZATION config", async () => {
    mocks.get.mockResolvedValue({
      data: { type: "ORGANIZATION", config: JSON.stringify(valid) },
    });
    const result = await getBranding();
    expect(mocks.get).toHaveBeenCalledWith("ORGANIZATION");
    expect(result).toEqual({ success: true, data: valid });
  });

  it("maps 404 to no Brand", async () => {
    mocks.get.mockRejectedValue({ status: 404 });
    expect(await getBranding()).toEqual({ success: true, data: null });
  });

  it("returns null for an unusable stored document", async () => {
    mocks.get.mockResolvedValue({ data: { config: "{" } });
    expect(await getBranding()).toEqual({ success: true, data: null });
  });

  it("returns 403 without calling the SDK when the permission is missing", async () => {
    mocks.authorize.mockResolvedValue(false);
    expect(await getBranding()).toMatchObject({ success: false, status: 403 });
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("passes other API errors through with their status", async () => {
    mocks.get.mockRejectedValue({ status: 500 });
    expect(await getBranding()).toMatchObject({ success: false, status: 500 });
  });
});

describe("saveBranding", () => {
  it("posts the cleaned document, then invalidates, sets the cookie and revalidates", async () => {
    vi.spyOn(Date, "now").mockReturnValue(1_760_000_000_000);
    const result = await saveBranding(JSON.stringify({ ...valid, extra: 1 }));

    expect(result).toEqual({ success: true, data: undefined });
    expect(mocks.authorize).toHaveBeenCalledWith("igrp.applications.customize");
    expect(mocks.set).toHaveBeenCalledWith({
      type: "ORGANIZATION",
      config: JSON.stringify(valid),
    });
    expect(mocks.calls).toEqual(["post", "invalidate", "cookie", "revalidate"]);
    expect(mocks.invalidate).toHaveBeenCalledWith();
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "igrp_brand_v",
      "1760000000000",
      {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 300,
      },
    );
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout");
  });

  it.each([
    [
      "oversized input",
      JSON.stringify({ ...valid, pad: "x".repeat(65 * 1024) }),
    ],
    [
      "a color-mix value",
      JSON.stringify({
        ...valid,
        tokens: { light: { "--primary": "color-mix(in oklch, red, blue)" } },
      }),
    ],
    [
      "a non-OKLCH value",
      JSON.stringify({
        ...valid,
        tokens: { light: { "--primary": "#ff0000" } },
      }),
    ],
    [
      "a foreign logo host",
      JSON.stringify({
        ...valid,
        logos: { wide: { light: "https://evil.example/l.svg" } },
      }),
    ],
    [
      "a Token outside the catalog",
      JSON.stringify({
        ...valid,
        tokens: { light: { "--radius": "oklch(0.45 0.18 250)" } },
      }),
    ],
    ["invalid JSON", "{"],
  ])("rejects %s with 422 before calling the SDK", async (_, raw) => {
    expect(await saveBranding(raw)).toMatchObject({
      success: false,
      status: 422,
    });
    expect(mocks.set).not.toHaveBeenCalled();
    expect(mocks.calls).toEqual([]);
  });

  it("rejects unauthorized callers with 403 before calling the SDK", async () => {
    mocks.authorize.mockResolvedValue(false);
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({
      status: 403,
    });
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("rejects when the flag is off or auth is bypassed", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "false");
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({
      status: 404,
    });
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({
      status: 404,
    });
    expect(mocks.authorize).not.toHaveBeenCalled();
    expect(mocks.set).not.toHaveBeenCalled();
  });

  it("does not invalidate or set the cookie when the API fails", async () => {
    mocks.set.mockRejectedValue({ status: 403 });
    expect(await saveBranding(JSON.stringify(valid))).toMatchObject({
      success: false,
      status: 403,
    });
    expect(mocks.invalidate).not.toHaveBeenCalled();
    expect(mocks.cookieSet).not.toHaveBeenCalled();
  });
});
