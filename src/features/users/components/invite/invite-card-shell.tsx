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
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6">
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

      {/* Card + left stepper row */}
      <div className="flex w-full flex-col items-center md:w-auto md:flex-row md:items-start md:gap-10">
        {/* Vertical stepper — desktop only */}
        {step !== undefined ? (
          <div className="hidden shrink-0 pt-9 md:block">
            <VerticalStepIndicator current={step} total={totalSteps} />
          </div>
        ) : null}

        {/* Card */}
        <Card className="w-full max-w-md overflow-hidden rounded-3xl border-border/60 shadow-2xl">
          <div
            aria-hidden="true"
            className="h-0.5 bg-linear-to-r from-transparent via-primary/50 to-transparent"
          />
          <CardContent className="flex flex-col gap-8 p-8 sm:p-10">
            {children}
          </CardContent>
        </Card>
      </div>

      {/* Horizontal stepper — mobile only, below card */}
      {step !== undefined ? (
        <div className="mt-6 md:hidden">
          <HorizontalStepIndicator current={step} total={totalSteps} />
        </div>
      ) : null}
    </main>
  );
}

// ── Step data ──────────────────────────────────────────────────────────────────

const STEP_DATA_3 = [
  { label: "Email", sub: "Confirmação" },
  { label: "Código", sub: "Verificação" },
  { label: "Confirmar", sub: "Convite" },
] as const;

const STEP_DATA_2 = [
  { label: "Email", sub: "Confirmação" },
  { label: "Confirmar", sub: "Convite" },
] as const;

// ── Vertical stepper (desktop, left side) ─────────────────────────────────────

function VerticalStepIndicator({
  current,
  total,
}: {
  current: InviteStepIndex;
  total: 2 | 3;
}) {
  const steps = (total === 2 ? STEP_DATA_2 : STEP_DATA_3) as readonly {
    label: string;
    sub: string;
  }[];

  return (
    <ol
      aria-label={`Passo ${current + 1} de ${total}`}
      className="flex flex-col"
    >
      {steps.map((step, idx) => {
        const isDone = idx < current;
        const isActive = idx === current;
        const isLast = idx === steps.length - 1;

        return (
          <li
            key={step.label}
            aria-current={isActive ? "step" : undefined}
            className="flex flex-col"
          >
            <div className="flex items-start gap-3">
              {/* Circle + connector column */}
              <div className="flex flex-col items-center">
                <div
                  aria-hidden="true"
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-[background-color,color,box-shadow] duration-300",
                    isDone
                      ? "bg-primary text-primary-foreground"
                      : isActive
                        ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isDone ? (
                    <Check
                      aria-hidden="true"
                      className="size-3.5"
                      strokeWidth={2.5}
                    />
                  ) : (
                    String(idx + 1)
                  )}
                </div>
                {!isLast ? (
                  <div
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 w-px transition-colors duration-500",
                      isDone ? "bg-primary/50" : "bg-border",
                    )}
                    style={{ height: "38px" }}
                  />
                ) : null}
              </div>

              {/* Label + sub */}
              <div className="flex flex-col gap-0.5 pt-0.5">
                <span
                  className={cn(
                    "text-sm font-semibold leading-none transition-colors duration-300",
                    isActive
                      ? "text-foreground"
                      : isDone
                        ? "text-muted-foreground"
                        : "text-muted-foreground/50",
                  )}
                >
                  {step.label}
                </span>
                <span
                  className={cn(
                    "text-xs leading-none transition-colors duration-300",
                    isActive
                      ? "text-muted-foreground"
                      : "text-muted-foreground/40",
                  )}
                >
                  {step.sub}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// ── Horizontal stepper (mobile fallback, below card) ──────────────────────────

const STEP_LABELS_3 = ["Email", "Código", "Confirmar"] as const;
const STEP_LABELS_2 = ["Email", "Confirmar"] as const;

function HorizontalStepIndicator({
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
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold transition-[background-color,color,box-shadow] duration-300",
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
                "w-max text-xs font-medium transition-colors duration-300",
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
