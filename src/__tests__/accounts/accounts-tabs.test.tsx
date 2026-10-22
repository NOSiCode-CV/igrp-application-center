import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/settings/accounts/clients" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";

import { renderWithIntl } from "../helpers/intl";

describe("AccountsTabs", () => {
  it("marks the clients tab current on a client route", () => {
    pathname.value = "/settings/accounts/clients/abc";
    renderWithIntl(<AccountsTabs />);
    expect(screen.getByRole("tab", { name: "Clientes OAuth" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("tab", { name: "Contas de Serviço" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks the services tab current on a services route", () => {
    pathname.value = "/settings/accounts/services";
    renderWithIntl(<AccountsTabs />);
    expect(
      screen.getByRole("tab", { name: "Contas de Serviço" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("renders the tabs in English", () => {
    pathname.value = "/settings/accounts/clients";
    renderWithIntl(<AccountsTabs />, { locale: "en" });
    expect(screen.getByRole("tab", { name: "OAuth clients" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Service accounts" })).toBeVisible();
  });
});
