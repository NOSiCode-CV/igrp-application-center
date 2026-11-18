import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createBrandingSchema } from "@/features/branding/branding-schemas";
import { toFormValues } from "@/features/branding/lib/branding-mapper";

const MINIO = "https://minio.example/igrp";
const t = (key: string) => key;

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_IGRP_MINIO_URL", MINIO));
afterEach(() => vi.unstubAllEnvs());

const issues = (values: unknown) => {
  const result = createBrandingSchema(t).safeParse(values);
  return result.success
    ? []
    : result.error.issues.map((i) => [i.path.join("."), i.message]);
};

describe("createBrandingSchema", () => {
  it("accepts the empty form", () => {
    expect(issues(toFormValues(null))).toEqual([]);
  });

  it("flags editor-invalid colours on their field", () => {
    const values = toFormValues(null);
    values.tokens.dark["--primary"] = "color-mix(in oklch, red, blue)";
    expect(issues(values)).toEqual([
      ["tokens.dark.--primary", "errors.invalidColor"],
    ]);
  });

  it("flags a hand-written stored Brand the editor would not save", () => {
    const values = toFormValues({
      version: 1,
      tokens: { light: { "--ring": "var(--primary)" } },
      logos: { wide: { light: "https://evil.example/logo.svg" } },
    });
    expect(issues(values)).toEqual(
      expect.arrayContaining([
        ["tokens.light.--ring", "errors.invalidColor"],
        ["logos.wide.light", "errors.logoHost"],
      ]),
    );
  });

  it("requires the light image when a dark one is set", () => {
    const values = toFormValues(null);
    values.logos.header.dark = `${MINIO}/public/d.png`;
    expect(issues(values)).toEqual([
      ["logos.header.light", "errors.darkWithoutLight"],
    ]);
  });

  it("rejects a header or wide pick that is not an image", () => {
    const values = toFormValues(null);
    values.logos.header.light = new File(["x"], "notes.txt", {
      type: "text/plain",
    });
    expect(issues(values)).toEqual([["logos.header.light", "errors.image"]]);
  });

  it("rejects a favicon that is not PNG/ICO or is over 256 KB", () => {
    const values = toFormValues(null);
    values.logos.favicon.light = new File(["<svg/>"], "f.svg", {
      type: "image/svg+xml",
    });
    values.logos.favicon.dark = new File(
      [new Uint8Array(300 * 1024)],
      "f.png",
      { type: "image/png" },
    );
    expect(issues(values)).toEqual([
      ["logos.favicon.light", "errors.favicon"],
      ["logos.favicon.dark", "errors.favicon"],
    ]);
  });
});
