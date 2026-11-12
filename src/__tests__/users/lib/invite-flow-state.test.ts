import { describe, expect, it } from "vitest";

import { classifyInviteError } from "@/features/users/components/invite/invite-flow-state";

describe("classifyInviteError", () => {
  it.each([
    ["O convite expirou.", "expired"],
    ["The invitation has expired.", "expired"],
    ["L’invitation a expiré.", "expired"],
    ["O email não corresponde ao convite.", "mismatch"],
    ["The email does not match the invitation.", "mismatch"],
    ["L’e-mail ne correspond pas à l’invitation.", "mismatch"],
    ["Cet e-mail n’appartient pas à l’invitation.", "mismatch"],
    ["Erro interno do servidor", "other"],
    [undefined, "other"],
  ] as const)("%s → %s", (message, expected) => {
    expect(classifyInviteError(message)).toBe(expected);
  });
});
