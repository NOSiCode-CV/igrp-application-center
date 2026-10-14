// Menu codes must match ^[A-Z0-9_]+$ (menu-schemas). They are generated from
// the name in Portuguese/French, so accents fold to their base letter.

import { describe, expect, it } from "vitest";

import {
  menuCodeFromName,
  sanitizeMenuCode,
} from "@/features/menus/menu-schemas";

describe("menuCodeFromName", () => {
  it("folds accents instead of dropping the letter", () => {
    expect(menuCodeFromName("Página Inicial")).toBe("PAGINA_INICIAL");
    expect(menuCodeFromName("Relatórios Ç")).toBe("RELATORIOS_C");
  });

  it("collapses any run of separators into one underscore", () => {
    expect(menuCodeFromName("my-menu  /  2")).toBe("MY_MENU_2");
  });

  it("trims leading and trailing separators", () => {
    expect(menuCodeFromName("  (Novo) menu! ")).toBe("NOVO_MENU");
  });

  it("returns an empty code for a name with no letters or digits", () => {
    expect(menuCodeFromName("  --  ")).toBe("");
  });
});

describe("sanitizeMenuCode", () => {
  it("uppercases and replaces invalid characters while typing", () => {
    expect(sanitizeMenuCode("menú-código")).toBe("MENU_CODIGO");
  });

  it("keeps a trailing underscore so the user can keep typing", () => {
    expect(sanitizeMenuCode("abc_")).toBe("ABC_");
  });
});
