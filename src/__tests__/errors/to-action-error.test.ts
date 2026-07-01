import { describe, expect, it } from "vitest";

import { isDefaultApiErrorMessage, toActionError } from "@/lib/app-utilities";

describe("toActionError", () => {
  it("extracts message and numeric status from an SDK-shaped error", () => {
    const result = toActionError({
      status: 403,
      details: JSON.stringify({ details: "Sem permissão para listar" }),
    });
    expect(result).toEqual({
      error: "Sem permissão para listar",
      status: 403,
    });
  });

  it("falls back to the default message but keeps the status", () => {
    const result = toActionError({ status: 401 });
    expect(result).toEqual({ error: "Não autorizado", status: 401 });
  });

  it("handles null and undefined gracefully", () => {
    expect(toActionError(null)).toEqual({
      error: "Erro desconhecido",
      status: undefined,
    });
    expect(toActionError(undefined)).toEqual({
      error: "Erro desconhecido",
      status: undefined,
    });
  });

  it("returns undefined status when the error has none", () => {
    const result = toActionError(new Error("network down"));
    expect(result).toEqual({ error: "network down", status: undefined });
  });

  it("ignores non-numeric status values", () => {
    const result = toActionError({ status: "oops", message: "x" });
    expect(result.status).toBeUndefined();
  });
});

describe("isDefaultApiErrorMessage", () => {
  it("recognises the per-status default strings", () => {
    expect(isDefaultApiErrorMessage("Não autorizado")).toBe(true);
    expect(isDefaultApiErrorMessage("Acesso negado")).toBe(true);
    expect(isDefaultApiErrorMessage("Erro na operação")).toBe(true);
    expect(isDefaultApiErrorMessage("Erro desconhecido")).toBe(true);
  });

  it("rejects real API messages", () => {
    expect(isDefaultApiErrorMessage("O utilizador não tem o perfil X")).toBe(
      false,
    );
    expect(isDefaultApiErrorMessage("")).toBe(false);
  });
});
