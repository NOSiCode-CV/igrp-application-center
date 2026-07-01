import { Bookmark } from "lucide-react"
import { computeTaskStats } from "../../lib/task-utils"
import type { Task } from "../../types"

type Props = { tasks: Task[] }

type StatCardProps = {
  count: number
  label: string
  description: string
  accentClass: string
  bgClass: string
  badgeClass: string
}

function StatCard({
  count,
  label,
  description,
  accentClass,
  bgClass,
  badgeClass,
}: StatCardProps) {
  return (
    <div
      className={`rounded-lg p-3 flex items-center justify-between border-l-4 ${accentClass} ${bgClass}`}
    >
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
          {label}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {description}
        </p>
      </div>
      <span className={`rounded-full px-2.5 py-1 text-sm font-bold ${badgeClass}`}>
        {count}
      </span>
    </div>
  )
}

export function WorkSummarySidebar({ tasks }: Props) {
  const stats = computeTaskStats(tasks)
  const pct =
    stats.total > 0
      ? Math.round((stats.completedCount / stats.total) * 100)
      : 0

  return (
    <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 flex flex-col gap-4">
      <h2 className="flex items-center gap-2 font-semibold text-sm text-gray-800 dark:text-gray-200">
        <Bookmark size={15} className="text-indigo-600 dark:text-indigo-400" />
        Workspace Work Summary
      </h2>

      <div className="flex flex-col gap-2">
        <StatCard
          count={stats.overdueCount}
          label={`${stats.overdueCount} Overdue actions`}
          description="Attention required instantly"
          accentClass="border-red-500"
          bgClass="bg-red-50 dark:bg-red-950"
          badgeClass="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300"
        />
        <StatCard
          count={stats.dueTodayCount}
          label={`${stats.dueTodayCount} Due today`}
          description="Complete before daily deadline"
          accentClass="border-amber-500"
          bgClass="bg-amber-50 dark:bg-amber-950"
          badgeClass="bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          count={stats.dueThisWeekCount}
          label={`${stats.dueThisWeekCount} Due this week`}
          description="Regular backlog parameters"
          accentClass="border-blue-500"
          bgClass="bg-blue-50 dark:bg-blue-950"
          badgeClass="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
        />
        <StatCard
          count={stats.totalPending}
          label={`${stats.totalPending} Total pending tasks`}
          description="Central process log depth"
          accentClass="border-gray-300 dark:border-gray-600"
          bgClass="bg-gray-50 dark:bg-gray-800"
          badgeClass="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Task Dispatch Resolution Rate
          </span>
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            {stats.completedCount} of {stats.total} tasks completed
          </span>
        </div>
        <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">
          {pct}% Weekly completion quota compliance
        </p>
      </div>
    </aside>
  )
}
