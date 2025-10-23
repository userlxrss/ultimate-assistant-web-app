export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  category: string;
  workspace?: string;
  duration?: number; // in minutes
  subtasks: Subtask[];
  tags: string[];
  estimatedTime?: number; // in minutes
  actualTime?: number; // in minutes
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  reminder?: Date;
  attachments?: string[];
  dependencies?: string[]; // task IDs
  syncStatus: 'synced' | 'pending' | 'error';
  lastSyncAt?: Date;
  projectId?: string;
  assignee?: string;
  color?: string;
}

export interface TaskFilter {
  status?: Task['status'];
  priority?: Task['priority'];
  category?: string;
  dateRange?: 'today' | 'upcoming' | 'overdue' | 'week' | 'month' | 'no-date';
  search?: string;
  assignee?: string;
  project?: string;
}

export interface TaskStats {
  total: number;
  completed: number;
  overdue: number;
  dueToday: number;
  dueThisWeek: number;
  dueNextWeek: number;
  noDueDate: number;
  byPriority: Record<Task['priority'], number>;
  byStatus: Record<Task['status'], number>;
  completionRate: number;
  averageCompletionTime: number; // in hours
  totalEstimatedTime: number; // in hours
  totalActualTime: number; // in hours
}

export interface MotionAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
  message?: string;
}

export interface TaskOperation {
  type: 'create' | 'update' | 'delete' | 'complete' | 'bulk';
  taskId?: string;
  taskIds?: string[];
  data?: Partial<Task>;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'completed' | 'error';
  error?: string;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  title: string;
  color?: string;
}