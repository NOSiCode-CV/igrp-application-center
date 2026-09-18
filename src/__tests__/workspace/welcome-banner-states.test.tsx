import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Renders as a <span>, like the real Badge, and keeps `className` so the
// colour assertions below have something to read.
vi.mock("@igrp/igrp-framework-react-design-system", () => ({
  Badge: ({
    children,
    className,
  }: {
    children?: React.ReactNode;
    className?: string;
  }) => <span className={className}>{children}</span>,
}));

// Stable identities: these feed `useMemo`/render paths that would otherwise
// see a new array every render.
const ROLES = [
  { code: "ADMIN", name: "iGRP Superadmin" },
  { code: "VIEWER", name: "Viewer" },
];
const DEPARTMENTS = [
  { code: "IGRP", name: "iGRP" },
  { code: "FDL", name: "Test App center FDL" },
];

const state = {
  activeRole: { roleCode: "ADMIN", departmentCode: "IGRP" } as
    | { roleCode: string; departmentCode?: string }
    | undefined,
  roles: ROLES,
  departments: DEPARTMENTS,
};

// Only four hooks now. `useCurrentUserApplications` and
// `useGetCurrentUserRecentApplications` fed the removed counters — if the
// banner ever reaches for them again the import will fail here, which is the
// point of mocking exactly what it uses.
vi.mock("@/features/users/use-users", () => ({
  useCurrentUser: () => ({ data: { name: "Fidel da Luz" } }),
  useCurrentUserActiveRole: () => ({ data: state.activeRole }),
  useGetCurrentUserRoles: () => ({ data: state.roles }),
  useCurrentUserDepartments: () => ({ data: state.departments }),
}));

import { WelcomeBanner } from "@/features/workspace/components/home-apps/welcome-banner";

beforeEach(() => {
  state.activeRole = { roleCode: "ADMIN", departmentCode: "IGRP" };
  state.roles = ROLES;
  state.departments = DEPARTMENTS;
});

describe("WelcomeBanner", () => {
  it("names the department the active role belongs to, not the first one", () => {
    render(<WelcomeBanner />);

    // "iGRP" is the department on the ACTIVE role; "Test App center FDL" is
    // another the user belongs to. Picking the first of the list would have
    // been an arbitrary choice presented as a fact.
    expect(screen.getByText("iGRP")).toBeInTheDocument();
    expect(screen.getByText("iGRP Superadmin")).toBeInTheDocument();
    expect(screen.queryByText("Test App center FDL")).not.toBeInTheDocument();
    // Only the active role is shown now, so the others must be absent.
    expect(screen.queryByText("Viewer")).not.toBeInTheDocument();
  });

  it("says which badge is which, rather than leaving it to colour", () => {
    render(<WelcomeBanner />);

    // The uppercase "PERFIS:" / "DEPARTAMENTOS:" labels are gone from view and
    // colour says nothing to a screen reader, so these carry the meaning.
    expect(screen.getByText("Departamento:")).toBeInTheDocument();
    expect(screen.getByText("Perfil ativo:")).toBeInTheDocument();

    // A badge separates itself, so the middle dot went with the plain line.
    expect(screen.queryByText("·")).not.toBeInTheDocument();
  });

  it("distinguishes the two badges by more than position", () => {
    render(<WelcomeBanner />);

    const department = screen.getByText("Departamento:").parentElement;
    const role = screen.getByText("Perfil ativo:").parentElement;

    // Neutral for context, brand blue for the consequential fact. Both are
    // `-subtle` pairs, which the CSS contract holds at AA in both themes.
    expect(department).toHaveClass("bg-muted", "text-secondary-foreground");
    expect(role).toHaveClass(
      "bg-primary-subtle",
      "text-primary-subtle-foreground",
    );
    expect(department?.className).not.toEqual(role?.className);
  });

  it("drops a part it cannot name rather than rendering an empty badge", () => {
    state.activeRole = { roleCode: "ADMIN" };
    render(<WelcomeBanner />);

    expect(screen.getByText("iGRP Superadmin")).toBeInTheDocument();
    expect(screen.queryByText("Departamento:")).not.toBeInTheDocument();
  });

  it("does not use a mouse-only title attribute to convey state", () => {
    const { container } = render(<WelcomeBanner />);
    expect(container.querySelector("[title]")).toBeNull();
  });

  it("carries no counters", () => {
    render(<WelcomeBanner />);

    // "N disponíveis para si" and "N abertas nos últimos 7 dias" were
    // removed along with the two queries that fed them. The catalogue below
    // owns the application list, its count, its error and its retry.
    expect(screen.queryByText(/dispon[íi]veis para si/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/últimos 7 dias/i)).not.toBeInTheDocument();
  });
});
