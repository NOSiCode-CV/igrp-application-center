import { beforeEach, describe, expect, it, vi } from "vitest";

// Request cookies seen by the session callback.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    has: (name: string) => jar.has(name),
    get: (name: string) =>
      jar.has(name) ? { name, value: jar.get(name) } : undefined,
  }),
}));

import { HOST_LOGOUT_COOKIE } from "@igrp/framework-next-auth/cookies";

import { auth } from "@/lib/auth-instance";
import { LOGOUT_PENDING_COOKIE } from "@/lib/logout-pending";

const AUTH_TIME = 1_700_000_000;

// The full next-auth session callback: framework mapping, then the app's check.
// Runs for getServerSession() and for /api/auth/session alike.
async function readSession() {
  const callback = auth.authOptions.callbacks?.session;
  if (!callback) throw new Error("session callback not configured");
  return callback({
    session: { user: { name: "Ana" }, expires: "9999-01-01T00:00:00.000Z" },
    token: { sub: "u1", accessToken: "tok", authTime: AUTH_TIME },
  } as unknown as Parameters<typeof callback>[0]);
}

beforeEach(() => {
  jar.clear();
});

describe("session callback: logout termination", () => {
  it("keeps a session with no logout signal", async () => {
    expect(await readSession()).toMatchObject({ accessToken: "tok" });
  });

  it("keeps a session signed in after the host logout", async () => {
    jar.set(HOST_LOGOUT_COOKIE, String(AUTH_TIME - 1));
    expect(await readSession()).toMatchObject({ accessToken: "tok" });
  });

  it("reads a session that predates the host logout as no session", async () => {
    jar.set(HOST_LOGOUT_COOKIE, String(AUTH_TIME));
    expect(await readSession()).toEqual({});
  });

  it("reads a session with a pending logout as no session", async () => {
    jar.set(LOGOUT_PENDING_COOKIE, "1");
    expect(await readSession()).toEqual({});
  });
});
