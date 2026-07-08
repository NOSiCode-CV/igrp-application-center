"use client";

import { useMemo, useState } from "react";

import {
  IGRPDropdownMenu,
  IGRPDropdownMenuContent,
  IGRPDropdownMenuRadioGroup,
  IGRPDropdownMenuRadioItem,
  IGRPDropdownMenuTrigger,
} from "@igrp/igrp-framework-react-design-system";
import { ChevronDown } from "lucide-react";

import type { Priority, Task, TaskStatus } from "../../types";
import { TaskRow } from "./task-row";

const TABS: { label: string; status: TaskStatus }[] = [
  { label: "Assigned to me", status: "assigned" },
  { label: "Candidate tasks", status: "candidate" },
  { label: "Created by me", status: "created" },
  { label: "Completed", status: "completed" },
];

const ALL_PROCESSES = "all";
type ProcessFilter = typeof ALL_PROCESSES | string;

const PRIORITY_ORDER: Record<Priority, number> = {
  OVERDUE: 0,
  HIGH: 1,
  MEDIUM: 2,
  NORMAL: 3,
};

type SortBy = "none" | "priority";
const SORT_LABELS: Record<SortBy, string> = {
  none: "Unsorted Priority",
  priority: "Sort: Priority",
};

type Props = { tasks: Task[]; roleScope: string };

export function TaskList({ tasks, roleScope }: Props) {
  const [activeTab, setActiveTab] = useState<TaskStatus>("assigned");
  const [filter, setFilter] = useState("");
  const [processFilter, setProcessFilter] =
    useState<ProcessFilter>(ALL_PROCESSES);
  const [sortBy, setSortBy] = useState<SortBy>("none");

  const processes = useMemo(
    () => Array.from(new Set(tasks.map((t) => t.category))).sort(),
    [tasks],
  );

  const counts: Record<TaskStatus, number> = {
    assigned: tasks.filter((t) => t.status === "assigned").length,
    candidate: tasks.filter((t) => t.status === "candidate").length,
    created: tasks.filter((t) => t.status === "created").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const visible = useMemo(() => {
    let list = tasks.filter((t) => {
      if (t.status !== activeTab) return false;
      if (processFilter !== ALL_PROCESSES && t.category !== processFilter) {
        return false;
      }
      if (!filter.trim()) return true;
      const q = filter.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.ticketCode.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
    if (sortBy === "priority") {
      list = [...list].sort(
        (a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority],
      );
    }
    return list;
  }, [tasks, activeTab, processFilter, filter, sortBy]);

  return (
    <div className="rounded-xl border border-border bg-card flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <h2 className="font-semibold text-sm text-foreground">
          Process Workflow Center{" "}
          <span className="text-muted-foreground font-normal">
            (My Work)
          </span>
        </h2>
        <span className="font-mono text-xs text-muted-foreground">
          Role Scope: {roleScope}
        </span>
      </div>

      <div className="flex gap-0 border-b border-border px-4 mt-3 overflow-x-auto">
        {TABS.map(({ label, status }) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveTab(status)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === status
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === status
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-4 border-b border-border">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter task titles, workflow names, codes..."
          aria-label="Filter tasks"
          className="flex-1 min-w-[200px] rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <IGRPDropdownMenu>
          <IGRPDropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {processFilter === ALL_PROCESSES
                ? "All Processes"
                : processFilter}
              <ChevronDown size={14} />
            </button>
          </IGRPDropdownMenuTrigger>
          <IGRPDropdownMenuContent align="start">
            <IGRPDropdownMenuRadioGroup
              value={processFilter}
              onValueChange={(value) => setProcessFilter(value)}
            >
              <IGRPDropdownMenuRadioItem value={ALL_PROCESSES}>
                All Processes
              </IGRPDropdownMenuRadioItem>
              {processes.map((process) => (
                <IGRPDropdownMenuRadioItem key={process} value={process}>
                  {process}
                </IGRPDropdownMenuRadioItem>
              ))}
            </IGRPDropdownMenuRadioGroup>
          </IGRPDropdownMenuContent>
        </IGRPDropdownMenu>

        <IGRPDropdownMenu>
          <IGRPDropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-3 py-1.5 text-xs text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {SORT_LABELS[sortBy]}
              <ChevronDown size={14} />
            </button>
          </IGRPDropdownMenuTrigger>
          <IGRPDropdownMenuContent align="start">
            <IGRPDropdownMenuRadioGroup
              value={sortBy}
              onValueChange={(value) => setSortBy(value as SortBy)}
            >
              <IGRPDropdownMenuRadioItem value="none">
                Unsorted Priority
              </IGRPDropdownMenuRadioItem>
              <IGRPDropdownMenuRadioItem value="priority">
                Sort: Priority
              </IGRPDropdownMenuRadioItem>
            </IGRPDropdownMenuRadioGroup>
          </IGRPDropdownMenuContent>
        </IGRPDropdownMenu>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-muted max-h-[600px]">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {filter
              ? "No tasks match your filter."
              : "No tasks in this category."}
          </div>
        ) : (
          visible.map((task) => <TaskRow key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}
