import { STATUS_OPTIONS } from "./constants";

export function getStatusColor(status: string) {
  return status === "ACTIVE" ? "status-active" : "status-inactive";
}

export function statusClass(status: string): import("clsx").ClassValue {
  if (!status) return "status-inactive";

  switch (status.trim()) {
    case "ACTIVE":
      return "status-active";
    case "INACTIVE":
      return "status-inactive";
    case "DELETED":
      return "status-deleted";
    default:
      return "status-inactive";
  }
}

export function statusInviteClass(status: string): import("clsx").ClassValue {
  if (!status) return "status-inactive";

  switch (status.trim()) {
    case "REJECTED":
    case "CANCELED":
      return "status-deleted";
    default:
      return "status-pending";
  }
}

export const geInviteTitle = (title: string) => {
  switch (title) {
    case "PENDING":
      return "Pendente";
    case "CANCELED":
      return "Cancelado";
    default:
      return "Rejeitado";
  }
};

export function getInitials(username: string) {
  const parts = username?.split(/[\s._-]+/).filter(Boolean);
  if (parts?.length === 0) return "";
  if (parts?.length === 1) return parts[0][0]?.toUpperCase() ?? "";
  return (parts[0][0] + parts[parts?.length - 1][0]).toUpperCase();
}

export function formatIconString(input: string): string {
  return input
    .replace(/([A-Z])/g, " $1")
    .replace(/([0-9]+)/g, " $1")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatConstanttoLabel(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const nullIfEmpty = (v: string | null | undefined): string | null =>
  typeof v === "string" && v.trim().length === 0 ? null : (v ?? null);

export function lowerCaseWithSpace(v: string | null | undefined) {
  if (v == null || v === undefined) return null;

  return typeof v === "string"
    ? v.toLowerCase().replace(/_/g, " ")
    : (v ?? null);
}

export function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("pt-PT", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function showStatus(status: string) {
  if (status == null || status === undefined) return null;
  return STATUS_OPTIONS.find((s) => s.value === status)?.label;
}

export const getMenuIcon = (type: string) => {
  switch (type) {
    case "FOLDER":
      return "Folder";
    case "EXTERNAL_PAGE":
      return "ExternalLink";
    case "MENU_PAGE":
      return "FileText";
    default:
      return "FileText";
  }
};

interface ApiErrorLike {
  details?: unknown;
  status?: number;
  message?: string;
  title?: string;
  /** RFC-7807 body parsed by the SDK (`ApiClientError.problemDetail`). */
  problemDetail?: { detail?: unknown };
}

export function extractApiError(error: unknown): string {
  const e = (error ?? {}) as ApiErrorLike;
  const detailsStr = typeof e.details === "string" ? e.details : null;
  if (detailsStr) {
    try {
      const parsed = JSON.parse(detailsStr) as {
        errors?: Record<string, string>;
        details?: string;
        title?: string;
      };

      if (parsed.errors) {
        const errorMessages = Object.values(parsed.errors).join(", ");
        return errorMessages;
      }

      if (parsed.details) {
        return parsed.details;
      }

      return parsed.title || getDefaultErrorMessage(e.status);
    } catch {
      return detailsStr;
    }
  }

  // The API translates `detail` into the request's Accept-Language (FR-21):
  // show it as-is when present.
  const detail = e.problemDetail?.detail;
  if (typeof detail === "string" && detail) {
    return detail;
  }

  if (typeof e.title === "string" && e.title) {
    return e.title;
  }

  if (e.status) {
    return getDefaultErrorMessage(e.status);
  }

  return e.message || "Erro desconhecido";
}

function getDefaultErrorMessage(status?: number): string {
  switch (status) {
    case 400:
      return "Requisição inválida";
    case 401:
      return "Não autorizado";
    case 403:
      return "Acesso negado";
    case 404:
      return "Recurso não encontrado";
    case 409:
      return "Conflito de dados";
    case 422:
      return "Dados inválidos";
    case 429:
      return "Muitas requisições, tente novamente mais tarde";
    case 500:
      return "Erro interno do servidor";
    case 502:
      return "Servidor indisponível";
    case 503:
      return "Serviço temporariamente indisponível";
    default:
      return "Erro na operação";
  }
}

/** Every generic fallback string `extractApiError` can produce. */
const DEFAULT_API_ERROR_MESSAGES = new Set([
  ...[400, 401, 403, 404, 409, 422, 429, 500, 502, 503, undefined].map(
    getDefaultErrorMessage,
  ),
  "Erro desconhecido",
]);

/**
 * Checks if preview mode is enabled from environment variable.
 * Handles whitespace, case sensitivity, and quotes.
 */
export function isPreviewMode(): boolean {
  const rawValue = process.env.IGRP_PREVIEW_MODE;
  const previewModeValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  return previewModeValue === "true";
}

/**
 * Checks if authentication is disabled at the provider level (AUTH_PROVIDER=none).
 * Handles whitespace, case sensitivity, and quotes.
 */
export function isAuthDisabled(): boolean {
  const rawValue = process.env.AUTH_PROVIDER;
  const providerValue = rawValue
    ?.trim()
    ?.replace(/^["']|["']$/g, "")
    ?.toLowerCase();
  return providerValue === "none";
}

/**
 * Returns true when the UI should bypass the auth flow entirely — either
 * because preview mode is on, or because AUTH_PROVIDER=none.
 *
 * Call sites use this single predicate wherever they previously checked
 * `isPreviewMode()` alone, so `AUTH_PROVIDER=none` gets the same UX path as
 * preview mode: no redirect to /login, /login itself routes back to /,
 * mock session in the layout, /api/auth/* blocked at the middleware.
 */
export function isAuthBypass(): boolean {
  return isPreviewMode() || isAuthDisabled();
}

/**
 * Validates and normalizes a `callbackUrl` query value.
 *
 * Rules:
 * - Must be a non-empty string starting with `/` (no protocol-relative URLs, no
 *   absolute URLs to other origins — would otherwise enable open-redirect).
 * - The basePath prefix is stripped for path comparison so `/login` and
 *   `/<basePath>/login` are treated the same.
 * - Anything pointing back to `/login` or `/logout` (the auth chrome itself)
 *   is rejected — those targets cause the post-auth redirect to land back on
 *   the login screen and accumulate a nested `callbackUrl` chain.
 *
 * @returns the original value when safe, otherwise `undefined` so callers can
 * fall back to `/`.
 */
export function sanitizeCallbackUrl(
  raw: unknown,
  basePath: string = process.env.NEXT_PUBLIC_BASE_PATH ?? "",
): string | undefined {
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  // Only same-origin relative URLs. Reject `//evil.com`, `http://…`, etc.
  if (!raw.startsWith("/") || raw.startsWith("//")) return undefined;

  // Normalize by stripping the configured basePath so `/login` and
  // `/<basePath>/login` collapse to the same check.
  let normalized = raw;
  if (basePath && (raw === basePath || raw.startsWith(`${basePath}/`))) {
    normalized = raw.slice(basePath.length) || "/";
  }

  const pathOnly = normalized.split("?")[0]?.split("#")[0] ?? "";
  if (pathOnly === "/login" || pathOnly.startsWith("/login/")) return undefined;
  if (pathOnly === "/logout" || pathOnly.startsWith("/logout/"))
    return undefined;

  return raw;
}

export const DATE_TIME_WITH_SECONDS: Intl.DateTimeFormatOptions = {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
};

