import type { IGRPBrandingMode } from "@igrp/framework-next-types";

import { BRANDING_DEFAULTS } from "../token-defaults";
import { isEditorColor } from "./color-normalize";

/**
 * Inline custom properties for the preview panel: every Token at its Default
 * for the Mode, overlaid by the valid draft values. Setting every Token (not
 * just the draft) keeps the panel independent of the saved Brand on
 * `html:root` and of the page's own Mode, so a cleared field shows its Default.
 */
export function previewStyle(
  draft: Record<string, string>,
  mode: IGRPBrandingMode,
): Record<string, string> {
  const style = { ...BRANDING_DEFAULTS[mode] };
  for (const [name, value] of Object.entries(draft)) {
    if (value.trim() && isEditorColor(value)) style[name] = value.trim();
  }
  return style;
}
