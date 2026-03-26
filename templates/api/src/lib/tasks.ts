export const TASK_STATUSES = ["todo", "in_progress", "done", "cancelled"] as const;
export const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const SORTABLE_FIELDS = ["createdAt", "dueDate", "priority", "title"] as const;
export const SEARCHABLE_FIELDS = ["title", "description", "assignee"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export interface Task {
  id: string;
  data: {
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    assignee?: string;
    dueDate?: string;
    tags?: string;
    createdAt: string;
    completedAt?: string;
  };
}
