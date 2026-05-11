"use client";

import { Card } from "@igrp/igrp-framework-react-design-system";
import type { ReactNode } from "react";

export function InviteCardShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <Card className="relative w-full max-w-[480px] overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -right-24 h-48 w-48 rounded-full bg-primary/10 blur-[80px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-accent/10 blur-[80px]"
        />
        <div className="relative z-10" aria-live="polite">
          {children}
        </div>
      </Card>
    </div>
  );
}
