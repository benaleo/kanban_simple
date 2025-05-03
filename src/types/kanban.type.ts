export interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: Date;
  start_task?: Date | null;
  end_task?: Date | null;
  project_id: string;
}

export interface Column {
  id: string
  name: string
  project_id: string
  created_at: Date
  order: number
}

export interface DragItem {
  task: Task
  fromColumnId: string
}

export interface NewTask {
  title: string
  description: string
  status: string
  project_id: string
}

export interface EditingTask extends NewTask {
  id: string
  title: string
  description: string
  status: string
  start_task?: string
  end_task?: string
  start_task_date?: string
  start_task_time?: string
  end_task_date?: string
  end_task_time?: string
  assignedUsers: { id: string, email: string }[]
}