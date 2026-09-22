"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  cn,
  IGRPIcon,
  type IGRPIconName,
} from "@igrp/igrp-framework-react-design-system";

import { Badge } from "@/components/ui/badge";

/**
 * The icon chip's colour. Each entry is one of the `-subtle` token pairs from
 * `src/styles/app-center.css`, which carry a measured >= 4.5:1 contract in BOTH
 * themes — so a card can be recoloured without re-auditing it, and a theme can
 * restyle all of them at once. Never `bg-x/10 text-x`: that is a token over a
 * wash of itself, and its ratio is a pure function of the token's lightness.
 *
 * Colour here is identity, not state: it helps someone return to the same card
 * twice, and it carries nothing the title does not already say.
 */
const ACCENTS = {
  primary: "bg-primary-subtle text-primary-subtle-foreground",
  info: "bg-info-subtle text-info-subtle-foreground",
  success: "bg-success-subtle text-success-subtle-foreground",
  warning: "bg-warning-subtle text-warning-subtle-foreground",
} as const;

export type SettingsAccent = keyof typeof ACCENTS;

export interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: IGRPIconName;
  href: Route | string;
  accent?: SettingsAccent;
  status?: "inativo";
}

interface SettingsCardProps {
  item: SettingsItem;
}

export function SettingsCard({ item }: SettingsCardProps) {
  const isDisabled = item.status === "inativo";
  const accent = ACCENTS[item.accent ?? "primary"];

  const cardContent = (
    <>
      {/* `pr-20` clears the absolutely-positioned "Em breve" badge so a long
          title wraps beside it instead of running underneath it. */}
      <div className={cn("flex items-center gap-3", isDisabled && "pr-20")}>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent,
            isDisabled && "opacity-60",
          )}
        >
          <IGRPIcon iconName={item.icon} className="size-5" />
        </div>
        {/* Title stays at full contrast even when disabled: dimming it below
            4.5:1 would trade an AA failure for a visual cue the badge already
            carries. */}
        <h2
          className={cn(
            "font-semibold text-sm text-foreground min-w-0",
            !isDisabled && "group-hover:text-primary",
          )}
        >
          {item.title}
        </h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
        {item.description}
      </p>
    </>
  );

  /* Same card vocabulary as the app tiles on the launcher — `rounded-xl border
     border-border bg-card`, primary border on hover. A settings card that
     looked like nothing else in the product was the odd one out, and would
     have drifted further at the next system update. */
  const sharedClassName = cn(
    "group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5 h-full",
    "transition-colors motion-reduce:transition-none",
    !isDisabled &&
      "hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (isDisabled) {
    // Not a link and not focusable: it has no destination. The badge is the
    // state, visible and announced in reading order — a tooltip here would be
    // mouse-only.
    return (
      <div className={sharedClassName}>
        {cardContent}
        <Badge variant="secondary" className="absolute top-3 right-3 text-xs">
          Em breve
        </Badge>
      </div>
    );
  }

  return (
    <Link href={item.href as Route} className={sharedClassName}>
      {cardContent}
    </Link>
  );
}
