import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
