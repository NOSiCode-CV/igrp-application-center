// Cross-site arrivals at /logout must confirm with a click (CSRF, finding F4);
// in-app arrivals and the onSessionExpired redirect still log out on load.
import type { ReactElement } from "react";

import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/__tests__/helpers/intl";

const headerGet = vi.fn();
const getAccessToken = vi.fn();
const isTokenExpiredOrFailed = vi.fn();
const serverSession = vi.fn();
const getLogoutUrl = vi.fn(() => new Promise<string | null>(() => {}));

vi.mock("next/headers", () => ({
  headers: async () => ({ get: headerGet }),
}));
vi.mock("@/lib/auth", () => ({
  auth: { getAccessToken, isTokenExpiredOrFailed },
  serverSession,
}));
vi.mock("@/actions/igrp/auth", () => ({
  getLogoutUrl,
  markHostLogout: vi.fn(async () => {}),
}));
vi.mock("@igrp/framework-next-auth/client", () => ({ signOut: vi.fn() }));
vi.mock("@igrp/framework-next-ui", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  IGRPTemplateLoading: ({ text }: { text: string }) => <p>{text}</p>,
}));

// Same logic as the framework's isTokenExpiredOrFailed (10s grace).
function frameworkIsTokenExpiredOrFailed(token: {
  expiresAt?: number;
  error?: string;
}) {
  const expired =
    token.expiresAt !== undefined && token.expiresAt <= Date.now() + 10_000;
  return expired || token.error === "RefreshAccessTokenError";
}

// Inside the onSessionExpired band: past middleware's 10s grace, inside the
// framework's 60s refresh buffer.
const inBand = () => Date.now() + 30_000;

beforeEach(() => {
  vi.resetModules(); // re-arms the module-scoped logoutStarted guard
  vi.useFakeTimers(); // keeps the flow's watchdog timers from firing
  vi.clearAllMocks();
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
  getAccessToken.mockResolvedValue({ expiresAt: Date.now() + 3_600_000 });
  isTokenExpiredOrFailed.mockImplementation(frameworkIsTokenExpiredOrFailed);
  serverSession.mockResolvedValue({ expiresAt: Date.now() + 3_600_000 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
});

async function needsConfirmFor(site: string | null): Promise<boolean> {
  headerGet.mockReturnValue(site);
  const { default: LogoutPage } = await import("@/app/(auth)/logout/page");
  const element = (await LogoutPage()) as ReactElement<{
    needsConfirm: boolean;
  }>;
  return element.props.needsConfirm;
}

describe("logout page CSRF gate", () => {
  it.each(["cross-site", "same-site"])(
    "asks to confirm a %s arrival",
    async (site) => {
      expect(await needsConfirmFor(site)).toBe(true);
    },
  );

  it.each(["same-origin", "none", null])(
    "runs a %s arrival on load",
    async (site) => {
      expect(await needsConfirmFor(site)).toBe(false);
    },
  );

  it("asks to confirm a cross-site arrival with no session", async () => {
    getAccessToken.mockResolvedValue(null);
    serverSession.mockResolvedValue(null);
    expect(await needsConfirmFor("cross-site")).toBe(true);
  });

  it("runs the onSessionExpired redirect on load (refresh failed, token in band)", async () => {
    getAccessToken.mockResolvedValue({ expiresAt: inBand() });
    serverSession.mockResolvedValue({ error: "RefreshAccessTokenError" });
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });

  it("runs it on load in Redis-store mode, where the hydrated token carries the error", async () => {
    getAccessToken.mockResolvedValue({
      expiresAt: inBand(),
      error: "RefreshAccessTokenError",
    });
    serverSession.mockResolvedValue({ error: "RefreshAccessTokenError" });
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });

  it("runs on load when the session expires inside the refresh buffer", async () => {
    getAccessToken.mockResolvedValue({ expiresAt: inBand() });
    serverSession.mockResolvedValue({ expiresAt: inBand() });
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });

  it("keeps a long-stale cookie gated even though its session is dead", async () => {
    getAccessToken.mockResolvedValue({
      expiresAt: Date.now() - 86_400_000,
      error: "RefreshAccessTokenError",
    });
    serverSession.mockResolvedValue({ error: "RefreshAccessTokenError" });
    expect(await needsConfirmFor("cross-site")).toBe(true);
  });

  it("keeps a token with no expiry gated", async () => {
    getAccessToken.mockResolvedValue({ sub: "u1" });
    serverSession.mockResolvedValue({ error: "RefreshAccessTokenError" });
    expect(await needsConfirmFor("cross-site")).toBe(true);
  });

  it("does not gate in auth-bypass mode", async () => {
    vi.stubEnv("IGRP_PREVIEW_MODE", "true");
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });
});

describe("LogoutFlow", () => {
  async function renderFlow(needsConfirm: boolean) {
    const { LogoutFlow } = await import("@/app/(auth)/logout/logout-flow");
    return renderWithIntl(<LogoutFlow needsConfirm={needsConfirm} />, {
      locale: "en",
    });
  }

  it("starts the logout on mount when no confirmation is needed", async () => {
    await renderFlow(false);
    expect(getLogoutUrl).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("waits for the click, starts once, and does not show the button again on remount", async () => {
    const { unmount } = await renderFlow(true);
    expect(getLogoutUrl).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(getLogoutUrl).toHaveBeenCalledTimes(1);

    unmount();
    await renderFlow(true);
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
    expect(getLogoutUrl).toHaveBeenCalledTimes(1);
  });
});
