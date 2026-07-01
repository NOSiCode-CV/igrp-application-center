"use client";

import { useState } from "react";

import type { Task, TaskStatus } from "../../types";
import { TaskRow } from "./task-row";

const TABS: { label: string; status: TaskStatus }[] = [
  { label: "Assigned to me", status: "assigned" },
  { label: "Candidate tasks", status: "candidate" },
  { label: "Created by me", status: "created" },
  { label: "Completed", status: "completed" },
];

type Props = { tasks: Task[]; roleScope: string };

export function TaskList({ tasks, roleScope }: Props) {
  const [activeTab, setActiveTab] = useState<TaskStatus>("assigned");
  const [filter, setFilter] = useState("");

  const counts: Record<TaskStatus, number> = {
    assigned: tasks.filter((t) => t.status === "assigned").length,
    candidate: tasks.filter((t) => t.status === "candidate").length,
    created: tasks.filter((t) => t.status === "created").length,
    completed: tasks.filter((t) => t.status === "completed").length,
  };

  const visible = tasks.filter((t) => {
    if (t.status !== activeTab) return false;
    if (!filter.trim()) return true;
    const q = filter.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.ticketCode.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 pt-4 pb-0">
        <h2 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          Process Workflow Center{" "}
          <span className="text-gray-400 dark:text-gray-500 font-normal">
            (My Work)
          </span>
        </h2>
        <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
          Role Scope: {roleScope}
        </span>
      </div>

      <div className="flex gap-0 border-b border-gray-200 dark:border-gray-700 px-4 mt-3 overflow-x-auto">
        {TABS.map(({ label, status }) => (
          <button
            key={status}
            type="button"
            onClick={() => setActiveTab(status)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
              activeTab === status
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            {label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                activeTab === status
                  ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
              }`}
            >
              {counts[status]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 p-4 border-b border-gray-100 dark:border-gray-800">
        <input
          type="search"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter task titles, workflow names, codes..."
          aria-label="Filter tasks"
          className="flex-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 max-h-[600px]">
        {visible.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400 dark:text-gray-500">
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
