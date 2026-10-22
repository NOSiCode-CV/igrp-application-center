import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useServerErrorMessage } from "@/i18n/server-error";

import { IntlWrapper } from "../helpers/intl";

function translate(error?: string) {
  const { result } = renderHook(() => useServerErrorMessage(), {
    wrapper: ({ children }) => (
      <IntlWrapper locale="en">{children}</IntlWrapper>
    ),
  });
  return result.current(error);
}

describe("useServerErrorMessage", () => {
  it("replaces the server's pt fallbacks with the translated generic text", () => {
    for (const fallback of [
      "Erro desconhecido",
      "Servidor indisponível",
      "Erro interno do servidor",
    ]) {
      expect(translate(fallback)).toBe(
        "Something went wrong. Please try again.",
      );
    }
    expect(translate(undefined)).toBe(
      "Something went wrong. Please try again.",
    );
  });

  it("passes an API detail through unchanged", () => {
    expect(translate("Menu in use")).toBe("Menu in use");
  });
});
