"use client";

import Link from "next/link";
import type { Route } from "next";

import {
  cn,
  IGRPIcon,
  type IGRPIconName,
} from "@igrp/igrp-framework-react-design-system";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
      <div className="p-2.5 rounded-md bg-primary/10 shrink-0">
        <IGRPIcon iconName={item.icon} className="size-5 text-primary" />
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <h3 className="font-medium text-primary">{item.title}</h3>
        <p className="text-xs text-muted-foreground leading-snug">
          {item.description}
        </p>
      </div>
    </div>
  );

  const sharedClassName = cn(
    "relative text-left p-5 rounded-lg border-0 bg-accent/20 transition-colors",
    isDisabled
      ? "opacity-50 cursor-not-allowed"
      : "cursor-pointer hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
  );

  if (isDisabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              role="link"
              tabIndex={0}
              aria-disabled="true"
              className={sharedClassName}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") e.preventDefault();
              }}
            >
              {cardContent}
              <Badge
                variant="secondary"
                className="absolute top-2 right-2 text-xs"
              >
                Em breve
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Disponível em breve</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Link href={item.href as Route} className={sharedClassName}>
      {cardContent}
    </Link>
  );
}
