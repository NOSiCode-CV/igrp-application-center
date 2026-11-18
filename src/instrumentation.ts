/**
 * Next.js runs `register()` once per server runtime, before the first request.
 *
 * Session store: when `IGRP_SESSION_STORE_URL` is set, the session's tokens are
 * kept in Redis and the session cookie carries only a session id (a few hundred
 * bytes instead of 3–4 KB). That is what keeps apps sharing one domain — an
 * app center at `/` plus apps under `/apps/*` — under the 8 KB request-header
 * limit of nginx and other proxies. Unset, cookies hold the tokens as before.
 *
 * Registered here, and only in the Node runtime, so the Redis client never
 * reaches the Edge middleware bundle. Middleware does not need the store: the
 * cookie still carries the expiry the middleware checks.
 *
 * Every replica of the app must point at the same Redis.
 *
 * Auth-bypass guard: runs first. When bypass is on in a production build without
 * `IGRP_ALLOW_AUTH_BYPASS_IN_PRODUCTION`, it fails the instrumentation hook, so
 * Next logs the error and answers every request with 500.
 *
 * Keep the imports INSIDE the `NEXT_RUNTIME` block: Next compiles this file for
 * the Edge runtime too, inlines `NEXT_RUNTIME` there, and drops the block — an
 * early `return` instead leaves the imports reachable, and the Edge build then
 * fails on the Redis client's `node:` modules.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { igrpAssertAuthBypassAllowed } = await import(
      "@igrp/framework-next"
    );
    igrpAssertAuthBypassAllowed();

    const url = process.env.IGRP_SESSION_STORE_URL?.trim();
    if (!url) return;

    const [{ configureIGRPSessionStore }, { createRedisSessionStore }] =
      await Promise.all([
        import("@igrp/framework-next-auth/session-store"),
        import("./lib/session-store"),
      ]);
    configureIGRPSessionStore(createRedisSessionStore(url));
  }
}
