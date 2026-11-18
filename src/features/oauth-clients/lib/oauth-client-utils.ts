import type {
  OAuthGrantType,
  ServiceAccountDTO,
} from "@igrp/platform-access-management-client-ts";
import type { useTranslations } from "next-intl";

/** `useTranslations("oauthClients")` / `getTranslations("oauthClients")` result. */
export type OAuthClientsTranslator = ReturnType<
  typeof useTranslations<"oauthClients">
>;

/** Order matches the grant-type cards in the design canvas. */
export const GRANT_TYPES: readonly {
  value: OAuthGrantType;
  descriptionKey:
    | "authorizationCode"
    | "refreshToken"
    | "clientCredentials"
    | "deviceCode";
}[] = [
  { value: "authorization_code", descriptionKey: "authorizationCode" },
  { value: "refresh_token", descriptionKey: "refreshToken" },
  { value: "client_credentials", descriptionKey: "clientCredentials" },
  { value: "device_code", descriptionKey: "deviceCode" },
] as const;

export type ClientKind = "web" | "machine";

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
  { size: 86_400, key: "days" },
  { size: 3_600, key: "hours" },
  { size: 60, key: "minutes" },
] as const;

/** Largest unit that divides exactly; otherwise seconds. Empty when unknown. */
export function formatSeconds(
  t: OAuthClientsTranslator,
  seconds: number | undefined,
): string {
  if (seconds === undefined || !Number.isFinite(seconds) || seconds <= 0)
    return "";
  for (const unit of UNITS) {
    if (seconds % unit.size === 0) {
      return t(`duration.${unit.key}`, { count: seconds / unit.size });
    }
  }
  return t("duration.seconds", { count: seconds });
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

/**
 * Why this client cannot be deleted, or `null` when it can. A linked service
 * account must go first; an unknown link state fails safe the same way.
 */
export function getDeleteBlockedReason(
  t: OAuthClientsTranslator,
  linkedAccount: { name: string } | undefined,
  linkUnknown: boolean | undefined,
): string | null {
  if (linkedAccount)
    return t("deleteBlockedByAccount", { name: linkedAccount.name });
  return linkUnknown ? t("linkUnknown") : null;
}
