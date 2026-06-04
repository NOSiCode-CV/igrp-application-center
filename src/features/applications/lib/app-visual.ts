/**
 * Visual helpers for application cards: deterministic monograms, hues, and
 * relative timestamps (pt-PT). Centralised so card / pill / tile share the
 * same identity for a given application.
 */

/** Return up to 2 uppercase letters representing the application. */
export function monogram(name?: string | null, fallbackCode?: string): string {
  const source = (name ?? fallbackCode ?? "").trim();
  if (!source) return "?";
  const words = source.split(/[\s_\-./]+/).filter(Boolean);
  if (words.length === 0) return source.slice(0, 2).toUpperCase();
  if (words.length === 1) {
    const w = words[0];
    return (w.length >= 2 ? w.slice(0, 2) : w).toUpperCase();
  }
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Deterministic hue in [0, 360) derived from the app code. Same code → same
 * colour across mounts and reloads. djb2-style hash so the result spreads
 * across the wheel even for similar inputs ("APP_USERS" vs "APP_USERS_2").
 */
export function hueForCode(code?: string | null): number {
  const s = code ?? "";
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return Math.abs(h) % 360;
}

/**
 * Inline style for a monogram tile derived from the application code. Uses
 * HSL so the background stays soft and the text stays legible in both
 * themes; theme-aware tweaks are handled by the consumer if needed.
 */
export function monogramStyle(code?: string | null): {
  background: string;
  color: string;
} {
  const hue = hueForCode(code);
  return {
    background: `hsl(${hue} 70% 92%)`,
    color: `hsl(${hue} 55% 30%)`,
  };
}

/** Portuguese relative-time formatter. Returns "" for missing/invalid input. */
export function relativeTimePt(
  iso?: string | null,
  now: Date = new Date(),
): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const diffMs = now.getTime() - t;
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return "agora mesmo";
  const min = Math.round(sec / 60);
  if (min < 60) return `há ${min} min`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `há ${hr} h`;
  const day = Math.round(hr / 24);
  if (day === 1) return "ontem";
  if (day < 7) return `há ${day} dias`;
  const wk = Math.round(day / 7);
  if (wk < 5) return `há ${wk} sem`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `há ${mo} meses`;
  const yr = Math.round(day / 365);
  return `há ${yr} ano${yr === 1 ? "" : "s"}`;
}
