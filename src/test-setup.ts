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

// The app always renders inside the root layout's NextIntlClientProvider, and
// shared components (InlineError, SearchInput, CopyToClipboard, …) translate
// their own text. Mirror that: every render/renderHook gets the module default
// (pt) messages, around any wrapper the test passes. `renderWithIntl` (helpers/
// intl.tsx) still picks another locale — the innermost provider wins.
vi.mock("@testing-library/react", async (importOriginal) => {
  const rtl = await importOriginal<typeof import("@testing-library/react")>();
  const { createElement } = await import("react");
  const { NextIntlClientProvider } = await import("next-intl");
  const { getMessagesFor } = await import("@/i18n/messages");
  const { getMessageFallback, onIntlError } = await import("@/i18n/fallback");
  const { PLATFORM_TIME_ZONE } = await import(
    "@/features/audit/lib/platform-time"
  );

  type Wrapper = React.JSXElementConstructor<{ children: React.ReactNode }>;
  const withIntl =
    (Inner?: Wrapper): Wrapper =>
    ({ children }) =>
      createElement(NextIntlClientProvider, {
        locale: "pt",
        messages: getMessagesFor("pt"),
        timeZone: PLATFORM_TIME_ZONE,
        onError: onIntlError,
        getMessageFallback,
        children: Inner ? createElement(Inner, null, children) : children,
      });

  const render = (
    ui: Parameters<typeof rtl.render>[0],
    options?: Parameters<typeof rtl.render>[1],
  ) =>
    rtl.render(ui, {
      ...options,
      wrapper: withIntl(options?.wrapper as Wrapper | undefined),
    });

  const renderHook = (
    hook: Parameters<typeof rtl.renderHook>[0],
    options?: Parameters<typeof rtl.renderHook>[1],
  ) =>
    rtl.renderHook(hook, {
      ...options,
      wrapper: withIntl(options?.wrapper as Wrapper | undefined),
    });

  return {
    ...rtl,
    render: render as typeof rtl.render,
    renderHook: renderHook as typeof rtl.renderHook,
  };
});

// jsdom has no ResizeObserver; Radix's Select (via react-use-size) needs one.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
