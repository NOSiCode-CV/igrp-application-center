import { describe, expect, it } from "vitest";

import {
  CreateApplicationSchema,
  UpdateApplicationSchema,
} from "@/features/applications/app-schemas";

const base = {
  name: "App de Teste",
  code: "APP_TESTE",
  type: "INTERNAL" as const,
  slug: "/apps/teste",
  status: "ACTIVE" as const,
  owner: "",
  description: "",
  picture: "",
  url: "",
};

function firstError(input: unknown, path: string) {
  const r = CreateApplicationSchema.safeParse(input);
  if (r.success) return null;
  return r.error.issues.find((i) => i.path.join(".") === path)?.message ?? null;
}

describe("mensagens de validação", () => {
  it("nome vazio vs curto vs longo", () => {
    expect(firstError({ ...base, name: "" }, "name")).toBe(
      "Nome é obrigatório",
    );
    expect(firstError({ ...base, name: "   " }, "name")).toBe(
      "Nome é obrigatório",
    );
    expect(firstError({ ...base, name: "A" }, "name")).toBe(
      "Nome deve ter pelo menos 2 caracteres",
    );
    expect(firstError({ ...base, name: "x".repeat(256) }, "name")).toBe(
      "Nome deve ter no máximo 255 caracteres",
    );
    expect(firstError({ ...base, name: undefined }, "name")).toBe(
      "Nome é obrigatório",
    );
  });

  it("código vazio vs curto vs caracteres inválidos", () => {
    expect(firstError({ ...base, code: "" }, "code")).toBe(
      "Código é obrigatório",
    );
    expect(firstError({ ...base, code: "A" }, "code")).toBe(
      "Código deve ter pelo menos 2 caracteres",
    );
    expect(firstError({ ...base, code: "app centro" }, "code")).toBe(
      "Use apenas maiúsculas, números, _ e - (ex.: APP_CENTER)",
    );
    expect(firstError({ ...base, code: "APP-CENTER_2" }, "code")).toBeNull();
  });

  it("slug obrigatório para INTERNAL", () => {
    expect(firstError({ ...base, slug: "" }, "slug")).toBe(
      "Slug é obrigatório (ex.: /apps/exemplo)",
    );
  });

  it("url obrigatório e completo para EXTERNAL", () => {
    const ext = { ...base, type: "EXTERNAL" as const, slug: "" };
    expect(firstError({ ...ext, url: "" }, "url")).toBe("URL é obrigatório");
    expect(firstError({ ...ext, url: "exemplo.com" }, "url")).toBe(
      "Indique um URL completo, com https:// (ex.: https://exemplo.com)",
    );
    expect(
      firstError({ ...ext, url: "https://exemplo.com" }, "url"),
    ).toBeNull();
  });

  it("descrição acima do limite da API", () => {
    expect(
      firstError({ ...base, description: "x".repeat(256) }, "description"),
    ).toBe("Descrição deve ter no máximo 255 caracteres");
  });

  it("tipo em falta", () => {
    const r = CreateApplicationSchema.safeParse({ ...base, type: undefined });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(JSON.stringify(r.error.issues)).toContain(
        "Selecione o tipo de aplicação",
      );
  });

  it("edição: slug obrigatório mantém a mesma mensagem", () => {
    const r = UpdateApplicationSchema.safeParse({ ...base, slug: "" });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(
        r.error.issues.find((i) => i.path.join(".") === "slug")?.message,
      ).toBe("Slug é obrigatório (ex.: /apps/exemplo)");
  });

  it("aceita o estado TEMPORARY devolvido pela API", () => {
    expect(
      CreateApplicationSchema.safeParse({ ...base, status: "TEMPORARY" })
        .success,
    ).toBe(true);
    expect(
      UpdateApplicationSchema.safeParse({ ...base, status: "TEMPORARY" })
        .success,
    ).toBe(true);
  });

  it("valores válidos passam e vêm com trim", () => {
    const r = CreateApplicationSchema.safeParse({ ...base, name: "  App  " });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.name).toBe("App");
  });
});
