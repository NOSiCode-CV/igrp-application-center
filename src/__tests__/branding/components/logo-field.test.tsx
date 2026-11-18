import { Form } from "@igrp/igrp-framework-react-design-system";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { LogoField } from "@/features/branding/components/logo-field";
import { toFormValues } from "@/features/branding/lib/branding-mapper";

import { renderWithIntl as render } from "../../helpers/intl";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // biome-ignore lint/performance/noImgElement: test stub for next/image
    <img src={src} alt={alt} />
  ),
}));

const sizeRead = vi.hoisted(() => ({
  resolve: (_: { width: number; height: number } | null) => {},
}));
vi.mock("@/features/branding/lib/image-size", () => ({
  readImageSize: () =>
    new Promise((r) => {
      sizeRead.resolve = r;
    }),
}));

const URL_A = "https://minio.example/igrp/public/branding/u/mark.png";

function Harness() {
  const values = toFormValues({
    version: 1,
    tokens: {},
    logos: { header: { light: URL_A } },
  });
  const form = useForm({ defaultValues: values });
  return (
    <Form {...form}>
      <LogoField slot="header" />
      <output data-testid="light">
        {String(form.watch("logos.header.light"))}
      </output>
      <output data-testid="dirty">{String(form.formState.isDirty)}</output>
      <button type="button" onClick={() => form.reset()}>
        reset
      </button>
    </Form>
  );
}

// jsdom has no object URLs.
beforeAll(() => {
  URL.createObjectURL = vi.fn(() => "blob:pick");
  URL.revokeObjectURL = vi.fn();
});

function WideHarness() {
  const form = useForm({
    defaultValues: toFormValues({
      version: 1,
      tokens: {},
      logos: { wide: { light: URL_A, width: 10, height: 20 } },
    }),
  });
  return (
    <Form {...form}>
      <LogoField slot="wide" />
      <output data-testid="light">
        {String(form.watch("logos.wide.light"))}
      </output>
      <output data-testid="size">{`${form.watch("logos.wide.width")}x${form.watch("logos.wide.height")}`}</output>
      <output data-testid="dirty">{String(form.formState.isDirty)}</output>
      <button type="button" onClick={() => form.reset()}>
        reset
      </button>
    </Form>
  );
}

describe("LogoField", () => {
  it("keeps the saved URL on mount (FileUploadField emits null)", () => {
    render(<Harness />);
    expect(screen.getByTestId("light")).toHaveTextContent(URL_A);
    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
    expect(screen.getByAltText("Imagem atual")).toHaveAttribute("src", URL_A);
  });

  it("drops a pick when the form resets (Descartar, Repor, after save)", async () => {
    const { container } = render(<Harness />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const pick = new File(["x"], "new.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [pick] } });
    await waitFor(() =>
      expect(screen.getByTestId("light")).toHaveTextContent("[object File]"),
    );

    fireEvent.click(screen.getByText("reset"));
    await waitFor(() =>
      expect(screen.getByTestId("light")).toHaveTextContent(URL_A),
    );
    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
  });

  it("removes the saved image on request", () => {
    render(<Harness />);
    fireEvent.click(screen.getAllByRole("button", { name: "Remover" })[0]);
    expect(screen.getByTestId("light")).toHaveTextContent("");
    expect(screen.getByTestId("dirty")).toHaveTextContent("true");
  });

  it("ignores a wide size read that finishes after a reset", async () => {
    const { container } = render(<WideHarness />);
    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(input, {
      target: { files: [new File(["x"], "w.png", { type: "image/png" })] },
    });
    await waitFor(() =>
      expect(screen.getByTestId("light")).toHaveTextContent("[object File]"),
    );
    fireEvent.click(screen.getByText("reset"));
    await waitFor(() =>
      expect(screen.getByTestId("light")).toHaveTextContent(URL_A),
    );
    sizeRead.resolve({ width: 99, height: 88 });
    await new Promise((r) => setTimeout(r, 20));
    expect(screen.getByTestId("size")).toHaveTextContent("10x20");
    expect(screen.getByTestId("dirty")).toHaveTextContent("false");
  });
});
