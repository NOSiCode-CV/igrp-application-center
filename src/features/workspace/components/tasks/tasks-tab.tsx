"use client"

import { useCurrentUserActiveRole } from "@/features/users/use-users"
import type { Task } from "../../types"
import { TaskList } from "./task-list"
import { WorkSummarySidebar } from "./work-summary-sidebar"

type Props = { tasks: Task[] }

export function TasksTab({ tasks }: Props) {
  const { data: activeRole } = useCurrentUserActiveRole()
  const roleScope = activeRole?.roleCode ?? "staff"

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <TaskList tasks={tasks} roleScope={roleScope} />
      <WorkSummarySidebar tasks={tasks} />
    </div>
  )
}
