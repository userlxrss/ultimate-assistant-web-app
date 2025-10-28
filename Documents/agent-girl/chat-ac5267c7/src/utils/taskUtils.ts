import { Task, TaskFilter, TaskStats, Subtask, TimeBlock } from '../types/tasks';

// Helper function to safely convert date strings to Date objects
export const toDate = (date?: Date | string): Date | undefined => {
  if (!date) return undefined;

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? undefined : date;
  }

  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? undefined : parsedDate;
};

// Helper function to safely format any date input
export const safeFormatDate = (date?: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const dateObj = toDate(date);
  if (!dateObj) return 'Invalid date';

  return dateObj.toLocaleDateString('en-US', options);
};

// Generate dummy tasks with realistic data
export const generateDummyTasks = (): Task[] => {
  const now = new Date();
  const tasks: Task[] = [];

  // Categories for tasks
  const categories = [
    'Work', 'Personal', 'Health', 'Learning', 'Finance',
    'Shopping', 'Home', 'Creative', 'Social', 'Admin'
  ];

  // Workspaces
  const workspaces = [
    'Office', 'Home Office', 'Remote', 'Client Site', 'On the Go'
  ];

  // Sample task titles
  const taskTitles = [
    'Complete project proposal',
    'Review quarterly reports',
    'Team meeting preparation',
    'Update documentation',
    'Client presentation',
    'Code review',
    'Budget planning',
    'Market research',
    'Design mockups',
    'Database optimization',
    'Email campaign',
    'Social media posts',
    'Website updates',
    'Performance review',
    'Strategic planning',
    'Vendor negotiations',
    'Training session',
    'Quality assurance',
    'Bug fixes',
    'Feature development',
    'Content creation',
    'Data analysis',
    'User research',
    'Security audit',
    'System maintenance'
  ];

  // Generate 3 overdue tasks
  for (let i = 0; i < 3; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() - Math.floor(Math.random() * 5) - 1);

    tasks.push({
      id: `task-overdue-${i + 1}`,
      title: taskTitles[i],
      description: `Overdue task that needs immediate attention`,
      completed: false,
      createdAt: new Date(dueDate.getTime() - 24 * 60 * 60 * 1000 * Math.floor(Math.random() * 3 + 1)),
      dueDate,
      priority: ['high', 'urgent', 'medium'][Math.floor(Math.random() * 3)] as Task['priority'],
      status: 'pending',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 120) + 30,
      subtasks: generateSubtasks(Math.floor(Math.random() * 3)),
      tags: ['overdue', 'important'],
      estimatedTime: Math.floor(Math.random() * 180) + 30,
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000))
    });
  }

  // Generate 5 tasks due today
  for (let i = 0; i < 5; i++) {
    const dueDate = new Date(now);
    dueDate.setHours(dueDate.getHours() + Math.floor(Math.random() * 8) + 1);

    tasks.push({
      id: `task-today-${i + 1}`,
      title: taskTitles[3 + i],
      description: `Task scheduled for today`,
      completed: false,
      createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 24)),
      dueDate,
      priority: ['medium', 'high', 'low', 'high', 'medium'][i] as Task['priority'],
      status: i === 0 ? 'in-progress' : 'pending',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 90) + 15,
      subtasks: generateSubtasks(Math.floor(Math.random() * 4)),
      tags: ['today', 'scheduled'],
      estimatedTime: Math.floor(Math.random() * 120) + 15,
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000))
    });
  }

  // Generate 10 tasks due this week
  for (let i = 0; i < 10; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1);

    tasks.push({
      id: `task-week-${i + 1}`,
      title: taskTitles[8 + i],
      description: `Task scheduled for this week`,
      completed: false,
      createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 48)),
      dueDate,
      priority: ['low', 'medium', 'high', 'medium', 'low', 'high', 'medium', 'low', 'high', 'medium'][i] as Task['priority'],
      status: 'pending',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 150) + 20,
      subtasks: generateSubtasks(Math.floor(Math.random() * 5)),
      tags: ['week', 'planned'],
      estimatedTime: Math.floor(Math.random() * 200) + 20,
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 2))
    });
  }

  // Generate 5 tasks due next week
  for (let i = 0; i < 5; i++) {
    const dueDate = new Date(now);
    dueDate.setDate(dueDate.getDate() + 8 + Math.floor(Math.random() * 7));

    tasks.push({
      id: `task-next-week-${i + 1}`,
      title: taskTitles[18 + i],
      description: `Task scheduled for next week`,
      completed: false,
      createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 24)),
      dueDate,
      priority: ['low', 'medium', 'low', 'high', 'medium'][i] as Task['priority'],
      status: 'pending',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 100) + 25,
      subtasks: generateSubtasks(Math.floor(Math.random() * 3)),
      tags: ['next-week', 'planned'],
      estimatedTime: Math.floor(Math.random() * 150) + 25,
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 3))
    });
  }

  // Generate 2 tasks with no due date
  for (let i = 0; i < 2; i++) {
    tasks.push({
      id: `task-no-date-${i + 1}`,
      title: taskTitles[23 + i],
      description: `Backlog task with no specific due date`,
      completed: false,
      createdAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 48)),
      priority: ['low', 'medium'][i] as Task['priority'],
      status: 'pending',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 60) + 30,
      subtasks: generateSubtasks(Math.floor(Math.random() * 2)),
      tags: ['backlog', 'no-deadline'],
      estimatedTime: Math.floor(Math.random() * 90) + 30,
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 4))
    });
  }

  // Generate 15 completed tasks
  for (let i = 0; i < 15; i++) {
    const completedAt = new Date(now.getTime() - Math.floor(Math.random() * 3600000 * 24 * 30));
    const createdAt = new Date(completedAt.getTime() - Math.floor(Math.random() * 3600000 * 24 * 7));
    const dueDate = new Date(completedAt.getTime() + Math.floor(Math.random() * 3600000 * 24));

    tasks.push({
      id: `task-completed-${i + 1}`,
      title: `Completed task ${i + 1}: ${taskTitles[Math.floor(Math.random() * taskTitles.length)]}`,
      description: `Successfully completed task`,
      completed: true,
      createdAt,
      completedAt,
      dueDate: dueDate > now ? undefined : dueDate,
      priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as Task['priority'],
      status: 'completed',
      category: categories[Math.floor(Math.random() * categories.length)],
      workspace: workspaces[Math.floor(Math.random() * workspaces.length)],
      duration: Math.floor(Math.random() * 120) + 15,
      subtasks: generateSubtasks(Math.floor(Math.random() * 4), true),
      tags: ['completed'],
      estimatedTime: Math.floor(Math.random() * 120) + 15,
      actualTime: Math.floor(Math.random() * 140) + 10,
      syncStatus: 'synced',
      lastSyncAt: completedAt
    });
  }

  return tasks;
};

