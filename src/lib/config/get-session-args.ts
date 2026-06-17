import { isPreviewMode } from "../utils";
import { getBasePath } from "./get-base-path";

// CRITICAL CONSTRAINT: this value MUST be strictly less than the framework's
// TOKEN_REFRESH_BUFFER_MS (currently 60 s). If poll_interval >= 60 s, the last
// client-side poll before the 60 s buffer window opens will NOT trigger a
// proactive refresh. Server-side renders inside the window do refresh (via the
// JWT callback in getServerSession), but those run in RSC context where cookies
// are read-only, so the refreshed token cannot be persisted. The session cookie
// is only updated on the NEXT client poll — meaning there is a window of up to
// poll_interval seconds where all server renders race against an expired cookie.
// With rotating refresh tokens this is handled by the recovery store; without
// it, repeated server-side refreshes consume the same refresh token.
//
// Safe values: ≤ 45 s (gives a 15 s margin below the 60 s buffer).
// The 150 s default was calibrated for a ~177 s access-token lifetime; if your
// IdP issues longer-lived tokens (e.g. 1-hour / 3600 s) the interval is no
// longer "ahead of the buffer window" — reduce it to 45 s or below.
const DEFAULT_REFETCH_INTERVAL_SECONDS = 45;

// Threshold below which a configured interval triggers a warning. Must match
// the framework's TOKEN_REFRESH_BUFFER_MS / 1000.
const REFRESH_BUFFER_SECONDS = 60;

/**
 * Session refetch cadence (in seconds) for the client `SessionProvider`. This
 * poll is the primary trigger for silent token refresh: each tick hits
 * `/api/auth/session`, which runs the jwt callback and rotates the access token
 * when it's near/after expiry.
 *
 * Must be strictly less than 60 (the framework's proactive-refresh buffer).
 * Falls back to 45 s when the var is unset, non-numeric, or <= 0.
 */
function getRefetchInterval(): number {
  const raw = process.env.IGRP_SESSION_REFETCH_INTERVAL?.trim();
  if (!raw) return DEFAULT_REFETCH_INTERVAL_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0)
    return DEFAULT_REFETCH_INTERVAL_SECONDS;
  if (parsed >= REFRESH_BUFFER_SECONDS) {
    console.warn(
      `[session] IGRP_SESSION_REFETCH_INTERVAL=${parsed}s is >= the framework's ` +
        `${REFRESH_BUFFER_SECONDS}s refresh buffer. Client-side polls will not trigger ` +
        `proactive refresh — the token may expire before the next poll fires the refresh. ` +
        `Set IGRP_SESSION_REFETCH_INTERVAL to a value below ${REFRESH_BUFFER_SECONDS} (recommended: 45).`,
    );
  }
  return parsed;
}

export function getSessionArgs() {
  if (isPreviewMode()) {
    return {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
    };
  }

  return {
    refetchInterval: getRefetchInterval(),
    refetchOnWindowFocus: true,
    basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
  };
}
