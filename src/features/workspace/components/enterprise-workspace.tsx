"use client";

import { useState } from "react";

import { CheckSquare, Home } from "lucide-react";

import { defaultTasks } from "../data/mock-tasks";
import { computeTaskStats } from "../lib/task-utils";
import { HomeAppsTab } from "./home-apps/home-apps-tab";
import { TasksTab } from "./tasks/tasks-tab";

type Tab = "home" | "tasks";

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home");

  const tasks = defaultTasks;
  const stats = computeTaskStats(tasks);
  const pendingCount = stats.totalPending;

  return (
    <div className="min-h-0 flex flex-col">
      {/* Tab bar */}
      <div className="border-b border-border sticky top-0 z-10">
        <div className="flex gap-1 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "home"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Home size={16} />
            Home &amp; Apps
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2.5 px-4 py-3.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckSquare size={16} />
            My Tasks Workspace
            {pendingCount > 0 && (
              <span className="flex items-center justify-center size-5 rounded-full bg-primary/15 text-primary text-xs font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {activeTab === "home" ? (
          <HomeAppsTab tasks={tasks} />
        ) : (
          <TasksTab tasks={tasks} />
        )}
      </div>
    </div>
  );
}
