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
