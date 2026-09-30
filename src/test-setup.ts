// The /vitest entry registers the matchers AND augments Vitest's Assertion
// interface. The bare entry only augments Jest's, leaving toBeInTheDocument &
// friends untyped under `tsc`.
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Next.js server-only guard — not meaningful in tests
vi.mock("server-only", () => ({}));

// next/navigation — prevent errors in component tests
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/settings/users",
}));

// jsdom has no ResizeObserver; Radix's Select (via react-use-size) needs one.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
