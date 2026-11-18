import { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ChipInput } from "@/components/chip-input";

function Harness({ initial = [] as string[] }) {
  const [value, setValue] = useState(initial);
  return (
    <>
      <label htmlFor="c">URIs</label>
      <ChipInput id="c" value={value} onChange={setValue} />
      <output>{value.join("|")}</output>
    </>
  );
}

describe("ChipInput", () => {
  it("commits on Enter, trims and de-duplicates", async () => {
    render(<Harness initial={["openid"]} />);
    const input = screen.getByLabelText("URIs");
    await userEvent.type(input, "  email{Enter}openid{Enter}");
    expect(document.querySelector("output")?.textContent).toBe("openid|email");
    // The harness's own <output> element also carries an implicit role of
    // "status" in the accessibility tree, so scope to the live-region span
    // the component itself renders (getByRole would otherwise be ambiguous).
    const statuses = screen.getAllByRole("status");
    expect(statuses.some((el) => el.textContent === "email adicionado")).toBe(
      true,
    );
  });

  it("removes a chip with its button", async () => {
    render(<Harness initial={["openid", "email"]} />);
    await userEvent.click(
      screen.getByRole("button", { name: "Remover openid" }),
    );
    expect(document.querySelector("output")?.textContent).toBe("email");
  });

  it("removes the last chip on Backspace with an empty draft", async () => {
    render(<Harness initial={["openid", "email"]} />);
    await userEvent.type(screen.getByLabelText("URIs"), "{Backspace}");
    expect(document.querySelector("output")?.textContent).toBe("openid");
  });
});
