import type {
  OAuthGrantType,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";

/** Order and copy match the grant-type cards in the design canvas. */
export const GRANT_TYPES: readonly {
  value: OAuthGrantType;
  description: string;
}[] = [
  {
    value: "authorization_code",
    description: "Utilizadores iniciam sessão no browser.",
  },
  { value: "refresh_token", description: "Renova a sessão sem novo login." },
  {
    value: "client_credentials",
    description:
      "Máquina a máquina, sem utilizador. Necessário para uma conta de serviço.",
  },
  {
    value: "device_code",
    description: "Dispositivos sem browser (TV, linha de comandos).",
  },
] as const;

export type ClientKind = "web" | "machine";

export const CLIENT_KIND_LABEL: Record<ClientKind, string> = {
  web: "Aplicação web",
  machine: "Máquina",
};

export function getClientKind(grantTypes: readonly string[]): ClientKind {
  return grantTypes.includes("authorization_code") ? "web" : "machine";
}

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1"]);

/** `https://` anywhere; plain `http://` only on the loopback host (dev). */
export function isAllowedRedirectUri(uri: string): boolean {
  let url: URL;
  try {
    url = new URL(uri);
  } catch {
    return false;
  }
  if (url.protocol === "https:") return true;
  return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname);
}

const UNITS = [
  { size: 86_400, one: "dia", many: "dias" },
  { size: 3_600, one: "hora", many: "horas" },
  { size: 60, one: "minuto", many: "minutos" },
] as const;

/** Largest unit that divides exactly; otherwise seconds. Empty when unknown. */
export function formatSeconds(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0)
    return "";
  for (const unit of UNITS) {
    if (seconds % unit.size === 0) {
      const n = seconds / unit.size;
      return `${n} ${n === 1 ? unit.one : unit.many}`;
    }
  }
  return `${seconds} ${seconds === 1 ? "segundo" : "segundos"}`;
}

export function findLinkedServiceAccount(
  accounts: readonly ServiceAccountDTO[] | undefined,
  oauthClientId: string,
): { account: ServiceAccountDTO | undefined; duplicate: boolean } {
  const linked = (accounts ?? []).filter(
    (a) => a.oauthClientId === oauthClientId,
  );
  return { account: linked[0], duplicate: linked.length > 1 };
}

/** Shown wherever the SA list is loading or failed, so the link is unknown. */
export const LINK_UNKNOWN_REASON =
  "Não foi possível verificar se existe uma conta de serviço.";
