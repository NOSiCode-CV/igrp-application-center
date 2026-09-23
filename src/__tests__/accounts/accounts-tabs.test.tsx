import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const pathname = vi.hoisted(() => ({ value: "/settings/accounts/clients" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

import { AccountsTabs } from "@/features/accounts/components/accounts-tabs";

describe("AccountsTabs", () => {
  it("marks the clients tab current on a client route", () => {
    pathname.value = "/settings/accounts/clients/abc";
    render(<AccountsTabs />);
    expect(
      screen.getByRole("link", { name: "Clientes OAuth" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("link", { name: "Contas de Serviço" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("marks the services tab current on a services route", () => {
    pathname.value = "/settings/accounts/services";
    render(<AccountsTabs />);
    expect(
      screen.getByRole("link", { name: "Contas de Serviço" }),
    ).toHaveAttribute("aria-current", "page");
  });
});
