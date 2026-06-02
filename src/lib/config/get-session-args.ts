import { isPreviewMode } from "../utils";
import { getBasePath } from "./get-base-path";

// Default tuned for Spring Authorization Server's default 5-minute (300s)
// access-token lifetime: 180s polls comfortably inside the token's life (and
// ahead of the jwt callback's 60s proactive-refresh window), leaving ~2 min of
// margin. Override via IGRP_SESSION_REFETCH_INTERVAL if your access-token TTL
// differs.
const DEFAULT_REFETCH_INTERVAL_SECONDS = 180;

/**
 * Session refetch cadence (in seconds) for the client `SessionProvider`. This
 * poll is the primary trigger for silent token refresh: each tick hits
 * `/api/auth/session`, which runs the jwt callback and rotates the access token
 * when it's near/after expiry.
 *
 * Set `IGRP_SESSION_REFETCH_INTERVAL` *below* your IdP access-token lifetime so
 * a refresh reliably lands within the token's life. Falls back to 180s when the
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
