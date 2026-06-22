import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  isAuthBypass,
  isAuthDisabled,
  isPreviewMode,
  sanitizeCallbackUrl,
} from "@/lib/utils";

const ENV = process.env;
beforeEach(() => {
  process.env = { ...ENV };
});
afterEach(() => {
  process.env = ENV;
});

describe("isPreviewMode / isAuthDisabled / isAuthBypass", () => {
  it("reads IGRP_PREVIEW_MODE tolerantly (quotes, case, whitespace)", () => {
    process.env.IGRP_PREVIEW_MODE = ' "TRUE" ';
    expect(isPreviewMode()).toBe(true);
  });

  it("treats AUTH_PROVIDER=none as auth disabled", () => {
    process.env.AUTH_PROVIDER = "none";
    expect(isAuthDisabled()).toBe(true);
  });

  it("isAuthBypass is true when either preview or provider=none", () => {
    process.env.IGRP_PREVIEW_MODE = "false";
    process.env.AUTH_PROVIDER = "keycloak";
    expect(isAuthBypass()).toBe(false);
    process.env.AUTH_PROVIDER = "none";
    expect(isAuthBypass()).toBe(true);
  });
});

describe("sanitizeCallbackUrl", () => {
  it("accepts a safe same-origin relative path", () => {
    expect(sanitizeCallbackUrl("/settings/users")).toBe("/settings/users");
  });

  it("rejects open-redirect and absolute targets", () => {
    expect(sanitizeCallbackUrl("//evil.com")).toBeUndefined();
    expect(sanitizeCallbackUrl("http://evil.com")).toBeUndefined();
    expect(sanitizeCallbackUrl("")).toBeUndefined();
    expect(sanitizeCallbackUrl(123)).toBeUndefined();
  });

  it("rejects loops back to the auth chrome", () => {
    expect(sanitizeCallbackUrl("/login")).toBeUndefined();
    expect(sanitizeCallbackUrl("/login/x")).toBeUndefined();
    expect(sanitizeCallbackUrl("/logout")).toBeUndefined();
  });

  it("normalizes basePath before the /login check", () => {
    expect(sanitizeCallbackUrl("/app/login", "/app")).toBeUndefined();
    expect(sanitizeCallbackUrl("/app/settings", "/app")).toBe("/app/settings");
  });
});
