import { describe, expect, it } from "vitest";

import {
  checkSavableBranding,
  isFaviconFile,
  isNormalizedOklch,
  isOnMinioHost,
} from "@/features/branding/lib/branding-rules";

const MINIO = "https://minio.example/igrp";
const NAMES = ["--primary", "--ring"];
const doc = (over: Record<string, unknown> = {}) =>
  JSON.stringify({
    version: 1,
    tokens: { light: { "--primary": "oklch(0.45 0.18 250)" }, dark: {} },
    logos: {
      header: {
        light: "https://minio.example/igrp/public/branding/a/mark.png",
      },
    },
    ...over,
  });

describe("isOnMinioHost", () => {
  it("accepts URLs on the MinIO origin", () => {
    expect(isOnMinioHost(`${MINIO}/public/x.png`, MINIO)).toBe(true);
  });
  it.each([
    "https://evil.example/igrp/x.png",
    "http://minio.example/igrp/x.png",
    "https://minio.example:8443/igrp/x.png",
    "not a url",
  ])("rejects %j", (url) => {
    expect(isOnMinioHost(url, MINIO)).toBe(false);
  });
  it("rejects everything when the MinIO URL is unset", () => {
    expect(isOnMinioHost(`${MINIO}/x.png`, "")).toBe(false);
  });
});

describe("isFaviconFile", () => {
  const file = (type: string, size: number, name = "f") =>
    new File([new Uint8Array(size)], name, { type });
  it("accepts PNG and ICO up to 256 KB", () => {
    expect(isFaviconFile(file("image/png", 256 * 1024))).toBe(true);
    expect(isFaviconFile(file("image/x-icon", 10))).toBe(true);
    expect(isFaviconFile(file("image/vnd.microsoft.icon", 10))).toBe(true);
    expect(isFaviconFile(file("", 10, "favicon.ico"))).toBe(true);
  });
  it("rejects other types and larger files", () => {
    expect(isFaviconFile(file("image/svg+xml", 10))).toBe(false);
    expect(isFaviconFile(file("image/png", 256 * 1024 + 1))).toBe(false);
    expect(isFaviconFile(file("text/plain", 10, "favicon.ico"))).toBe(false);
  });
});

describe("isNormalizedOklch", () => {
  it.each(["oklch(0.45 0.18 250)", "oklch(1 0 0)", "oklch(0 0 0 / 0.5)"])(
    "accepts %j",
    (v) => expect(isNormalizedOklch(v)).toBe(true),
  );
  it.each(["#fff", "rgb(0 0 0)", "oklch(0.4 0.1 250) ", "oklch(50% 0.1 250)"])(
    "rejects %j",
    (v) => expect(isNormalizedOklch(v)).toBe(false),
  );
});

describe("checkSavableBranding", () => {
  it("returns the cleaned document for a valid input", () => {
    expect(checkSavableBranding(doc(), MINIO, NAMES)?.tokens.light).toEqual({
      "--primary": "oklch(0.45 0.18 250)",
    });
  });
  it("rejects documents over 64 KB", () => {
    expect(
      checkSavableBranding(doc({ pad: "x".repeat(65 * 1024) }), MINIO, NAMES),
    ).toBeNull();
  });
  it("rejects unparseable JSON and wrong versions", () => {
    expect(checkSavableBranding("{", MINIO, NAMES)).toBeNull();
    expect(checkSavableBranding(doc({ version: 2 }), MINIO, NAMES)).toBeNull();
  });
  it("rejects colours the editor would not have saved", () => {
    const tokens = { light: { "--primary": "color-mix(in oklch, red, blue)" } };
    expect(checkSavableBranding(doc({ tokens }), MINIO, NAMES)).toBeNull();
    const hex = { light: { "--primary": "#ff0000" } };
    expect(checkSavableBranding(doc({ tokens: hex }), MINIO, NAMES)).toBeNull();
  });
  it("rejects a document with any field the framework drops", () => {
    const tokens = { light: { "--Primary": "oklch(0.45 0.18 250)" } };
    expect(checkSavableBranding(doc({ tokens }), MINIO, NAMES)).toBeNull();
  });
  it("rejects Token names outside the catalog", () => {
    const tokens = { light: { "--radius": "oklch(0.45 0.18 250)" } };
    expect(checkSavableBranding(doc({ tokens }), MINIO, NAMES)).toBeNull();
  });
  it("rejects logos on a foreign host", () => {
    const logos = { wide: { light: "https://evil.example/logo.svg" } };
    expect(checkSavableBranding(doc({ logos }), MINIO, NAMES)).toBeNull();
  });
  it("drops unknown top-level keys from the returned document", () => {
    expect(
      checkSavableBranding(doc({ extra: 1 }), MINIO, NAMES),
    ).not.toHaveProperty("extra");
  });
});
