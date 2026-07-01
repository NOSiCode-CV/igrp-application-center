import type { Task } from "../types";

export function getGreeting(now = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 19) return "Good afternoon";
  return "Good evening";
}

export type DueDateResult = {
  label: string;
  color: "red" | "amber" | "normal";
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDueDateLabel(
  dueDate: Date,
  now = new Date(),
): DueDateResult {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const abs = Math.abs(diffDays);
    return {
      label: abs === 1 ? "Overdue by 1 day" : `Overdue by ${abs} days`,
      color: "red",
    };
  }
  if (diffDays === 0) return { label: "Due today", color: "amber" };
  if (diffDays === 1) return { label: "Due tomorrow", color: "normal" };
  return { label: `Due in ${diffDays} days`, color: "normal" };
}

export type TaskStats = {
  overdueCount: number;
  dueTodayCount: number;
  dueThisWeekCount: number;
  totalPending: number;
  completedCount: number;
  total: number;
};

export function computeTaskStats(tasks: Task[]): TaskStats {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let overdueCount = 0;
  let dueTodayCount = 0;
  let dueThisWeekCount = 0;
  let totalPending = 0;
  let completedCount = 0;

  for (const task of tasks) {
    if (task.status === "completed") {
      completedCount++;
      continue;
    }
    totalPending++;
    // Trusts the static `priority` field rather than deriving from `dueDate` — fine for
    // hand-kept mock data, but a real task source should compute overdue from the date.
    if (task.priority === "OVERDUE") overdueCount++;
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);
    if (isSameDay(due, todayStart)) dueTodayCount++;
    if (due >= todayStart && due < weekEnd) dueThisWeekCount++;
  }

  return {
    overdueCount,
    dueTodayCount,
    dueThisWeekCount,
    totalPending,
    completedCount,
    total: tasks.length,
  };
}
