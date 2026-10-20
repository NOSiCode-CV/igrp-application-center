import { isSafeCssValue } from "@igrp/framework-next-ui";
import { converter, formatHex, parse } from "culori";

/** Concrete colour syntaxes the editor saves (spec §9, editor rules). */
const EDITOR_SYNTAX =
  /^(#[0-9a-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch)\(.*\)|[a-z]+)$/i;
/* Keywords culori parses but that have no single OKLCH value worth storing. */
const NO_SINGLE_VALUE = new Set(["transparent", "currentcolor"]);

const toOklch = converter("oklch");
const round = (n: number | undefined) => Number((n ?? 0).toFixed(4));

/** A value the editor accepts for saving: concrete, safe, and parseable by culori. */
export function isEditorColor(value: string): boolean {
  const v = value.trim();
  return (
    isSafeCssValue(v) &&
    EDITOR_SYNTAX.test(v) &&
    !NO_SINGLE_VALUE.has(v.toLowerCase()) &&
    parse(v) !== undefined
  );
}

/** `oklch(L C H)` or `oklch(L C H / A)` with four decimals, or `null` when not an editor colour. */
export function normalizeColor(value: string): string | null {
  if (!isEditorColor(value)) return null;
  const color = toOklch(parse(value.trim()));
  if (!color) return null;
  const alpha = color.alpha ?? 1;
  // Greys carry float residue in a/b, so culori reports a meaningless hue; pin it to 0.
  const c = round(color.c);
  const base = `${round(color.l)} ${c} ${c === 0 ? 0 : round(color.h)}`;
  return alpha < 1 ? `oklch(${base} / ${round(alpha)})` : `oklch(${base})`;
}

/** Hex for the native colour input, which only takes `#rrggbb`. */
export function toHex(value: string): string {
  const color = parse(value.trim());
  return color ? formatHex(color) : "#000000";
}
