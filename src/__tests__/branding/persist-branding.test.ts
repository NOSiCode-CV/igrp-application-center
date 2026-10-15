import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upload: vi.fn(),
  save: vi.fn(),
  calls: [] as string[],
}));
vi.mock("@/actions/file", () => ({ uploadPublicFile: mocks.upload }));
vi.mock("@/actions/global-configuration", () => ({ saveBranding: mocks.save }));

import { toFormValues } from "@/features/branding/lib/branding-mapper";
import { BrandingSaveError } from "@/features/branding/lib/branding-save-error";
import {
  brandingAssetUrl,
  persistBranding,
} from "@/features/branding/lib/persist-branding";

const MINIO = "https://minio.example/igrp";
const png = (name: string) => new File(["x"], name, { type: "image/png" });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.calls.length = 0;
  vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO);
  mocks.upload.mockImplementation(async (file: File) => {
    mocks.calls.push(`upload:${file.name}`);
    return { success: true, data: `public/branding/u/${file.name}` };
  });
  mocks.save.mockImplementation(async () => {
    mocks.calls.push("save");
    return { success: true, data: undefined };
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("brandingAssetUrl", () => {
  it.each([
    ["https://minio.example/igrp", "public/a.png"],
    ["https://minio.example/igrp/", "public/a.png"],
    ["https://minio.example/igrp", "/public/a.png"],
  ])("joins %j and %j keeping the bucket", (base, path) => {
    expect(brandingAssetUrl(path, base)).toBe(
      "https://minio.example/igrp/public/a.png",
    );
  });
});

describe("persistBranding", () => {
  it("uploads every picked file into 'branding', then saves URLs", async () => {
    const values = toFormValues(null);
    values.logos.header.light = png("mark.png");
    values.logos.wide = {
      light: png("wide.png"),
      dark: "",
      width: 320,
      height: 96,
    };
    values.tokens.light["--primary"] = "#ff0000";

    await persistBranding(values);

    expect(mocks.upload).toHaveBeenCalledTimes(2);
    expect(mocks.upload).toHaveBeenCalledWith(expect.any(File), {
      folder: "branding",
    });
    expect(mocks.calls.at(-1)).toBe("save");
    const doc = JSON.parse(mocks.save.mock.calls[0][0]);
    expect(doc.logos.header).toEqual({
      light: `${MINIO}/public/branding/u/mark.png`,
    });
    expect(doc.logos.wide).toEqual({
      light: `${MINIO}/public/branding/u/wide.png`,
      width: 320,
      height: 96,
    });
    expect(doc.tokens.light["--primary"]).toBe("oklch(0.628 0.2577 29.2339)");
  });

  it("aborts without saving when an upload fails, naming the slot", async () => {
    const values = toFormValues(null);
    values.logos.favicon.light = png("favicon.png");
    mocks.upload.mockResolvedValue({
      success: false,
      error: "boom",
      status: 500,
    });

    const error = await persistBranding(values).catch((e) => e);
    expect(error).toBeInstanceOf(BrandingSaveError);
    expect(error).toMatchObject({ reason: "upload", detail: "favicon" });
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it.each([
    [403, "forbidden", undefined],
    [422, "invalid", undefined],
    [500, "api", "Erro do servidor"],
  ])("maps a %i save failure to %j", async (status, reason, detail) => {
    mocks.save.mockResolvedValue({
      success: false,
      error: "Erro do servidor",
      status,
    });
    await expect(persistBranding(toFormValues(null))).rejects.toMatchObject({
      reason,
      detail,
    });
  });
});
