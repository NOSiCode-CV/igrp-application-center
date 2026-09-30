import { isAuthBypass } from "../utilities";
import { getBasePath } from "./get-base-path";

// Adaptive refresh is owned by IGRPSessionWatcher, which schedules a
// getSession() call from session.expiresAt and reschedules on every rotation.
// refetchOnWindowFocus covers backgrounded tabs on return.
// This interval is a last-resort backstop only (e.g. suspended laptop waking
// with a stale session that IGRPSessionWatcher's timer never fired for).
const FALLBACK_REFETCH_INTERVAL_SECONDS = 600;

/**
 * Session args for the client `SessionProvider`.
 *
 * Adaptive refresh is handled by `IGRPSessionWatcher` (derives timing from
 * `session.expiresAt`), not by the `refetchInterval` here. The fixed interval
 * is a last-resort backstop; `refetchOnWindowFocus` covers tab-return recovery.
 */
export function getSessionArgs() {
  if (isAuthBypass()) {
    return {
      refetchInterval: 0,
      refetchOnWindowFocus: false,
      basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
    };
  }

  return {
    refetchInterval: FALLBACK_REFETCH_INTERVAL_SECONDS,
    refetchOnWindowFocus: true,
    basePath: getBasePath(process.env.NEXT_PUBLIC_BASE_PATH || ""),
  };
}