// Generate subtasks
const generateSubtasks = (count: number, completed: boolean = false): Subtask[] => {
  const subtasks: Subtask[] = [];
  const subtaskTitles = [
    'Research phase',
    'Draft outline',
    'Review and edit',
    'Final approval',
    'Documentation',
    'Testing',
    'Implementation'
  ];

  for (let i = 0; i < count; i++) {
    subtasks.push({
      id: `subtask-${Date.now()}-${i}`,
      title: subtaskTitles[Math.floor(Math.random() * subtaskTitles.length)],
      completed: completed || Math.random() > 0.6,
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 3600000 * 24))
    });
  }

  return subtasks;
};

// Filter tasks based on filter criteria
export const filterTasks = (tasks: Task[], filter: TaskFilter): Task[] => {
  return tasks.filter(task => {
    // Status filter
    if (filter.status && task.status !== filter.status) {
      return false;
    }

    // Priority filter
    if (filter.priority && task.priority !== filter.priority) {
      return false;
    }

    // Category filter
    if (filter.category && task.category !== filter.category) {
      return false;
    }

    // Date range filter
    if (filter.dateRange) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const monthEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      const dueDate = toDate(task.dueDate);
      if (!dueDate) {
        return filter.dateRange === 'no-date';
      }

      switch (filter.dateRange) {
        case 'today':
          if (dueDate < today || dueDate >= tomorrow) return false;
          break;
        case 'overdue':
          if (dueDate >= today) return false;
          break;
        case 'upcoming':
          if (dueDate < tomorrow) return false;
          break;
        case 'week':
          if (dueDate < today || dueDate >= weekEnd) return false;
          break;
        case 'month':
          if (dueDate < today || dueDate >= monthEnd) return false;
          break;
      }
    }

    // Search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(searchLower);
      const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
      const tagMatch = task.tags.some(tag => tag.toLowerCase().includes(searchLower));

      if (!titleMatch && !descriptionMatch && !tagMatch) {
        return false;
      }
    }

    // Assignee filter
    if (filter.assignee && task.assignee !== filter.assignee) {
      return false;
    }

    // Project filter
    if (filter.project && task.projectId !== filter.project) {
      return false;
    }

    return true;
  });
};

