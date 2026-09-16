import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Separator: () => null,
}));

// Stable identities: these feed `useMemo`/render paths that would otherwise
// see a new array every render.
const NONE: { code: string; name?: string }[] = [];
const ROLES = [
  { code: "ADMIN", name: "iGRP Superadmin" },
  { code: "VIEWER", name: "Viewer" },
];
const APPS = [{ code: "A" }, { code: "B" }] as never[];
const RECENT: { lastAccess?: string | null }[] = [];

const state = {
  activeRole: { roleCode: "ADMIN" } as { roleCode: string } | undefined,
  roles: ROLES,
  appsFailed: false,
  recentFailed: false,
};

vi.mock("@/features/users/use-users", () => ({
  useCurrentUser: () => ({ data: { name: "Fidel da Luz" } }),
  useCurrentUserActiveRole: () => ({ data: state.activeRole }),
  useGetCurrentUserRoles: () => ({ data: state.roles }),
  useCurrentUserDepartments: () => ({ data: NONE }),
  useCurrentUserApplications: () => ({
    data: APPS,
    isError: state.appsFailed,
  }),
  useGetCurrentUserRecentApplications: () => ({
    data: RECENT,
    isError: state.recentFailed,
  }),
}));

import { WelcomeBanner } from "@/features/workspace/components/home-apps/welcome-banner";

beforeEach(() => {
  state.activeRole = { roleCode: "ADMIN" };
  state.roles = ROLES;
  state.appsFailed = false;
  state.recentFailed = false;
});

describe("WelcomeBanner", () => {
  it("announces the active role instead of relying on colour", () => {
    render(<WelcomeBanner />);

    const badge = screen
      .getByText("iGRP Superadmin")
      .closest("span")?.parentElement;
    expect(badge).toHaveTextContent("(perfil ativo)");

    // The inactive role must not carry the marker.
    const other = screen.getByText("Viewer").closest("span")?.parentElement;
    expect(other).not.toHaveTextContent("(perfil ativo)");
  });

  it("does not use a mouse-only title attribute to convey state", () => {
    const { container } = render(<WelcomeBanner />);
    expect(container.querySelector("[title]")).toBeNull();
  });

  it("prints a count when the query succeeded", () => {
    render(<WelcomeBanner />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("does not claim zero when a query failed", () => {
    state.appsFailed = true;
    state.recentFailed = true;
    render(<WelcomeBanner />);

    // "0" would be a false statement about the user's access.
    expect(screen.queryByText("0")).not.toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(2);
  });
});
