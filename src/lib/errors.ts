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
  PUBLIC_ERROR_DELIMITER,
  parsePublicDigest,
  getDisplayableErrorMessage,
  type PublicErrorId,
  type PublicErrorMessage,
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
