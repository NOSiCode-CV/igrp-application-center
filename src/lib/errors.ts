// ─────────────────────────────────────────────────────────────────────────────
// Error utilities for the template.
//
// `AppError`, `logger`, and the digest helpers now live in the framework
// package and are re-exported here so imports from `@/lib/errors` continue
// to work unchanged.
//
// Template-specific error classes (`EnvValidationError`, `AuthError`) stay in
// this file — they are not framework concerns.
// ─────────────────────────────────────────────────────────────────────────────

// ── Re-exports from @igrp/framework-next ────────────────────────────────────

export {
  AppError,
  getDisplayableErrorMessage,
  PUBLIC_ERROR_DELIMITER,
  type PublicErrorId,
  type PublicErrorMessage,
  parsePublicDigest,
} from "@igrp/framework-next/app-error";
export { logger } from "@igrp/framework-next/logger";

// ── Template-specific errors ─────────────────────────────────────────────────

/**
 * Thrown when required environment variables are missing or invalid.
 * Only used during template startup — not a framework concern.
 */
export class EnvValidationError extends Error {
  constructor(
    message: string,
    public readonly missingVars: string[] = [],
  ) {
    super(message);
    this.name = "EnvValidationError";
    Object.setPrototypeOf(this, EnvValidationError.prototype);
  }
}

/**
 * Thrown for authentication-related failures within the template.
 * For framework auth-config errors use `IgrpAuthConfigError` from
 * `@igrp/framework-next/errors` instead.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "AuthError";
    Object.setPrototypeOf(this, AuthError.prototype);
  }
}

// ── HTTP status errors (status-aware error pages) ────────────────────────────

const HTTP_STATUS_DIGEST_PREFIX = "HTTP_STATUS_";

/**
 * Thrown by server pages when an access-manager fetch fails with an HTTP
 * status. Next.js redacts `error.message` across the server→client boundary
 * in production but leaves `error.digest` untouched (same trick as
 * `AppError`), so the status and public message are encoded into `digest`
 * as `HTTP_STATUS_<status>|<message>` and recovered client-side by
 * `parseHttpStatusDigest` inside an `error.tsx` boundary.
 */
export class HttpStatusError extends Error {
  digest: string;

  constructor(
    public readonly status?: number,
    publicMessage?: string,
  ) {
    super(publicMessage || `HTTP ${status ?? "error"}`);
    this.name = "HttpStatusError";
    this.digest = `${HTTP_STATUS_DIGEST_PREFIX}${status ?? ""}|${publicMessage ?? ""}`;
    Object.setPrototypeOf(this, HttpStatusError.prototype);
  }
}

/**
 * Recovers `{ status, message }` from a digest written by `HttpStatusError`.
 * Returns `null` for any other digest (AppError digests, React digests, …)
 * so callers can fall through to their existing error handling.
 */
export function parseHttpStatusDigest(
  digest: string | undefined,
): { status?: number; message?: string } | null {
  if (!digest?.startsWith(HTTP_STATUS_DIGEST_PREFIX)) return null;
  const rest = digest.slice(HTTP_STATUS_DIGEST_PREFIX.length);
  const sep = rest.indexOf("|");
  if (sep === -1) return null;
  const statusRaw = rest.slice(0, sep);
  const status = statusRaw ? Number(statusRaw) : undefined;
  return {
    status: Number.isFinite(status) ? status : undefined,
    message: rest.slice(sep + 1) || undefined,
  };
}
