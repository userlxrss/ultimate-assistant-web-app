import { format, differenceInDays, differenceInHours, differenceInMinutes, startOfDay, endOfDay, isThisWeek, subWeeks, subDays } from 'date-fns';

export const formatDate = (date: Date): string => {
  return format(date, 'MMM dd, yyyy');
};

export const formatShortDate = (date: Date): string => {
  return format(date, 'MMM dd');
};

export const formatTime = (date: Date): string => {
  return format(date, 'h:mm a');
};

export const formatDateTime = (date: Date): string => {
  return format(date, 'MMM dd, h:mm a');
};

export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const minutes = differenceInMinutes(now, date);
  const hours = differenceInHours(now, date);
  const days = differenceInDays(now, date);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
};

export const getCountdown = (date: Date): string => {
  const now = new Date();
  const days = differenceInDays(date, now);
  const hours = differenceInHours(date, now) % 24;
  const minutes = differenceInMinutes(date, now) % 60;

  if (days < 0) return 'Past';
  if (days === 0 && hours === 0 && minutes <= 0) return 'Now';
  if (days === 0 && hours === 0) return `${minutes}m`;
  if (days === 0) return `${hours}h ${minutes}m`;
  if (days <= 7) return `${days}d ${hours}h`;
  return `${days} days`;
};

export const calculateProductivityScore = (
  tasksCompleted: number,
  totalTasks: number,
  averageMood: number,
  journalEntries: number,
  days: number
): number => {
  const completionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 50;
  const moodScore = (averageMood / 10) * 100;
  const consistencyScore = Math.min((journalEntries / days) * 100, 100);

  return Math.round((completionRate * 0.5 + moodScore * 0.3 + consistencyScore * 0.2));
};

export const calculateMeetingLoad = (events: any[]): number => {
  const workHoursPerDay = 8;
  const workDaysPerWeek = 5;
  const totalWorkHours = workHoursPerDay * workDaysPerWeek;

  const thisWeekEvents = events.filter(event => isThisWeek(event.date));
  const totalMeetingHours = thisWeekEvents.reduce((sum, event) => sum + (event.duration / 60), 0);

  return Math.round((totalMeetingHours / totalWorkHours) * 100);
};

export const getWeekRange = (date: Date = new Date()) => {
  const start = startOfDay(date);
  const end = endOfDay(date);
  return { start, end };
};

export const getWeekData = (data: any[], dateField: string, weeksAgo: number = 0) => {
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    if (weeksAgo === 0) {
      return isThisWeek(itemDate);
    } else {
      const lastWeek = subWeeks(new Date(), 1);
      const startOfLastWeek = startOfDay(lastWeek);
      const endOfLastWeek = endOfDay(lastWeek);
      return itemDate >= startOfLastWeek && itemDate <= endOfLastWeek;
    }
  });
};

export const groupByDate = <T>(data: T[], dateField: keyof T): Record<string, T[]> => {
  return data.reduce((groups, item) => {
    const date = format(new Date(item[dateField] as Date), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {} as Record<string, T[]>);
};

export const calculateTrend = (current: number, previous: number): 'up' | 'down' | 'stable' => {
  const threshold = 0.05; // 5% threshold
  const change = (current - previous) / previous;

  if (Math.abs(change) < threshold) return 'stable';
  return change > 0 ? 'up' : 'down';
};

export const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
    default: return '→';
  }
};

export const getTrendColor = (trend: 'up' | 'down' | 'stable'): string => {
  switch (trend) {
    case 'up': return 'text-green-500';
    case 'down': return 'text-red-500';
    case 'stable': return 'text-gray-500';
    default: return 'text-gray-500';
  }
};

export { subDays };