// ─────────────────────────────────────────────────────────────────────────────
// Error reporting hook for the template.
//
// Every App Router `error.tsx` / `global-error.tsx` boundary in this template
// calls `reportError(error, context)` from its mount effect. In DEV we just
// log to the console; in PROD this is the single place to wire Sentry /
// OpenTelemetry / whatever observability backend the team uses, keeping the
// boundaries themselves decoupled from that choice.
//
// The hook intentionally never throws — it must not mask the original error
// that the boundary is handling.
// ─────────────────────────────────────────────────────────────────────────────

export type ReportErrorContext = {
  /** App Router segment that caught this error (e.g. `'(igrp)'`, `'global'`). */
  segment?: string;
  /** Any additional trace context (pathname, user id, etc.). Must be serializable. */
  [key: string]: unknown;
};

/**
 * Reports a boundary-caught error.
 *
 * In production, replace the PROD stub with a POST to your observability
 * backend — pass `error.name`, `error.message` (may be redacted by Next on
 * the server→client edge), and especially `(error as any).digest`, which is
 * the correlation ID that maps back to the server-side log entry.
 */
export function reportError(
  error: unknown,
  context?: ReportErrorContext,
): void {
  try {
    if (process.env.NODE_ENV !== "production") {
      // Development: surface everything verbatim for the console.
      console.error(
        "[reportError]",
        context?.segment ?? "unknown",
        error,
        context,
      );
      return;
    }

    // Production: stub. Replace with Sentry.captureException / OTLP span / etc.
    // Keep the shape below so later wiring is drop-in: a serializable payload
    // with the error's stable fields and the caller-provided context.
    const payload = {
      name: getStringField(error, "name") ?? "Error",
      message: getStringField(error, "message") ?? "Unknown error",
      digest: getStringField(error, "digest"),
      code: getStringField(error, "code"),
      context,
    };

    console.error("[reportError:prod]", payload);
  } catch {
    // Never let the reporter itself throw.
  }
}

function getStringField(value: unknown, key: string): string | undefined {
  if (!value || typeof value !== "object") return undefined;
  const raw = (value as Record<string, unknown>)[key];
  return typeof raw === "string" ? raw : undefined;
}
