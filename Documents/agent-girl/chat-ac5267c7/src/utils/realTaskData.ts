import { Task } from '../types/tasks';

// 🎯 REALISTIC TASK DATA based on typical productivity workflows
export const generateRealTasks = (): Task[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  return [
    // 🚀 High Priority Tasks - Today
    {
      id: 'real-1',
      title: 'Review and respond to priority emails',
      description: 'Go through inbox and respond to urgent client inquiries and team requests',
      completed: false,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      dueDate: new Date(today.getTime() + 2 * 60 * 60 * 1000), // Due in 2 hours
      priority: 'urgent',
      status: 'in-progress',
      category: 'Communication',
      workspace: 'main',
      duration: 45,
      subtasks: [
        { id: 'sub-1-1', title: 'Client follow-ups', completed: false },
        { id: 'sub-1-2', title: 'Team coordination', completed: true },
        { id: 'sub-1-3', title: 'Calendar updates', completed: false }
      ],
      tags: ['email', 'clients', 'urgent'],
      estimatedTime: 45,
      recurrence: 'daily',
      reminder: new Date(today.getTime() + 1.5 * 60 * 60 * 1000), // 1.5 hours from now
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 30 * 60 * 1000)
    },
    {
      id: 'real-2',
      title: 'Complete project proposal for new client',
      description: 'Finalize and send the Q4 project proposal to the prospective client',
      completed: false,
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 4 * 60 * 60 * 1000), // Due in 4 hours
      priority: 'high',
      status: 'in-progress',
      category: 'Sales',
      workspace: 'main',
      duration: 90,
      subtasks: [
        { id: 'sub-2-1', title: 'Review budget estimates', completed: false },
        { id: 'sub-2-2', title: 'Add timeline details', completed: false },
        { id: 'sub-2-3', title: 'Proofread final version', completed: false }
      ],
      tags: ['proposal', 'sales', 'client'],
      estimatedTime: 90,
      recurrence: 'none',
      reminder: new Date(today.getTime() + 3 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 15 * 60 * 1000)
    },
    {
      id: 'real-3',
      title: 'Team standup meeting preparation',
      description: 'Prepare updates and blockers for today\'s team standup',
      completed: true,
      createdAt: new Date(now.getTime() - 8 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() - 1 * 60 * 60 * 1000), // Was due 1 hour ago
      priority: 'high',
      status: 'completed',
      category: 'Meetings',
      workspace: 'main',
      duration: 15,
      subtasks: [],
      tags: ['meeting', 'team', 'daily'],
      estimatedTime: 15,
      recurrence: 'daily',
      reminder: new Date(today.getTime() - 2 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 90 * 60 * 1000)
    },

    // 📅 Medium Priority Tasks - This Week
    {
      id: 'real-4',
      title: 'Update project documentation',
      description: 'Update technical documentation for the current sprint deliverables',
      completed: false,
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000), // Due in 3 days
      priority: 'medium',
      status: 'pending',
      category: 'Documentation',
      workspace: 'main',
      duration: 60,
      subtasks: [
        { id: 'sub-4-1', title: 'API documentation updates', completed: false },
        { id: 'sub-4-2', title: 'User guide revisions', completed: false }
      ],
      tags: ['documentation', 'technical', 'sprint'],
      estimatedTime: 60,
      recurrence: 'weekly',
      reminder: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 2 * 60 * 60 * 1000)
    },
    {
      id: 'real-5',
      title: 'Code review for feature branch',
      description: 'Review pull requests from team members and provide feedback',
      completed: false,
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000), // Due tomorrow
      priority: 'medium',
      status: 'pending',
      category: 'Development',
      workspace: 'main',
      duration: 45,
      subtasks: [
        { id: 'sub-5-1', title: 'Review authentication changes', completed: false },
        { id: 'sub-5-2', title: 'Check UI component updates', completed: false }
      ],
      tags: ['code-review', 'development', 'team'],
      estimatedTime: 45,
      recurrence: 'none',
      reminder: new Date(today.getTime() + 20 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
    },
    {
      id: 'real-6',
      title: 'Schedule performance reviews',
      description: 'Coordinate with team members to schedule Q1 performance reviews',
      completed: false,
      createdAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000), // Due in 2 days
      priority: 'medium',
      status: 'pending',
      category: 'HR',
      workspace: 'main',
      duration: 30,
      subtasks: [
        { id: 'sub-6-1', title: 'Send calendar invites', completed: false },
        { id: 'sub-6-2', title: 'Prepare review templates', completed: true }
      ],
      tags: ['hr', 'performance', 'planning'],
      estimatedTime: 30,
      recurrence: 'quarterly',
      reminder: new Date(today.getTime() + 1.5 * 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 30 * 60 * 1000)
    },

    // 📋 Low Priority Tasks - Future
    {
      id: 'real-7',
      title: 'Organize digital files and folders',
      description: 'Clean up and organize project files for better structure',
      completed: false,
      createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      dueDate: nextWeek,
      priority: 'low',
      status: 'pending',
      category: 'Organization',
      workspace: 'main',
      duration: 60,
      subtasks: [
        { id: 'sub-7-1', title: 'Archive old projects', completed: false },
        { id: 'sub-7-2', title: 'Create folder structure', completed: false }
      ],
      tags: ['organization', 'cleanup', 'maintenance'],
      estimatedTime: 60,
      recurrence: 'monthly',
      reminder: new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 4 * 60 * 60 * 1000)
    },
    {
      id: 'real-8',
      title: 'Research new development tools',
      description: 'Evaluate and research new tools that could improve team productivity',
      completed: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      dueDate: nextMonth,
      priority: 'low',
      status: 'pending',
      category: 'Research',
      workspace: 'main',
      duration: 120,
      subtasks: [
        { id: 'sub-8-1', title: 'Research testing frameworks', completed: false },
        { id: 'sub-8-2', title: 'Compare CI/CD tools', completed: false },
        { id: 'sub-8-3', title: 'Prepare recommendation report', completed: false }
      ],
      tags: ['research', 'tools', 'productivity'],
      estimatedTime: 120,
      recurrence: 'none',
      reminder: new Date(nextMonth.getTime() - 7 * 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 24 * 60 * 60 * 1000)
    },

    // 🎯 Special Project Tasks
    {
      id: 'real-9',
      title: 'Plan team building event',
      description: 'Organize quarterly team building activity for remote team',
      completed: false,
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000), // Due in 2 weeks
      priority: 'medium',
      status: 'pending',
      category: 'Team',
      workspace: 'main',
      duration: 90,
      subtasks: [
        { id: 'sub-9-1', title: 'Survey team preferences', completed: true },
        { id: 'sub-9-2', title: 'Book venue/activity', completed: false },
        { id: 'sub-9-3', title: 'Send invitations', completed: false }
      ],
      tags: ['team', 'planning', 'event'],
      estimatedTime: 90,
      recurrence: 'quarterly',
      reminder: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 12 * 60 * 60 * 1000)
    },
    {
      id: 'real-10',
      title: 'Update personal portfolio website',
      description: 'Add recent projects and update skills section on personal portfolio',
      completed: false,
      createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      dueDate: new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000), // Due in 3 weeks
      priority: 'low',
      status: 'pending',
      category: 'Personal',
      workspace: 'personal',
      duration: 120,
      subtasks: [
        { id: 'sub-10-1', title: 'Update project screenshots', completed: false },
        { id: 'sub-10-2', title: 'Write project descriptions', completed: false },
        { id: 'sub-10-3', title: 'Test responsive design', completed: false }
      ],
      tags: ['portfolio', 'personal', 'development'],
      estimatedTime: 120,
      recurrence: 'none',
      reminder: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000),
      syncStatus: 'synced',
      lastSyncAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    }
  ];
};

// 🎯 Get tasks by priority for quick access
export const getTasksByPriority = () => {
  const tasks = generateRealTasks();
  return {
    urgent: tasks.filter(t => t.priority === 'urgent'),
    high: tasks.filter(t => t.priority === 'high'),
    medium: tasks.filter(t => t.priority === 'medium'),
    low: tasks.filter(t => t.priority === 'low')
  };
};

// 📅 Get tasks due today
export const getTodayTasks = () => {
  const tasks = generateRealTasks();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return tasks.filter(task => {
    if (!task.dueDate) return false;
    const dueDate = new Date(task.dueDate);
    return dueDate >= today && dueDate < tomorrow;
  });
};

// 📊 Get task statistics
export const getTaskStats = () => {
  const tasks = generateRealTasks();
  return {
    total: tasks.length,
    completed: tasks.filter(t => t.completed).length,
    pending: tasks.filter(t => !t.completed).length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < new Date()).length,
    dueToday: getTodayTasks().length
  };
};