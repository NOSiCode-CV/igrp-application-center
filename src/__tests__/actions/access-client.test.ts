// FE-5 (FR-9): every Access Management call carries Accept-Language = the
// resolved locale.

import { beforeEach, describe, expect, it, vi } from "vitest";

const serverSession = vi.fn();
const getLocale = vi.fn();
const create = vi.fn((config: unknown) => ({ config }));
const put = vi.fn();
const baseConfigs: unknown[] = [];

vi.mock("@/lib/auth", () => ({ serverSession: () => serverSession() }));
vi.mock("next-intl/server", () => ({ getLocale: () => getLocale() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));
vi.mock("@igrp/platform-access-management-client-ts", () => ({
  AccessManagementClient: { create: (config: unknown) => create(config) },
  BaseApiClient: class {
    constructor(config: unknown) {
      baseConfigs.push(config);
    }
    put(...args: unknown[]) {
      return put(...args);
    }
  },
}));

import {
  getClientAccess,
  updateCurrentUserLocale,
} from "@/actions/access-client";

beforeEach(() => {
  vi.clearAllMocks();
  baseConfigs.length = 0;
  serverSession.mockResolvedValue({ accessToken: "tok" });
  getLocale.mockResolvedValue("fr");
});

describe("getClientAccess", () => {
  it("sends Authorization and Accept-Language = resolved locale", async () => {
    await getClientAccess();
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { Authorization: "Bearer tok", "Accept-Language": "fr" },
        timeout: 10_000,
      }),
    );
  });

  it("follows the resolved locale per request", async () => {
    getLocale.mockResolvedValue("en");
    await getClientAccess({ timeout: 60_000 });
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({ "Accept-Language": "en" }),
        timeout: 60_000,
      }),
    );
  });

  it("redirects to /login without a session", async () => {
    serverSession.mockResolvedValue(null);
    await expect(getClientAccess()).rejects.toThrow("REDIRECT:/login");
  });
});

describe("updateCurrentUserLocale", () => {
  it("PUTs { locale } to /api/users/me/locale with the same headers", async () => {
    put.mockResolvedValue({ data: undefined, status: 204 });
    await updateCurrentUserLocale("pt");
    expect(put).toHaveBeenCalledWith("/api/users/me/locale", { locale: "pt" });
    expect(baseConfigs[0]).toEqual(
      expect.objectContaining({
        headers: { Authorization: "Bearer tok", "Accept-Language": "fr" },
      }),
    );
  });
});
