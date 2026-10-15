import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OAuthClientRowActions } from "@/features/oauth-clients/components/oauth-client-columns";

const base = {
  id: "u1",
  clientId: "etl-runner-m2m",
  clientName: "Nightly ETL",
  active: true,
  accessTokenTtl: 1,
  refreshTokenTtl: 1,
  authorizationCodeTtl: 1,
  scopes: [],
  redirectUris: [],
  grantTypes: ["client_credentials"],
};
const handlers = {
  onToggleActive: vi.fn(),
  onDelete: vi.fn(),
  onCopy: vi.fn(),
};

beforeEach(() => vi.clearAllMocks());

describe("OAuthClientRowActions", () => {
  it("hides delete when a service account is linked", async () => {
    const linked = {
      id: "sa1",
      name: "Nightly Invoice ETL",
    } as ServiceAccountDTO;
    render(
      <OAuthClientRowActions
        row={{ ...base, linkedAccount: linked }}
        {...handlers}
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: /Eliminar/ }),
    ).not.toBeInTheDocument();
  });

  it("hides delete while service accounts could not be checked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} linkUnknown />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    expect(
      screen.queryByRole("menuitem", { name: /Eliminar/ }),
    ).not.toBeInTheDocument();
  });

  it("offers delete when nothing is linked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(handlers.onDelete).toHaveBeenCalled();
  });

  it("blocks activation while the link state is unknown", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} linkUnknown />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    const toggle = screen.getByRole("menuitem", { name: /Desativar/ });
    expect(toggle).toHaveAttribute("aria-disabled", "true");
    expect(toggle).toHaveTextContent(
      "Não foi possível verificar se existe uma conta de serviço.",
    );
    await userEvent.click(toggle);
    expect(handlers.onToggleActive).not.toHaveBeenCalled();
  });

  it("keeps blocked items reachable by keyboard so the reason is announced", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} linkUnknown />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    const toggle = screen.getByRole("menuitem", { name: /Desativar/ });
    // Radix skips `disabled` items in roving focus; aria-disabled keeps it in.
    expect(toggle).not.toHaveAttribute("data-disabled");
    await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(toggle).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(handlers.onToggleActive).not.toHaveBeenCalled();
  });

  it("offers Ativar on an inactive client", async () => {
    render(
      <OAuthClientRowActions row={{ ...base, active: false }} {...handlers} />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    expect(
      screen.getByRole("menuitem", { name: "Ativar" }),
    ).toBeInTheDocument();
  });
});
