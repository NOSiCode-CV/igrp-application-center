// The login copy comes from the `login` catalog namespace, so an en visitor
// sees English on the form and the carousel instead of the old pt literals.
import type { ReactElement } from "react";

import { igrpMergeMessages } from "@igrp/framework-next/i18n/messages";
import { fireEvent, render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { renderWithIntl } from "@/__tests__/helpers/intl";
import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

const { headerGet, getAccessToken, isEndedByHostLogout, signOut } = vi.hoisted(
  () => ({
    headerGet: vi.fn(),
    getAccessToken: vi.fn(),
    isEndedByHostLogout: vi.fn(),
    signOut: vi.fn(() => new Promise<never>(() => {})),
  }),
);

vi.mock("next/headers", () => ({
  cookies: async () => ({ has: () => false, get: () => undefined }),
  headers: async () => ({ get: headerGet }),
}));
vi.mock("@/lib/auth", () => ({
  auth: { getAccessToken, isEndedByHostLogout },
}));
vi.mock("@igrp/framework-next-auth/client", () => ({ signOut }));
vi.mock("next-intl/server", () => ({
  getTranslations: async (namespace: string) =>
    createTranslator({
      locale: "en",
      messages: igrpMergeMessages({ defaultLocale: "pt" }, "en", {
        pt,
        en,
        fr,
      }) as typeof pt,
      namespace: namespace as "login",
    }),
}));
vi.mock("@/lib/silent-sso", () => ({
  SILENT_SSO_COOKIE: "silent-sso",
  shouldAttemptSilentSso: () => false,
  silentSsoCallbackUrl: () => undefined,
}));
vi.mock("@/i18n/actions", () => ({ setLocale: vi.fn() }));
vi.mock("@igrp/framework-next/i18n/client", () => ({
  IGRPLocaleSwitcher: () => null,
}));
vi.mock("@igrp/framework-next-ui", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  IGRPTemplateLoading: ({ text }: { text: string }) => <p>{text}</p>,
  IGRPAuthCarousel: ({
    carouselItems,
  }: {
    carouselItems: { title: string; description: string }[];
  }) => (
    <ul>
      {carouselItems.map((item) => (
        <li key={item.title}>
          {item.title} | {item.description}
        </li>
      ))}
    </ul>
  ),
  IGRPAuthForm: ({
    texts,
  }: {
    texts: { welcome: string; description: string; copyright: string };
  }) => (
    <div>
      <h1>{texts.welcome}</h1>
      <p>{texts.description}</p>
      <p>{texts.copyright}</p>
    </div>
  ),
}));

import AuthPage from "@/app/(auth)/login/page";
import { SessionEndedCompletion } from "@/app/(auth)/login/session-ended-completion";

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
  vi.clearAllMocks();
  getAccessToken.mockResolvedValue({ authTime: 1 });
  isEndedByHostLogout.mockReturnValue(false);
});
afterEach(() => vi.unstubAllEnvs());

describe("login page in English", () => {
  it("renders the form and carousel texts from the catalog", async () => {
    render(await AuthPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByRole("heading", { name: "Welcome to IGRP" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter your credentials to sign in."),
    ).toBeInTheDocument();
    expect(screen.getByText("Developed by")).toBeInTheDocument();
    expect(
      screen.getAllByRole("listitem").map((item) => item.textContent),
    ).toEqual([
      "Applications in one place | Open the applications your role gives you access to from the home page.",
      "Access by role | What you can open and change depends on your active role and department.",
      "Departments and roles | Administrators group users by department and give each role its own menus and permissions.",
    ]);
  });
});

// reason=session_ended signs out on load, so cross-site arrivals must confirm
// with a click (CSRF, finding F3), unless the session is already ended.
describe("login page session_ended CSRF gate", () => {
  async function needsConfirmFor(site: string | null): Promise<boolean> {
    headerGet.mockReturnValue(site);
    const element = (await AuthPage({
      searchParams: Promise.resolve({ reason: "session_ended" }),
    })) as ReactElement<{ needsConfirm: boolean }>;
    return element.props.needsConfirm;
  }

  it.each(["cross-site", "same-site"])(
    "asks to confirm a %s arrival with a live session",
    async (site) => {
      expect(await needsConfirmFor(site)).toBe(true);
    },
  );

  it.each(["same-origin", "none", null])(
    "signs out a %s arrival on load",
    async (site) => {
      expect(await needsConfirmFor(site)).toBe(false);
    },
  );

  it("signs out on load when a host logout already ended the session", async () => {
    isEndedByHostLogout.mockReturnValue(true);
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });

  it("signs out on load when there is no session", async () => {
    getAccessToken.mockResolvedValue(null);
    expect(await needsConfirmFor("cross-site")).toBe(false);
  });

  it("asks to confirm when the session cannot be read", async () => {
    getAccessToken.mockRejectedValue(new Error("boom"));
    expect(await needsConfirmFor("cross-site")).toBe(true);
  });
});

describe("SessionEndedCompletion", () => {
  it("signs out on mount when no confirmation is needed", () => {
    renderWithIntl(<SessionEndedCompletion needsConfirm={false} />, {
      locale: "en",
    });
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Sign out" })).toBeNull();
  });

  it("waits for the click before signing out", () => {
    renderWithIntl(<SessionEndedCompletion needsConfirm />, { locale: "en" });
    expect(signOut).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
