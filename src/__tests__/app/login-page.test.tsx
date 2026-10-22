// The login copy comes from the `login` catalog namespace, so an en visitor
// sees English on the form and the carousel instead of the old pt literals.
import { igrpMergeMessages } from "@igrp/framework-next/i18n/messages";
import { render, screen } from "@testing-library/react";
import { createTranslator } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/i18n/messages/en.json";
import fr from "@/i18n/messages/fr.json";
import pt from "@/i18n/messages/pt.json";

vi.mock("next/headers", () => ({
  cookies: async () => ({ has: () => false, get: () => undefined }),
}));
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

beforeEach(() => {
  vi.stubEnv("IGRP_PREVIEW_MODE", "false");
  vi.stubEnv("AUTH_PROVIDER", "igrp-auth");
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
      "Streamlined workflow | Boost your productivity with our intuitive interface and powerful tools.",
      "Secure by design | Your data is protected with enterprise-grade security and encryption.",
      "Collaborative platform | Work together seamlessly with your team in real time.",
    ]);
  });
});
