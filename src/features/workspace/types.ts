export type Priority = 'HIGH' | 'MEDIUM' | 'NORMAL' | 'OVERDUE'
export type TaskStatus = 'assigned' | 'candidate' | 'created' | 'completed'

export type Task = {
  id: string
  ticketCode: string
  category: string
  title: string
  requester: string
  submittedAt: Date
  attachmentCount: number
  priority: Priority
  dueDate: Date
  status: TaskStatus
}

export type DemoState = 'default' | 'empty' | 'overdue-heavy'
