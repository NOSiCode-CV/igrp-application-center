import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SettingsCard,
  type SettingsItem,
} from "@/features/settings/components/settings-card";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  IGRPIcon: () => null,
  Badge: ({ children, className }: React.HTMLAttributes<HTMLSpanElement>) => (
    <span className={className}>{children}</span>
  ),
  cn: (...args: unknown[]) =>
    args
      .flat()
      .filter((a) => typeof a === "string")
      .join(" "),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const activeItem: SettingsItem = {
  id: "gestao-de-aplicacoes",
  title: "Gestão de Aplicações",
  description: "Crie, edite e gerencie suas aplicações.",
  icon: "AppWindow",
  href: "/settings/applications",
};

const disabledItem: SettingsItem = {
  id: "customizacao",
  title: "Customização",
  description: "Personalize cores, fontes e imagens da interface.",
  icon: "Palette",
  href: "/settings/theme",
  status: "inativo",
};

describe("SettingsCard", () => {
  describe("active card", () => {
    it("renders as a link with the correct href", () => {
      render(<SettingsCard item={activeItem} />);
      const link = screen.getByRole("link", { name: /gestão de aplicações/i });
      expect(link).toHaveAttribute("href", "/settings/applications");
    });

    it("renders title and description", () => {
      render(<SettingsCard item={activeItem} />);
      expect(screen.getByText("Gestão de Aplicações")).toBeInTheDocument();
      expect(
        screen.getByText("Crie, edite e gerencie suas aplicações."),
      ).toBeInTheDocument();
    });

    it("does not render the Em breve badge", () => {
      render(<SettingsCard item={activeItem} />);
      expect(screen.queryByText("Em breve")).not.toBeInTheDocument();
    });
  });

  describe("disabled card", () => {
    // A card with no destination must not advertise itself as a link, and must
    // not take a tab stop only to swallow Enter and Space.
    it("is not exposed as a link", () => {
      render(<SettingsCard item={disabledItem} />);
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("is not keyboard-focusable", () => {
      render(<SettingsCard item={disabledItem} />);
      const card = screen.getByText("Customização").closest("div.relative");
      expect(card).not.toHaveAttribute("tabindex");
    });

    it("renders title and description", () => {
      render(<SettingsCard item={disabledItem} />);
      expect(screen.getByText("Customização")).toBeInTheDocument();
      expect(
        screen.getByText("Personalize cores, fontes e imagens da interface."),
      ).toBeInTheDocument();
    });

    it("announces its unavailable state as text, not colour alone", () => {
      render(<SettingsCard item={disabledItem} />);
      expect(screen.getByText("Em breve")).toBeInTheDocument();
    });
  });
});
