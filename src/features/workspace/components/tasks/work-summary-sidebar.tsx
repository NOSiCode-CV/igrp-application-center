import { Bookmark } from "lucide-react";

import { computeTaskStats } from "../../lib/task-utils";
import type { Task } from "../../types";

type Props = { tasks: Task[] };

type Tone = "destructive" | "warning" | "info" | "muted";

const TONE_STYLES: Record<Tone, { card: string; badge: string }> = {
  destructive: {
    card: "border-destructive/30 bg-destructive/10",
    badge: "bg-destructive/20 text-destructive",
  },
  warning: {
    card: "border-warning/30 bg-warning/10",
    badge: "bg-warning/20 text-warning",
  },
  info: {
    card: "border-info/30 bg-info/10",
    badge: "bg-info/20 text-info",
  },
  muted: {
    card: "border-border bg-muted",
    badge: "bg-background text-foreground",
  },
};

type StatCardProps = {
  count: number;
  label: string;
  description: string;
  tone: Tone;
};

function StatCard({ count, label, description, tone }: StatCardProps) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      className={`rounded-lg p-3 flex items-center justify-between border ${styles.card}`}
    >
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-sm font-bold ${styles.badge}`}
      >
        {count}
      </span>
    </div>
  );
}

export function WorkSummarySidebar({ tasks }: Props) {
  const stats = computeTaskStats(tasks);
  const pct =
    stats.total > 0
      ? Math.round((stats.completedCount / stats.total) * 100)
      : 0;

  return (
    <aside className="rounded-xl border border-border bg-card p-4 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold text-sm text-foreground">
        <Bookmark size={15} className="text-primary" />
        Workspace Work Summary
      </h2>

      <div className="flex flex-col gap-2">
        <StatCard
          count={stats.overdueCount}
          label={`${stats.overdueCount} Overdue actions`}
          description="Attention required instantly"
          tone="destructive"
        />
        <StatCard
          count={stats.dueTodayCount}
          label={`${stats.dueTodayCount} Due today`}
          description="Complete before daily deadline"
          tone="warning"
        />
        <StatCard
          count={stats.dueThisWeekCount}
          label={`${stats.dueThisWeekCount} Due this week`}
          description="Regular backlog parameters"
          tone="info"
        />
        <StatCard
          count={stats.totalPending}
          label={`${stats.totalPending} Total pending tasks`}
          description="Central process log depth"
          tone="muted"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">
            Task Dispatch Resolution Rate
          </span>
          <span className="text-xs font-semibold text-foreground">
            {stats.completedCount} of {stats.total} tasks completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-2 rounded-full bg-primary transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {pct}% Weekly completion quota compliance
        </p>
      </div>
    </aside>
  );
}
