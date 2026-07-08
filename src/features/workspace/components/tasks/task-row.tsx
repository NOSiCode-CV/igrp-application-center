import { Paperclip } from "lucide-react";

import { getDueDateLabel } from "../../lib/task-utils";
import type { Task } from "../../types";

const PRIORITY_STYLES: Record<Task["priority"], string> = {
  HIGH: "bg-warning/15 text-warning",
  MEDIUM: "bg-info/15 text-info",
  NORMAL: "bg-muted text-muted-foreground",
  OVERDUE: "bg-destructive/15 text-destructive",
};

const DUE_COLOR: Record<"red" | "amber" | "normal", string> = {
  red: "text-destructive font-semibold",
  amber: "text-warning font-semibold",
  normal: "text-foreground",
};

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const weeks = Math.floor(diffDays / 7);
  return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
}

type Props = { task: Task };

export function TaskRow({ task }: Props) {
  const due = getDueDateLabel(task.dueDate);

  return (
    <div className="rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold uppercase ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {task.ticketCode}
            </span>
            <span className="text-xs text-primary font-medium">
              {task.category}
            </span>
          </div>

          <p className="font-semibold text-sm text-foreground mb-1.5">
            {task.title}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Requester: {task.requester}</span>
            <span>•</span>
            <span>{relativeTime(task.submittedAt)}</span>
            {task.attachmentCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5">
                  <Paperclip size={11} />
                  {task.attachmentCount} attachment
                  {task.attachmentCount !== 1 ? "s" : ""}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Due date threshold</p>
            <p className={`text-sm mt-0.5 ${DUE_COLOR[due.color]}`}>
              {due.label}
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
          >
            Review →
          </button>
        </div>
      </div>
    </div>
  );
}
