import { Form } from "@igrp/igrp-framework-react-design-system";
import { fireEvent, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { ColorField } from "@/features/branding/components/color-field";

import { renderWithIntl as render } from "../../helpers/intl";

function Harness({ initial = "" }: { initial?: string }) {
  const form = useForm({
    defaultValues: { tokens: { light: { "--primary": initial }, dark: {} } },
  });
  return (
    <Form {...form}>
      <ColorField
        name="tokens.light.--primary"
        label="Primária"
        defaultValue="oklch(0.208 0.042 265.755)"
      />
      <output data-testid="value">
        {form.watch("tokens.light.--primary")}
      </output>
    </Form>
  );
}

describe("ColorField", () => {
  it("shows the Default as placeholder and as the swatch when empty", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Primária");
    expect(input).toHaveAttribute("placeholder", "oklch(0.208 0.042 265.755)");
    expect(
      screen.getByRole("button", { name: /Repor a predefinição/ }),
    ).toBeDisabled();
  });

  it("writes hex from the native colour input", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText(/Escolher a cor/), {
      target: { value: "#ff0000" },
    });
    expect(screen.getByTestId("value")).toHaveTextContent("#ff0000");
  });

  it("clears back to the Default", () => {
    render(<Harness initial="#ff0000" />);
    fireEvent.click(
      screen.getByRole("button", { name: /Repor a predefinição/ }),
    );
    expect(screen.getByTestId("value")).toHaveTextContent("");
  });
});
