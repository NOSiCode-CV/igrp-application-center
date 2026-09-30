import { describe, expect, it } from "vitest";

import { auditForbiddenCopy } from "@/features/audit/lib/forbidden-copy";

describe("auditForbiddenCopy", () => {
  it("points a user with several Roles to their profile", () => {
    const copy = auditForbiddenCopy(3);
    expect(copy.homeHref).toBe("/profile");
    expect(copy.homeLabel).toBe("Ir para o meu perfil");
    expect(copy.description).toContain("perfil ativo");
    expect(copy.description).toContain("inicie sessão novamente");
  });

  it("keeps the generic 403 for a single Role or unknown roles", () => {
    expect(auditForbiddenCopy(1)).toEqual({});
    expect(auditForbiddenCopy(0)).toEqual({});
    expect(auditForbiddenCopy(null)).toEqual({});
  });
});
