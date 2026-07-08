"use client";

import { useEffect, useState } from "react";

import {
  useCurrentUser,
  useCurrentUserActiveRole,
} from "@/features/users/use-users";

import { computeTaskStats, getGreeting } from "../../lib/task-utils";
import type { Task } from "../../types";

type Props = { tasks: Task[] };

function firstName(full?: string): string {
  return full?.trim().split(/\s+/)[0] ?? "";
}

export function WelcomeBanner({ tasks }: Props) {
  const { data: user } = useCurrentUser();
  const { data: activeRole } = useCurrentUserActiveRole();

  const [greeting, setGreeting] = useState<string | null>(null);
  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const stats = computeTaskStats(tasks);
  const roleName = activeRole?.roleCode ?? "STAFF";

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="size-12 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-lg select-none">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-success ring-2 ring-background" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-bold text-xl text-foreground">
            {greeting ?? "Welcome"}, {firstName(user?.name)}
          </h1>
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {roleName}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          Welcome back. You have{" "}
          <strong className="text-foreground">
            {stats.totalPending} pending tasks
          </strong>
          , including{" "}
          <strong className="text-warning">
            {stats.dueTodayCount} due today
          </strong>
          .
        </p>
      </div>
    </div>
  );
}
