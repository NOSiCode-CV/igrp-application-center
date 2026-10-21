// SessionLocaleSwitcher: a persisted change refreshes the next-auth session
// (token.locale → session.user.locale) BEFORE the framework refreshes the page,
// or the page would re-render with the old session locale.

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { update, refresh, setLocale } = vi.hoisted(() => ({
  update: vi.fn(),
  refresh: vi.fn(),
  setLocale: vi.fn(),
}));

vi.mock("next-auth/react", () => ({ useSession: () => ({ update }) }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/i18n/actions", () => ({ setLocale }));

import { SessionLocaleSwitcher } from "@/i18n/session-locale-switcher";

const chooseEnglish = async () => {
  const user = userEvent.setup();
  render(<SessionLocaleSwitcher />);
  await user.click(screen.getByRole("button"));
  await user.click(
    await screen.findByRole("menuitemradio", { name: "English" }),
  );
};

const changed = (persisted: boolean) => ({
  success: true,
  data: { locale: "en", persisted },
});

beforeEach(() => {
  vi.clearAllMocks();
  update.mockResolvedValue(null);
});

describe("SessionLocaleSwitcher", () => {
  it("updates the session when the choice was persisted", async () => {
    setLocale.mockResolvedValue(changed(true));
    await chooseEnglish();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(setLocale).toHaveBeenCalledWith("en");
    expect(update).toHaveBeenCalledWith({ locale: "en" });
  });

  it("refreshes only after the session update resolves", async () => {
    let resolveUpdate: (value: unknown) => void = () => {};
    update.mockReturnValue(
      new Promise((resolve) => {
        resolveUpdate = resolve;
      }),
    );
    setLocale.mockResolvedValue(changed(true));
    await chooseEnglish();
    await waitFor(() => expect(update).toHaveBeenCalled());
    expect(refresh).not.toHaveBeenCalled();
    resolveUpdate(null);
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("leaves the session alone when nothing was persisted", async () => {
    setLocale.mockResolvedValue(changed(false));
    await chooseEnglish();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(update).not.toHaveBeenCalled();
  });
});
