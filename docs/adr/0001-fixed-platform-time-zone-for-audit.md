# Audit dates use one fixed Platform Time Zone

The audit Reports require UTC instants, but administrators think in calendar days. We interpret every audit date range and display every audit time in a single configured Platform Time Zone (`Atlantic/Cape_Verde`), not in the server's zone or the viewer's browser zone. The Next.js server typically runs in UTC, which would shift a Cabo Verde "day" by an hour and hide events near midnight; the browser zone varies by machine and is invisible in a shared URL, so the same link could return different rows for different people. A fixed zone makes the filter and the displayed times always agree and makes a filtered Report link reproducible as evidence.

## Consequences

- Day boundaries are computed from the configured zone (env var), so we need a zone-aware helper (`date-fns-tz` or an `Intl`-based utility) rather than `new Date()` arithmetic.
- The date picker labels its times "Hora de Cabo Verde" so a viewer abroad is not misled.
- Relative presets ("last 7 days") resolve "now" at query time, not page load, so events created seconds ago are inside the window.
