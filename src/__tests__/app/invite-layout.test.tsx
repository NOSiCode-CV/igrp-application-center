// Invite visitors have a session (the route is not public), so the layout
// must use the switcher that also refreshes the session token.
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/session-locale-switcher", () => ({
  SessionLocaleSwitcher: () => <div data-testid="session-switcher" />,
}));
vi.mock("@/features/branding/components/invite-brand-logo", () => ({
  InviteBrandLogo: () => null,
}));
vi.mock("@/providers/query-provider", () => ({
  IGRPQueryProvider: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@igrp/framework-next-ui", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  IGRPTemplateModeSwitcher: () => null,
}));
vi.mock("@igrp/igrp-framework-react-design-system", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  Toaster: () => null,
}));

import InviteLayout from "@/app/(invite)/layout";

describe("InviteLayout", () => {
  it("uses the session-aware locale switcher", () => {
    render(<InviteLayout>content</InviteLayout>);
    expect(screen.getByTestId("session-switcher")).toBeTruthy();
  });
});
