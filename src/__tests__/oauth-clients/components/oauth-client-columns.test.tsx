import type { ServiceAccountDTO } from "@igrp/platform-access-management-client-ts";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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

describe("OAuthClientRowActions", () => {
  it("disables delete with the reason when a service account is linked", async () => {
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
    const del = screen.getByRole("menuitem", { name: /Eliminar/ });
    expect(del).toHaveAttribute("aria-disabled", "true");
    expect(
      screen.getByText(
        "Remova primeiro a conta de serviço «Nightly Invoice ETL».",
      ),
    ).toBeInTheDocument();
  });

  it("offers delete when nothing is linked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    await userEvent.click(screen.getByRole("menuitem", { name: "Eliminar" }));
    expect(handlers.onDelete).toHaveBeenCalled();
  });

  it("fails safe when service accounts could not be checked", async () => {
    render(<OAuthClientRowActions row={base} {...handlers} deleteBlocked />);
    await userEvent.click(
      screen.getByRole("button", { name: "Ações para Nightly ETL" }),
    );
    expect(screen.getByRole("menuitem", { name: /Eliminar/ })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
    expect(
      screen.getByText(
        "Não foi possível verificar se existe uma conta de serviço.",
      ),
    ).toBeInTheDocument();
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
