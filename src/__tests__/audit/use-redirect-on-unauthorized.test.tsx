import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
const ROUTER = { replace };
vi.mock("next/navigation", () => ({
  useRouter: () => ROUTER,
  useSearchParams: () => new URLSearchParams(),
}));

import { useRedirectOnUnauthorized } from "@/features/audit/use-audit";
import { HttpStatusError } from "@/lib/errors";

beforeEach(() => vi.clearAllMocks());

describe("useRedirectOnUnauthorized", () => {
  it("sends a dead session to /logout", () => {
    renderHook(() =>
      useRedirectOnUnauthorized(new HttpStatusError(401, "session_expired")),
    );
    expect(replace).toHaveBeenCalledWith("/logout");
  });

  it("ignores other failures", () => {
    renderHook(() => useRedirectOnUnauthorized(new HttpStatusError(403)));
    renderHook(() => useRedirectOnUnauthorized(null));
    expect(replace).not.toHaveBeenCalled();
  });
});
