import type {
  IGRPBranding,
  IGRPBrandingLogos,
  IGRPBrandingMode,
} from "@igrp/framework-next-types";

import { BRANDING_TOKEN_NAMES } from "../catalog";
import { normalizeColor } from "./color-normalize";

export const LOGO_SLOTS = ["header", "wide", "favicon"] as const;
export type LogoSlotKey = (typeof LOGO_SLOTS)[number];

/** `""` means "no image". A `File` is a pick that is not uploaded yet. */
export type LogoSlotForm<F = File | string> = {
  light: F;
  dark: F;
  width?: number;
  height?: number;
};

export type BrandingFormValues<F = File | string> = {
  tokens: Record<IGRPBrandingMode, Record<string, string>>;
  logos: Record<LogoSlotKey, LogoSlotForm<F>>;
};

const MODES: IGRPBrandingMode[] = ["light", "dark"];

/** Every catalog Token gets a field (controlled inputs); unset ones are `""`. */
export function toFormValues(
  branding: IGRPBranding | null,
): BrandingFormValues {
  const tokens = { light: {}, dark: {} } as BrandingFormValues["tokens"];
  for (const mode of MODES) {
    for (const name of BRANDING_TOKEN_NAMES) {
      tokens[mode][name] = branding?.tokens[mode]?.[name] ?? "";
    }
  }
  const logos = {} as BrandingFormValues["logos"];
  for (const slot of LOGO_SLOTS) {
    const s = branding?.logos[slot];
    logos[slot] = {
      light: s?.light ?? "",
      dark: s?.dark ?? "",
      ...(s?.width && s.height ? { width: s.width, height: s.height } : {}),
    };
  }
  return { tokens, logos };
}

/** The document to save. Drops empty fields; colours become OKLCH. Logos must already be URLs. */
export function toBrandingDocument(
  values: BrandingFormValues<string>,
): IGRPBranding {
  const tokens: Record<IGRPBrandingMode, Record<string, string>> = {
    light: {},
    dark: {},
  };
  for (const mode of MODES) {
    for (const [name, raw] of Object.entries(values.tokens[mode])) {
      if (!raw.trim()) continue;
      const value = normalizeColor(raw);
      if (!value) throw new Error(`branding: invalid colour for ${name}`);
      tokens[mode][name] = value;
    }
  }
  const logos: IGRPBrandingLogos = {};
  for (const slot of LOGO_SLOTS) {
    const s = values.logos[slot];
    if (!s.light) continue;
    logos[slot] = {
      light: s.light,
      ...(s.dark ? { dark: s.dark } : {}),
      ...(slot === "wide" && s.width && s.height
        ? { width: s.width, height: s.height }
        : {}),
    };
  }
  return { version: 1, tokens, logos };
}