// Calculate task statistics
export const calculateTaskStats = (tasks: Task[]): TaskStats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextWeekEnd = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

  const completed = tasks.filter(task => task.completed);
  const incomplete = tasks.filter(task => !task.completed);

  const overdue = incomplete.filter(task => {
    const dueDate = toDate(task.dueDate);
    return dueDate && dueDate < today;
  });

  const dueToday = incomplete.filter(task => {
    const dueDate = toDate(task.dueDate);
    return dueDate && dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  });

  const dueThisWeek = incomplete.filter(task => {
    const dueDate = toDate(task.dueDate);
    return dueDate && dueDate >= today && dueDate < weekEnd;
  });

  const dueNextWeek = incomplete.filter(task => {
    const dueDate = toDate(task.dueDate);
    return dueDate && dueDate >= weekEnd && dueDate < nextWeekEnd;
  });

  const noDueDate = incomplete.filter(task => !task.dueDate);

  // Calculate by priority
  const byPriority = {
    low: incomplete.filter(task => task.priority === 'low').length,
    medium: incomplete.filter(task => task.priority === 'medium').length,
    high: incomplete.filter(task => task.priority === 'high').length,
    urgent: incomplete.filter(task => task.priority === 'urgent').length,
  };

  // Calculate by status
  const byStatus = {
    pending: tasks.filter(task => task.status === 'pending').length,
    'in-progress': tasks.filter(task => task.status === 'in-progress').length,
    completed: tasks.filter(task => task.status === 'completed').length,
    cancelled: tasks.filter(task => task.status === 'cancelled').length,
  };

  // Calculate completion rate
  const completionRate = tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0;

  // Calculate average completion time
  const completedTasks = tasks.filter(task => {
    const createdAt = toDate(task.createdAt);
    const completedAt = toDate(task.completedAt);
    return task.completed && createdAt && completedAt;
  });
  const averageCompletionTime = completedTasks.length > 0
    ? completedTasks.reduce((sum, task) => {
        const createdAt = toDate(task.createdAt)!;
        const completedAt = toDate(task.completedAt)!;
        const time = (completedAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
        return sum + time;
      }, 0) / completedTasks.length
    : 0;

  // Calculate total estimated and actual time
  const totalEstimatedTime = tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0) / 60;
  const totalActualTime = tasks.reduce((sum, task) => sum + (task.actualTime || 0), 0) / 60;

  return {
    total: tasks.length,
    completed: completed.length,
    overdue: overdue.length,
    dueToday: dueToday.length,
    dueThisWeek: dueThisWeek.length,
    dueNextWeek: dueNextWeek.length,
    noDueDate: noDueDate.length,
    byPriority,
    byStatus,
    completionRate,
    averageCompletionTime,
    totalEstimatedTime,
    totalActualTime
  };
};

// Format task due date for display
export const formatDueDate = (date?: Date | string): string => {
  if (!date) return 'No due date';

  // Convert string to Date if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Check if the date is invalid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const taskDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

  if (taskDate < today) {
    return `Overdue (${dateObj.toLocaleDateString()})`;
  } else if (taskDate.getTime() === today.getTime()) {
    return `Today at ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (taskDate.getTime() === tomorrow.getTime()) {
    return `Tomorrow at ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Get priority color
export const getPriorityColor = (priority: Task['priority']): string => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    case 'high':
      return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'medium':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 'low':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default:
      return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800';
  }
};

// Generate time blocks for visualization
export const generateTimeBlocks = (tasks: Task[]): TimeBlock[] => {
  const blocks: TimeBlock[] = [];
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Sort tasks by due date and priority
  const sortedTasks = tasks
    .filter(task => {
      if (task.completed) return false;
      const dueDate = toDate(task.dueDate);
      return dueDate && dueDate >= today;
    })
    .sort((a, b) => {
      // Sort by priority first
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Then by due date
      const aDueDate = toDate(a.dueDate)!;
      const bDueDate = toDate(b.dueDate)!;
      return aDueDate.getTime() - bDueDate.getTime();
    });

  let currentTime = new Date(today.getTime() + 9 * 60 * 60 * 1000); // Start at 9 AM

  sortedTasks.forEach(task => {
    if (currentTime.getHours() >= 17) return; // Stop after 5 PM

    const duration = task.duration || 60;
    const endTime = new Date(currentTime.getTime() + duration * 60 * 1000);

    blocks.push({
      id: `block-${task.id}`,
      taskId: task.id,
      startTime: currentTime,
      endTime,
      title: task.title,
      color: task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'orange' : task.priority === 'medium' ? 'yellow' : 'green'
    });

    currentTime = new Date(endTime.getTime() + 15 * 60 * 1000); // 15 minute break
  });

  return blocks;
};