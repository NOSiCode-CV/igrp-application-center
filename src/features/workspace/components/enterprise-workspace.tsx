"use client"

import { CheckSquare, ChevronDown, Home, LayoutDashboard } from "lucide-react"
import { useState } from "react"
import {
  defaultTasks,
  emptyTasks,
  overdueHeavyTasks,
} from "../data/mock-tasks"
import { computeTaskStats } from "../lib/task-utils"
import type { DemoState, Task } from "../types"
import { HomeAppsTab } from "./home-apps/home-apps-tab"
import { TasksTab } from "./tasks/tasks-tab"

type Tab = "home" | "tasks"

const DEMO_STATES: { value: DemoState; label: string; tasks: Task[] }[] = [
  { value: "default", label: "Default", tasks: defaultTasks },
  { value: "empty", label: "Empty state", tasks: emptyTasks },
  { value: "overdue-heavy", label: "Heavy overdue", tasks: overdueHeavyTasks },
]

export function EnterpriseWorkspace() {
  const [activeTab, setActiveTab] = useState<Tab>("home")
  const [demoState, setDemoState] = useState<DemoState>("default")
  const [demoMenuOpen, setDemoMenuOpen] = useState(false)

  const tasks = DEMO_STATES.find((s) => s.value === demoState)?.tasks ?? defaultTasks
  const stats = computeTaskStats(tasks)
  const pendingCount = stats.totalPending

  return (
    <div className="relative min-h-0 flex flex-col">
      {/* Tab bar */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="flex gap-0 px-4 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap ${
              activeTab === "home"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
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
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <CheckSquare size={15} />
            My Tasks Workspace
            {pendingCount > 0 && (
              <span className="rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold px-1.5 py-0.5 leading-none">
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

      {/* Demo States Menu — fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {demoMenuOpen && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-2 w-48 flex flex-col gap-1">
            {DEMO_STATES.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => {
                  setDemoState(s.value)
                  setDemoMenuOpen(false)
                }}
                className={`w-full text-left rounded-lg px-3 py-2 text-sm transition-colors ${
                  demoState === s.value
                    ? "bg-indigo-50 text-indigo-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setDemoMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full bg-gray-900 text-white px-4 py-2 shadow-lg text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <LayoutDashboard size={14} />
          Demo States Menu
          <ChevronDown
            size={13}
            className={`transition-transform ${demoMenuOpen ? "rotate-180" : ""}`}
          />
        </button>
      </div>
    </div>
  )
}
