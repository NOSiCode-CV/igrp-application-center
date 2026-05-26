"use client";

import { Card, CardContent } from "@igrp/igrp-framework-react-design-system";
import type { ReactNode } from "react";
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
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-6 bg-background">
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-xl">
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

function StepIndicator({
  current,
  total,
}: {
  current: InviteStepIndex;
  total: 2 | 3;
}) {
  return (
    <ol
      aria-label={`Passo ${current + 1} de ${total}`}
      className="flex items-center gap-2"
    >
      {Array.from({ length: total }, (_, i) => `step-${i}`).map((id, i) => (
        <li
          key={id}
          aria-current={i === current ? "step" : undefined}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            i === current ? "w-8 bg-primary" : "w-2 bg-muted-foreground/25",
          )}
        />
      ))}
    </ol>
  );
}
