import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The tab lives in the URL (so the view is linkable), which the global
// next/navigation stub cannot model — its replace() is a no-op and its
// searchParams are frozen empty. Drive a real query string here instead.
const searchParamsStore = { current: new URLSearchParams() };
const subscribers = new Set<() => void>();

vi.mock("next/navigation", () => ({
  usePathname: () => "/settings/users/u1",
  useSearchParams: () => {
    const React = require("react");
    return React.useSyncExternalStore(
      (cb: () => void) => {
        subscribers.add(cb);
        return () => subscribers.delete(cb);
      },
      () => searchParamsStore.current,
      () => searchParamsStore.current,
    );
  },
  useRouter: () => ({
    push: vi.fn(),
    replace: (url: string) => {
      searchParamsStore.current = new URLSearchParams(
        url.startsWith("?") ? url.slice(1) : url,
      );
      for (const cb of subscribers) cb();
    },
  }),
}));

import { IntlWrapper } from "../../helpers/intl";

vi.mock("@igrp/igrp-framework-react-design-system", async () => {
  const React = await import("react");
  const TabsContext = React.createContext<{
    value: string;
    setValue: (v: string) => void;
  }>({ value: "", setValue: () => {} });
  return {
    IGRPButton: ({
      children,
      onClick,
    }: {
      children?: React.ReactNode;
      onClick?: () => void;
    }) => (
      <button type="button" onClick={onClick}>
        {children}
      </button>
    ),
    Tabs: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (v: string) => void;
      children?: React.ReactNode;
    }) => (
      <TabsContext.Provider value={{ value, setValue: onValueChange }}>
        <div>{children}</div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: { children?: React.ReactNode }) => (
      <div role="tablist">{children}</div>
    ),
    TabsTrigger: ({
      value,
      children,
    }: {
      value: string;
      children?: React.ReactNode;
    }) => {
      const ctx = React.useContext(TabsContext);
      return (
        <button type="button" role="tab" onClick={() => ctx.setValue(value)}>
          {children}
        </button>
      );
    },
    TabsContent: ({
      value,
      children,
    }: {
      value: string;
      children?: React.ReactNode;
    }) => {
      const ctx = React.useContext(TabsContext);
      return ctx.value === value ? <div role="tabpanel">{children}</div> : null;
    },
  };
});

import { UserDetailsTabs } from "@/features/users/components/user-details-tabs";

vi.mock("@/features/users/components/user-role-list", () => ({
  default: () => <div data-testid="role-list" />,
}));
vi.mock("@/features/departments/components/dept-list-simple-container", () => ({
  DepartmentListSimple: () => <div data-testid="dept-list" />,
}));
vi.mock("@/features/users/components/user-applications", () => ({
  default: () => <div data-testid="apps" />,
}));
vi.mock("@/features/users/components/user-signature", () => ({
  default: () => <div data-testid="signature" />,
}));
vi.mock("@/features/users/components/user-audit-tab", () => ({
  UserAuditLogTab: () => <div data-testid="audit" />,
}));
vi.mock("@/features/users/components/user-metadata-panel", () => ({
  UserMetadataPanel: () => <div data-testid="metadata" />,
}));
vi.mock("@/features/users/components/user-sessions-tab", () => ({
  UserSessionsTab: () => <div data-testid="sessions" />,
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <IntlWrapper>{children}</IntlWrapper>
    </QueryClientProvider>
  );
}

describe("UserDetailsTabs lazy mounting", () => {
  // biome-ignore lint/suspicious/noExplicitAny: <any is not recommmend to use>
  const user = { id: "u1", username: "u1" } as any;

  beforeEach(() => {
    searchParamsStore.current = new URLSearchParams();
  });

  it("mounts only the active tab on initial render", () => {
    render(<UserDetailsTabs user={user} />, { wrapper });
    expect(screen.getByTestId("role-list")).toBeInTheDocument();
    expect(screen.queryByTestId("audit")).not.toBeInTheDocument();
    expect(screen.queryByTestId("metadata")).not.toBeInTheDocument();
  });

  it("mounts a tab when it is clicked", async () => {
    render(<UserDetailsTabs user={user} />, { wrapper });
    await userEvent.click(screen.getByRole("tab", { name: /auditoria/i }));
    expect(screen.getByTestId("audit")).toBeInTheDocument();
  });

  it("opens the tab named in the URL", () => {
    searchParamsStore.current = new URLSearchParams("tab=metadata");
    render(<UserDetailsTabs user={user} />, { wrapper });
    expect(screen.getByTestId("metadata")).toBeInTheDocument();
    expect(screen.queryByTestId("role-list")).not.toBeInTheDocument();
  });

  it("falls back to the first tab when the URL names an unknown tab", () => {
    searchParamsStore.current = new URLSearchParams("tab=nope");
    render(<UserDetailsTabs user={user} />, { wrapper });
    expect(screen.getByTestId("role-list")).toBeInTheDocument();
  });
});
