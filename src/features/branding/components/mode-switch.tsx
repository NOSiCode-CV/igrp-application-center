"use client";

import type { IGRPBrandingMode } from "@igrp/framework-next-types";
import { cn, IGRPIcon } from "@igrp/igrp-framework-react-design-system";
import { useTranslations } from "next-intl";

/**
 * Chooses the Mode being edited (form and preview). Never changes the user's theme.
 * Hand-rolled rather than the DS Switch: spec §2 wants a sun/moon icon in the knob,
 * which the Radix thumb does not take.
 */
export function ModeSwitch({
  mode,
  onChange,
}: {
  mode: IGRPBrandingMode;
  onChange: (mode: IGRPBrandingMode) => void;
}) {
  const t = useTranslations("branding.modes");
  const dark = mode === "dark";
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-label={t("label")}
        onClick={() => onChange(dark ? "light" : "dark")}
        className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border bg-muted transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "flex size-5 items-center justify-center rounded-full bg-background shadow-sm transition-transform",
            dark ? "translate-x-6" : "translate-x-1",
          )}
        >
          <IGRPIcon
            iconName={dark ? "Moon" : "Sun"}
            className="size-3"
            aria-hidden="true"
          />
        </span>
      </button>
      <span className="text-sm" aria-hidden="true">
        {dark ? t("dark") : t("light")}
      </span>
    </div>
  );
}
