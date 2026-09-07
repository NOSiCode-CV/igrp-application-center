"use client";

import { Info } from "lucide-react";

import { useCurrentUserActiveRole } from "@/features/users/use-users";

import type { Task } from "../../types";
import { TaskList } from "./task-list";
import { WorkSummarySidebar } from "./work-summary-sidebar";

type Props = { tasks: Task[] };

export function TasksTab({ tasks }: Props) {
  const { data: activeRole } = useCurrentUserActiveRole();
  const roleScope = activeRole?.roleCode ?? "staff";

  return (
    <div className="flex flex-col gap-4">
      {/* These rows come from `data/mock-tasks.ts`, not from a task API. Saying
          so is the difference between a preview and invented work assigned to
          the signed-in user. Remove this notice once a real source is wired. */}
      <div className="flex items-start gap-2.5 rounded-lg border border-info-subtle bg-info-subtle px-3.5 py-2.5 text-info-subtle-foreground">
        <Info size={15} className="mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          <strong className="font-semibold">Preview with sample data.</strong>{" "}
          This workspace is not connected to a task source yet — the tickets,
          requesters and due dates below are placeholders, not your work.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        <TaskList tasks={tasks} roleScope={roleScope} />
        <WorkSummarySidebar tasks={tasks} />
      </div>
    </div>
  );
}
