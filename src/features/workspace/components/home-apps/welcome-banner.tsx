"use client";

import { CalendarDays, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  useCurrentUser,
  useCurrentUserActiveRole,
} from "@/features/users/use-users";
import { computeTaskStats, getGreeting } from "../../lib/task-utils";
import type { Task } from "../../types";

type Props = { tasks: Task[] };

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

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
    <div className="rounded-xl border border-indigo-100 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="relative shrink-0">
        <div className="size-12 rounded-full bg-indigo-200 dark:bg-indigo-800 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-bold text-lg select-none">
          {(user?.name ?? "U").charAt(0).toUpperCase()}
        </div>
        <span className="absolute bottom-0 right-0 size-3 rounded-full bg-green-400 ring-2 ring-white dark:ring-gray-900" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-bold text-xl text-gray-900 dark:text-gray-100">
            {greeting ?? "Welcome"}, {firstName(user?.name)}
          </h1>
          <span className="rounded-full border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-gray-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">
            {roleName}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Welcome back. You have{" "}
          <strong className="text-gray-700 dark:text-gray-300">
            {stats.totalPending} pending tasks
          </strong>
          , including{" "}
          <strong className="text-amber-600">
            {stats.dueTodayCount} due today
          </strong>
          .
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-xs text-gray-600 dark:text-gray-400">
          <CalendarDays size={13} />
          {formatDate(new Date())}
        </span>
        <button
          type="button"
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 text-xs font-medium text-white transition-colors"
        >
          <Settings2 size={13} />
          Customize home
        </button>
      </div>
    </div>
  );
}
