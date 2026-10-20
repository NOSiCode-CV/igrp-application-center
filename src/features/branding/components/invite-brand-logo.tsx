"use client";

import { IGRPTemplateImage, useIGRPBranding } from "@igrp/framework-next-ui";
import { useTranslations } from "next-intl";

/** The Brand's wide logo on public invite pages (spec §2); nothing when unset. */
export function InviteBrandLogo() {
  const t = useTranslations("branding");
  const wide = useIGRPBranding()?.logos.wide;
  if (!wide) return null;
  const size = { width: wide.width ?? 160, height: wide.height ?? 48 };
  return (
    <div className="fixed top-4 left-4 z-10">
      <IGRPTemplateImage
        src={wide.light}
        fallback={null}
        alt={t("logoAlt")}
        {...size}
        className={
          wide.dark
            ? "h-auto max-h-20 w-auto dark:hidden"
            : "h-auto max-h-20 w-auto"
        }
      />
      {wide.dark && (
        <IGRPTemplateImage
          src={wide.dark}
          fallback={null}
          alt={t("logoAlt")}
          {...size}
          className="hidden h-auto max-h-20 w-auto dark:block"
        />
      )}
    </div>
  );
}
