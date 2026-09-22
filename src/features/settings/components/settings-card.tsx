"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  cn,
  IGRPIcon,
  type IGRPIconName,
} from "@igrp/igrp-framework-react-design-system";

import { Badge } from "@/components/ui/badge";

export interface SettingsItem {
  id: string;
  title: string;
  description: string;
  icon: IGRPIconName;
  href: Route | string;
  status?: "inativo";
}

interface SettingsCardProps {
  item: SettingsItem;
}

export function SettingsCard({ item }: SettingsCardProps) {
  const isDisabled = item.status === "inativo";

  const cardContent = (
    <div className="flex items-start gap-4">
      <div
        className={cn(
          "p-2.5 rounded-md bg-primary/10 shrink-0",
          isDisabled && "opacity-60",
        )}
      >
        <IGRPIcon iconName={item.icon} className="size-5 text-primary" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        {/* Title stays at full contrast even when disabled: dimming it below
            4.5:1 would trade an AA failure for a visual cue the badge already
            carries. */}
        <h3 className="font-medium text-foreground">{item.title}</h3>
        <p className="text-xs text-muted-foreground leading-snug">
          {item.description}
        </p>
      </div>
    </div>
  );

  const sharedClassName = cn(
    "relative text-left p-5 rounded-lg border-0 bg-accent/20 transition-colors motion-reduce:transition-none",
    !isDisabled &&
      "block cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (isDisabled) {
    // Not a link and not focusable: it has no destination. The badge is the
    // state, visible and announced in reading order — a tooltip here would be
    // mouse-only.
    return (
      <div className={sharedClassName}>
        {cardContent}
        <Badge variant="secondary" className="absolute top-2 right-2 text-xs">
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
