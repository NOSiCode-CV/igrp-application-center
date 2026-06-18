"use client";

import type { ReactNode } from "react";

import { Card, CardContent } from "@igrp/igrp-framework-react-design-system";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

export type InviteStepIndex = 0 | 1 | 2;

interface InviteCardShellProps {
  children: ReactNode;
  step?: InviteStepIndex;
  totalSteps?: 2 | 3;
}

export function InviteCardShell({
  children,
  step,
  totalSteps = 3,
}: InviteCardShellProps) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-background p-6">
      {/* Subtle dot grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(0,0,0,0.055) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Primary colour wash from top */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent"
      />

      {/* Card */}
      <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/60 shadow-2xl">
        <div
          aria-hidden="true"
          className="h-0.5 bg-linear-to-r from-transparent via-primary/50 to-transparent"
        />
        <CardContent
          className="flex flex-col gap-8 p-8 sm:p-10"
          aria-live="polite"
        >
          {children}
        </CardContent>
      </Card>

      {step !== undefined ? (
        <StepIndicator current={step} total={totalSteps} />
      ) : null}
    </main>
  );
}

const STEP_LABELS_3 = ["Email", "Código", "Confirmar"] as const;
const STEP_LABELS_2 = ["Email", "Confirmar"] as const;

function StepIndicator({
  current,
  total,
}: {
  current: InviteStepIndex;
  total: 2 | 3;
}) {
  const labels = total === 2 ? STEP_LABELS_2 : STEP_LABELS_3;
  const itemCount = total * 2 - 1;

  return (
    <ol
      aria-label={`Passo ${current + 1} de ${total}`}
      className="flex items-start"
    >
      {Array.from({ length: itemCount }, (_, i) => {
        const isConnector = i % 2 === 1;
        const idx = Math.floor(i / 2);

        if (isConnector) {
          return (
            <li
              key={`c-${idx}`}
              aria-hidden="true"
              className="mt-3 flex items-center"
            >
              <div
                className={cn(
                  "h-px w-10 transition-colors duration-500",
                  idx < current ? "bg-primary" : "bg-border",
                )}
              />
            </li>
          );
        }

        return (
          <li
            key={`s-${idx}`}
            aria-current={idx === current ? "step" : undefined}
            className="flex flex-col items-center gap-1.5"
          >
            <div
              aria-hidden="true"
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300",
                idx < current
                  ? "bg-primary text-primary-foreground"
                  : idx === current
                    ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                    : "bg-muted text-muted-foreground",
              )}
            >
              {idx < current ? (
                <Check aria-hidden="true" className="size-3" />
              ) : (
                String(idx + 1)
              )}
            </div>
            <span
              className={cn(
                "w-max text-[10px] font-medium transition-colors duration-300",
                idx === current
                  ? "text-foreground"
                  : "text-muted-foreground/50",
              )}
            >
              {labels[idx]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
