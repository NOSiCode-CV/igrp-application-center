import { isPreviewMode } from "../utils";
import { getBasePath } from "./get-base-path";

// Default tuned to sit BELOW the IGRP IdP's measured ~177s access-token
// lifetime: a 150s poll lands inside the token's life (and ahead of the jwt
// callback's 60s proactive-refresh window) so the rotating refresh persists via
// the client poll before the cookie's expiry trips a middleware /login bounce.
// A poll interval >= the access-token TTL lets the persisted cookie expire
// between polls, bouncing healthy sessions to /login. Override via
// IGRP_SESSION_REFETCH_INTERVAL if your access-token TTL differs.
const DEFAULT_REFETCH_INTERVAL_SECONDS = 150;

/**
 * Session refetch cadence (in seconds) for the client `SessionProvider`. This
 * poll is the primary trigger for silent token refresh: each tick hits
 * `/api/auth/session`, which runs the jwt callback and rotates the access token
 * when it's near/after expiry.
 *
 * Set `IGRP_SESSION_REFETCH_INTERVAL` *below* your IdP access-token lifetime so
 * a refresh reliably lands within the token's life. Falls back to 150s when the
 * var is unset, non-numeric, or <= 0.
 */
function getRefetchInterval(): number {
  const raw = process.env.IGRP_SESSION_REFETCH_INTERVAL?.trim();
  if (!raw) return DEFAULT_REFETCH_INTERVAL_SECONDS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_REFETCH_INTERVAL_SECONDS;
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
