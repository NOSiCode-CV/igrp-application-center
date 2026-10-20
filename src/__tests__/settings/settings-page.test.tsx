import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ granted: new Set<string>() }));

vi.mock("@igrp/framework-next", () => ({
  igrpAuthorize: async (name: string) => mocks.granted.has(name),
}));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/features/settings/components/settings-card", () => ({
  SettingsCard: ({ item }: { item: { href: string; status?: string } }) => (
    <div data-testid={item.href}>{item.status ?? "active"}</div>
  ),
}));

import SettingsPage from "@/app/(igrp)/(home)/settings/page";

const CUSTOMIZATION = "/settings/customization";
const renderPage = async () => render(await SettingsPage());

beforeEach(() => {
  mocks.granted = new Set();
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
});
afterEach(() => vi.unstubAllEnvs());

describe("settings hub — Customização card", () => {
  it("shows 'Em breve' when branding is off", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "false");
    await renderPage();
    expect(screen.getByTestId(CUSTOMIZATION)).toHaveTextContent("inativo");
  });

  it("is an active link for users with the customize permission", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    mocks.granted.add("igrp.applications.customize");
    await renderPage();
    expect(screen.getByTestId(CUSTOMIZATION)).toHaveTextContent("active");
  });

  it("is hidden from users without it", async () => {
    vi.stubEnv("IGRP_BRANDING_ENABLED", "true");
    await renderPage();
    expect(screen.queryByTestId(CUSTOMIZATION)).toBeNull();
  });
});
