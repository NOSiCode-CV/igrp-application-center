import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BRANDING_GROUPS } from "@/features/branding/catalog";
import { BrandingScreen } from "@/features/branding/components/branding-screen";
import pt from "@/i18n/messages/pt.json";

import { renderWithIntl as render } from "../../helpers/intl";

const mocks = vi.hoisted(() => ({
  query: { isPending: false, isError: false, error: null, data: null },
  mutation: { mutateAsync: vi.fn(), isPending: false },
  refresh: vi.fn(),
}));
vi.mock("@/features/branding/use-branding", () => ({
  useBrandingConfig: () => mocks.query,
  useSaveBranding: () => mocks.mutation,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => {
    // biome-ignore lint/performance/noImgElement: test stub for next/image
    return <img src={src} alt={alt} />;
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  mocks.mutation.mutateAsync.mockResolvedValue(undefined);
});

const preview = () =>
  screen.getByRole("region", { name: pt.branding.preview.title });

describe("BrandingScreen", () => {
  it("renders every group from both catalogs", () => {
    render(<BrandingScreen />);
    for (const group of BRANDING_GROUPS) {
      expect(
        screen.getByText(pt.branding.groups[group.key]),
      ).toBeInTheDocument();
    }
  });

  it("switches only the preview panel to dark", () => {
    render(<BrandingScreen />);
    expect(preview()).not.toHaveClass("dark");
    fireEvent.click(
      screen.getByRole("switch", { name: pt.branding.modes.label }),
    );
    expect(preview()).toHaveClass("dark");
    expect(document.documentElement).not.toHaveClass("dark");
    expect(document.documentElement.getAttribute("style") ?? "").not.toContain(
      "--primary",
    );
  });

  it("previews a draft colour on the panel", () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), {
      target: { value: "#ff0000" },
    });
    expect(preview().style.getPropertyValue("--primary")).toBe("#ff0000");
  });

  it("blocks save on an invalid colour and shows the error", async () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), {
      target: { value: "color-mix(in oklch, red, blue)" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: pt.branding.actions.save }),
    );
    expect(
      await screen.findByText(pt.branding.errors.invalidColor),
    ).toBeInTheDocument();
    expect(mocks.mutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("switches to the Mode that holds the error", async () => {
    render(<BrandingScreen />);
    fireEvent.click(
      screen.getByRole("switch", { name: pt.branding.modes.label }),
    );
    fireEvent.change(screen.getByLabelText("Primária"), {
      target: { value: "transparent" },
    });
    fireEvent.click(
      screen.getByRole("switch", { name: pt.branding.modes.label }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: pt.branding.actions.save }),
    );
    await waitFor(() =>
      expect(
        screen.getByRole("switch", { name: pt.branding.modes.label }),
      ).toHaveAttribute("aria-checked", "true"),
    );
    expect(mocks.mutation.mutateAsync).not.toHaveBeenCalled();
  });

  it("saves valid edits and refreshes the page", async () => {
    render(<BrandingScreen />);
    fireEvent.change(screen.getByLabelText("Primária"), {
      target: { value: "#ff0000" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: pt.branding.actions.save }),
    );
    await waitFor(() =>
      expect(mocks.mutation.mutateAsync).toHaveBeenCalledTimes(1),
    );
    expect(
      mocks.mutation.mutateAsync.mock.calls[0][0].tokens.light["--primary"],
    ).toBe("#ff0000");
    await waitFor(() => expect(mocks.refresh).toHaveBeenCalled());
  });

  it("disables Guardar and Descartar until something changes", () => {
    render(<BrandingScreen />);
    expect(
      screen.getByRole("button", { name: pt.branding.actions.save }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: pt.branding.actions.discard }),
    ).toBeDisabled();
  });
});
