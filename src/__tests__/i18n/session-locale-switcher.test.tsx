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

const ERROR_LABEL = "Não foi possível alterar o idioma. Tente novamente.";

beforeEach(() => {
  vi.clearAllMocks();
  // next-auth's update() resolves the new session, or null when it can't write it.
  update.mockImplementation(async ({ locale }: { locale: string }) => ({
    user: { locale },
  }));
});

describe("SessionLocaleSwitcher", () => {
  it("updates the session when the choice was persisted", async () => {
    setLocale.mockResolvedValue(changed(true));
    await chooseEnglish();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(setLocale).toHaveBeenCalledWith("en");
    expect(update).toHaveBeenCalledWith({ locale: "en" });
    expect(screen.getByRole("button", { name: "Idioma" })).toBeInTheDocument();
  });

  it.each([
    ["resolves null", () => update.mockResolvedValue(null)],
    [
      "keeps another locale",
      () => update.mockResolvedValue({ user: { locale: "pt" } }),
    ],
    ["rejects", () => update.mockRejectedValue(new Error("store down"))],
  ])("shows the error state when the session update %s", async (_, arrange) => {
    arrange();
    vi.spyOn(console, "error").mockImplementation(() => {});
    setLocale.mockResolvedValue(changed(true));
    await chooseEnglish();
    expect(
      await screen.findByRole("button", { name: ERROR_LABEL }),
    ).toBeInTheDocument();
    // The session kept the old locale: the framework rolls the profile back and skips the refresh.
    expect(setLocale).toHaveBeenLastCalledWith("pt");
    expect(refresh).not.toHaveBeenCalled();
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
    resolveUpdate({ user: { locale: "en" } });
    await waitFor(() => expect(refresh).toHaveBeenCalled());
  });

  it("leaves the session alone when nothing was persisted", async () => {
    setLocale.mockResolvedValue(changed(false));
    await chooseEnglish();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(update).not.toHaveBeenCalled();
  });
});
