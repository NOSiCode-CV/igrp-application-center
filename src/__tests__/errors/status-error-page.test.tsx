import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  IGRPButton: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
}));

import { StatusErrorPage } from "@/components/errors/status-error-page";
import { deepMerge } from "@/i18n/messages";
import pt from "@/i18n/messages/pt.json";

import { renderWithIntl } from "../helpers/intl";

describe("StatusErrorPage", () => {
  it("renders the status number, default title and description for 403", () => {
    renderWithIntl(<StatusErrorPage status={403} />);
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /acesso negado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
  });

  // FE-9 (FR-21): the API detail is shown as-is in place of the generic text.
  it("shows the API detail instead of the generic description", () => {
    renderWithIntl(
      <StatusErrorPage
        status={403}
        message="O utilizador não tem o perfil X"
      />,
    );
    expect(
      screen.getByText(/o utilizador não tem o perfil x/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/não tem permissões para ver este recurso/i),
    ).not.toBeInTheDocument();
  });

  it("ignores client-side generic fallbacks that are not API messages", () => {
    renderWithIntl(<StatusErrorPage status={403} message="Acesso negado" />);
    expect(screen.getAllByText(/acesso negado/i)).toHaveLength(1); // title only
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
  });

  it("renders fallback copy when the status is unknown", () => {
    renderWithIntl(<StatusErrorPage status={418} />);
    expect(screen.getByText("418")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("renders fallback copy without a number when status is missing", () => {
    renderWithIntl(<StatusErrorPage />);
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("uses the requested language when translated, pt otherwise", () => {
    renderWithIntl(<StatusErrorPage status={404} />, {
      locale: "en",
      // Only the title is translated here; the rest falls back per key to pt.
      messages: deepMerge(pt, {
        errors: { status: { notFound: { title: "Page not found" } } },
      }),
    });
    expect(
      screen.getByRole("heading", { name: "Page not found" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/a página que procura não existe/i),
    ).toBeInTheDocument();
  });

  it("navigates back and home", async () => {
    renderWithIntl(<StatusErrorPage status={500} />);
    await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(back).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: /início/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
