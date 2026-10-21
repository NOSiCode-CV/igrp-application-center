// FE-9 (FR-21): error boundaries show the API/public detail when available,
// otherwise generic `errors.*` messages in the current language.

import { screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));

// The framework boundaries own the copy (catalog titles, IGRP_* codes, cookie
// language); the app only contributes the public detail via resolveCopy.
// They read next/navigation, which the global test setup stubs partially.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

import AuthSegmentError from "@/app/(auth)/error";
import RootSegmentError from "@/app/error";
import GlobalError from "@/app/global-error";

import { renderWithIntl } from "../helpers/intl";

// The global setup wraps `render` in a provider; the global boundary must be
// proven without one, so this takes the unwrapped render.
const { render } = await vi.importActual<
  typeof import("@testing-library/react")
>("@testing-library/react");

const withDigest = (digest: string) =>
  Object.assign(new Error("redacted"), { digest });
const withCode = (code: string) => Object.assign(new Error("x"), { code });

afterEach(() => {
  // biome-ignore lint/suspicious/noDocumentCookie: test cleanup of the locale cookie
  document.cookie = "IGRP_LOCALE=; expires=Thu, 01 Jan 1970 00:00:00 GMT";
});

describe("root error boundary", () => {
  it("shows the public (API) detail carried by the digest", () => {
    renderWithIntl(
      <RootSegmentError
        error={withDigest("1-abc|Utilizador 42 não encontrado")}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByText("Utilizador 42 não encontrado"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Ocorreu um erro nesta secção." }),
    ).toBeInTheDocument();
  });

  it("shows the API detail of an HttpStatusError digest", () => {
    renderWithIntl(
      <RootSegmentError
        error={withDigest("HTTP_STATUS_404|User 42 not found")}
        reset={() => {}}
      />,
    );
    expect(screen.getByText("User 42 not found")).toBeInTheDocument();
  });

  it("falls back to the catalog copy without a detail", () => {
    renderWithIntl(
      <RootSegmentError error={withDigest("12345")} reset={() => {}} />,
    );
    expect(screen.getByText(/se o problema persistir/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/ID de referência:/)).toBeInTheDocument();
  });

  it("maps framework codes to their catalog copy", () => {
    renderWithIntl(
      <RootSegmentError
        error={withCode("IGRP_ACCESS_MANAGEMENT_CONFIG_MISSING")}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Gestão de acesso não configurada" }),
    ).toBeInTheDocument();
  });
});

describe("(auth) error boundary", () => {
  it("uses the auth copy for untyped errors", () => {
    renderWithIntl(
      <AuthSegmentError error={new Error("boom")} reset={() => {}} />,
    );
    expect(
      screen.getByRole("heading", {
        name: "Não foi possível concluir a autenticação.",
      }),
    ).toBeInTheDocument();
  });
});

describe("global error boundary (no providers)", () => {
  it("uses the IGRP_LOCALE cookie for <html lang> and its inline copy", () => {
    // biome-ignore lint/suspicious/noDocumentCookie: sets up the locale cookie
    document.cookie = "IGRP_LOCALE=en";
    // Rendering <html> inside a container is fine for this assertion.
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(<GlobalError error={withDigest("12345")} reset={() => {}} />);
    expect(
      screen.getByRole("heading", { name: "An unexpected error occurred." }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
    expect(document.querySelector("html[lang='en-GB']")).not.toBeNull();
  });

  it("shows the API detail when present", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <GlobalError
        error={withDigest("1-abc|Serviço indisponível: manutenção")}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByText("Serviço indisponível: manutenção"),
    ).toBeInTheDocument();
    expect(document.querySelector("html[lang='pt-CV']")).not.toBeNull();
  });
});
