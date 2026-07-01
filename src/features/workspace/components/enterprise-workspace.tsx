"use client";

import { CheckSquare, Home } from "lucide-react";
import { useState } from "react";
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
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 sticky top-0 z-10">
        <div className="flex gap-0 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "home"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <Home size={15} />
            Home &amp; Apps
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "tasks"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            <CheckSquare size={15} />
            My Tasks Workspace
            {pendingCount > 0 && (
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-1.5 py-0.5 leading-none">
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
