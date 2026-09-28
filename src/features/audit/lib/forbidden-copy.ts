/* Permissions in the token come from the Active Role only. A user who holds
   igrp.audit.view through another Role is denied here — correctly, but the
   administrator who granted it will swear they did. Say why, and where to
   switch. Switching does not refresh the token, hence "sign in again". */
export function auditForbiddenCopy(roleCount: number | null): {
  description?: string;
  homeLabel?: string;
  homeHref?: string;
} {
  if (roleCount === null || roleCount <= 1) return {};
  return {
    description:
      "As permissões vêm apenas do seu perfil ativo. Se a permissão de auditoria lhe foi atribuída noutro perfil, ative-o no seu perfil e inicie sessão novamente.",
    homeLabel: "Ir para o meu perfil",
    homeHref: "/profile",
  };
}
