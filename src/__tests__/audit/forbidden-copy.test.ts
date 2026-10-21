import { createTranslator } from "next-intl";
import { describe, expect, it } from "vitest";

import { auditForbiddenCopy } from "@/features/audit/lib/forbidden-copy";
import en from "@/i18n/messages/en.json";
import pt from "@/i18n/messages/pt.json";

const t = createTranslator({ locale: "pt", messages: pt, namespace: "audit" });

describe("auditForbiddenCopy", () => {
  it("points a user with several Roles to their profile", () => {
    const copy = auditForbiddenCopy(t, 3);
    expect(copy.homeHref).toBe("/profile");
    expect(copy.homeLabel).toBe("Ir para o meu perfil");
    expect(copy.description).toContain("perfil ativo");
    expect(copy.description).toContain("inicie sessão novamente");
  });

  it("speaks the language of the translator", () => {
    const copy = auditForbiddenCopy(
      createTranslator({ locale: "en", messages: en, namespace: "audit" }),
      2,
    );
    expect(copy.homeLabel).toBe("Go to my profile");
    expect(copy.description).toContain("active role");
  });

  it("keeps the generic 403 for a single Role or unknown roles", () => {
    expect(auditForbiddenCopy(t, 1)).toEqual({});
    expect(auditForbiddenCopy(t, 0)).toEqual({});
    expect(auditForbiddenCopy(t, null)).toEqual({});
  });
});
