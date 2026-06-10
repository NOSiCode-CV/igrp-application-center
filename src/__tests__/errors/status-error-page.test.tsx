import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const back = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back, push }),
}));

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Button: ({
    children,
    onClick,
    ...rest
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  } & Record<string, unknown>) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
}));

import { StatusErrorPage } from "@/components/errors/status-error-page";

describe("StatusErrorPage", () => {
  it("renders the status number, default title and description for 403", () => {
    render(<StatusErrorPage status={403} />);
    expect(screen.getByText("403")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /acesso negado/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
  });

  it("shows the API message as secondary text below the default copy", () => {
    render(
      <StatusErrorPage
        status={403}
        message="O utilizador não tem o perfil X"
      />,
    );
    // Default copy is ALWAYS shown…
    expect(
      screen.getByText(/não tem permissões para ver este recurso/i),
    ).toBeInTheDocument();
    // …and the API message appears in addition.
    expect(
      screen.getByText(/o utilizador não tem o perfil x/i),
    ).toBeInTheDocument();
  });

  it("hides the API message when it is just the per-status default", () => {
    render(<StatusErrorPage status={403} message="Acesso negado" />);
    expect(screen.getAllByText(/acesso negado/i)).toHaveLength(1); // title only
  });

  it("renders fallback copy when the status is unknown", () => {
    render(<StatusErrorPage status={418} />);
    expect(screen.getByText("418")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("renders fallback copy without a number when status is missing", () => {
    render(<StatusErrorPage />);
    expect(
      screen.getByRole("heading", { name: /ocorreu um erro/i }),
    ).toBeInTheDocument();
  });

  it("navigates back and home", async () => {
    render(<StatusErrorPage status={500} />);
    await userEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(back).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: /início/i }));
    expect(push).toHaveBeenCalledWith("/");
  });
});
