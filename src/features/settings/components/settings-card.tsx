"use client";

import type { Route } from "next";
import Link from "next/link";

import {
  Badge,
  cn,
  IGRPIcon,
  type IGRPIconName,
} from "@igrp/igrp-framework-react-design-system";

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
  const accent = isDisabled
    ? "bg-muted text-muted-foreground"
    : ACCENTS[item.accent ?? "primary"];

  const cardContent = (
    <>      
      <div className={cn("flex items-center gap-3", isDisabled && "pr-20")}>
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg",
            accent,
          )}
        >
          <IGRPIcon iconName={item.icon} className="size-5" />
        </div>        
        <h2
          className={cn(
            "font-semibold text-sm min-w-0",
            isDisabled
              ? "text-muted-foreground"
              : "text-foreground group-hover:text-primary",
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
 
  const sharedClassName = cn(
    "group relative flex flex-col gap-3 rounded-xl border border-border p-5 h-full",
    "transition-colors motion-reduce:transition-none",
    isDisabled
      ? "bg-muted/40 border-dashed"
      : "bg-card hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (isDisabled) {    
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
