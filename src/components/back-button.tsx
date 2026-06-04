"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";

import { Button, IGRPIcon } from "@igrp/igrp-framework-react-design-system";

import { cn } from "@/lib/utils";

interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export function BackButton({ href, label, className }: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href as Route);
    } else {
      router.back();
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-1 px-2 h-8", className)}
      onClick={handleClick}
      aria-label={label || "Go back"}
    >
      <IGRPIcon iconName="ArrowLeft" strokeWidth={2} />
      {label && <span>{label}</span>}
    </Button>
  );
}
