// FE-9 (FR-21): error boundaries show the API/public detail when available,
// otherwise generic `errors.*` messages in the current language.

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/report-error", () => ({ reportError: vi.fn() }));

type Copy = { title: string; description: string };
type BoundaryProps = {
  error: Error;
  resolveCopy?: (error: Error) => Copy;
  resetLabel?: string;
  errorRefLabel?: string;
};

vi.mock("@igrp/framework-next-ui", () => {
  const Boundary = ({
    error,
    resolveCopy,
    resetLabel,
    errorRefLabel,
  }: BoundaryProps) => {
    const copy = resolveCopy?.(error);
    return (
      <div>
        <h1>{copy?.title}</h1>
        <p>{copy?.description}</p>
        <button type="button">{resetLabel}</button>
        <span>{errorRefLabel}</span>
      </div>
    );
  };
  return { IGRPSegmentError: Boundary, IGRPGlobalError: Boundary };
});

import AuthSegmentError from "@/app/(auth)/error";
import RootSegmentError from "@/app/error";
import GlobalError from "@/app/global-error";

import { renderWithIntl } from "../helpers/intl";

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
      screen.getByRole("heading", { name: "Ocorreu um erro inesperado." }),
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

  it("falls back to errors.unexpected without a detail", () => {
    renderWithIntl(
      <RootSegmentError error={withDigest("12345")} reset={() => {}} />,
    );
    expect(screen.getByText(/tente novamente\. se o problema/i)).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
    expect(screen.getByText("ID de referência:")).toBeInTheDocument();
  });

  it("maps framework codes to errors.codes.*", () => {
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
  it("uses errors.auth for untyped errors", () => {
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
    expect(document.querySelector("html[lang='en']")).not.toBeNull();
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
    expect(document.querySelector("html[lang='pt']")).not.toBeNull();
  });
});
