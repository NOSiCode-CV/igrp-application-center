import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

const toast = vi.fn();
vi.mock("@igrp/igrp-framework-react-design-system", async (orig) => ({
  ...(await orig<typeof import("@igrp/igrp-framework-react-design-system")>()),
  useIGRPToast: () => ({ igrpToast: toast }),
}));

import { SensitiveValueDisclosure } from "@/components/sensitive-value-disclosure";

describe("SensitiveValueDisclosure", () => {
  it("is masked by default and can be revealed", async () => {
    render(
      <SensitiveValueDisclosure
        label="Client secret"
        value="s3cret"
        onConfirmedChange={vi.fn()}
      />,
    );
    const input = screen.getByLabelText("Client secret");
    expect(input).toHaveAttribute("type", "password");
    await userEvent.click(screen.getByRole("button", { name: "Mostrar" }));
    expect(input).toHaveAttribute("type", "text");
    expect(screen.getByRole("button", { name: "Ocultar" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("copies the raw value even while masked", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText");
    render(
      <SensitiveValueDisclosure
        label="Client secret"
        value="s3cret"
        onConfirmedChange={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(writeText).toHaveBeenCalledWith("s3cret");
    expect(toast).toHaveBeenCalled();
  });

  it("reports the confirmation checkbox", async () => {
    const onConfirmedChange = vi.fn();
    render(
      <SensitiveValueDisclosure
        label="Client secret"
        value="s3cret"
        onConfirmedChange={onConfirmedChange}
      />,
    );
    await userEvent.click(
      screen.getByRole("checkbox", {
        name: "Guardei o segredo num local seguro",
      }),
    );
    expect(onConfirmedChange).toHaveBeenLastCalledWith(true);
  });
});
