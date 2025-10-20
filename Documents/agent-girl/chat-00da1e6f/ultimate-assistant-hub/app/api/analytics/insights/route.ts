import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, subDays, isAfter, isBefore } from 'date-fns';
import { ProductivityInsights } from '@/types';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const insights = await generateProductivityInsights(user.id);

    return createSuccessResponse(insights);

  } catch (error) {
    return handleApiError(error);
  }
});

async function generateProductivityInsights(userId: string): Promise<ProductivityInsights> {
  const now = new Date();
  const lastWeek = subDays(now, 7);
  const lastMonth = subDays(now, 30);
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Calculate metrics for the last 30 days
  const [
    tasksCompleted,
    totalTasks,
    journalEntries,
    eventsAttended,
    emailsProcessed,
    totalEmails
  ] = await Promise.all([
    db.task.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: lastMonth }
      }
    }),
    db.task.count({
      where: {
        userId,
        createdAt: { gte: lastMonth }
      }
    }),
    db.journalEntry.count({
      where: {
        userId,
        createdAt: { gte: lastMonth }
      }
    }),
    db.calendarEvent.count({
      where: {
        userId,
        startTime: { gte: lastMonth, lte: now }
      }
    }),
    db.email.count({
      where: {
        userId,
        isRead: true,
        receivedAt: { gte: lastMonth }
      }
    }),
    db.email.count({
      where: {
        userId,
        receivedAt: { gte: lastMonth }
      }
    })
  ]);

  // Calculate trends
  const taskCompletionRate = totalTasks > 0 ? (tasksCompleted / totalTasks) * 100 : 0;
  const journalFrequency = Math.min(journalEntries / 30, 1) * 100; // Normalize to percentage
  const calendarUtilization = Math.min(eventsAttended / 20, 1) * 100; // Assuming 20 events is full utilization
  const emailResponseRate = totalEmails > 0 ? (emailsProcessed / totalEmails) * 100 : 0;

  // Calculate overall productivity score
  const overallScore = Math.round(
    taskCompletionRate * 0.3 +
    journalFrequency * 0.25 +
    calendarUtilization * 0.25 +
    emailResponseRate * 0.2
  );

  // Generate recommendations
  const recommendations = generateRecommendations({
    taskCompletionRate,
    journalFrequency,
    calendarUtilization,
    emailResponseRate,
    tasksCompleted,
    journalEntries,
    eventsAttended,
    emailsProcessed
  });

  // Calculate achievements
  const achievements = await calculateAchievements(userId, {
    tasksCompleted,
    journalEntries,
    eventsAttended,
    emailsProcessed
  });

  const insights: ProductivityInsights = {
    overallScore,
    trends: {
      taskCompletion: Math.round(taskCompletionRate),
      journalFrequency: Math.round(journalFrequency),
      calendarUtilization: Math.round(calendarUtilization),
      emailResponse: Math.round(emailResponseRate)
    },
    recommendations,
    achievements
  };

  return insights;
}

function generateRecommendations(metrics: {
  taskCompletionRate: number;
  journalFrequency: number;
  calendarUtilization: number;
  emailResponseRate: number;
  tasksCompleted: number;
  journalEntries: number;
  eventsAttended: number;
  emailsProcessed: number;
}): string[] {
  const recommendations: string[] = [];

  // Task completion recommendations
  if (metrics.taskCompletionRate < 50) {
    recommendations.push("Focus on completing high-priority tasks first. Consider breaking down large tasks into smaller, manageable steps.");
  } else if (metrics.taskCompletionRate < 80) {
    recommendations.push("Good progress on tasks! Try setting daily completion goals to maintain momentum.");
  }

  if (metrics.tasksCompleted < 10) {
    recommendations.push("Consider creating more specific, achievable tasks to boost your productivity.");
  }

  // Journal recommendations
  if (metrics.journalFrequency < 30) {
    recommendations.push("Try to journal more consistently. Even brief entries can help with self-awareness and emotional processing.");
  } else if (metrics.journalFrequency > 80) {
    recommendations.push("Excellent journaling habit! Your consistency supports personal growth and emotional intelligence.");
  }

  // Calendar recommendations
  if (metrics.calendarUtilization < 40) {
    recommendations.push("Your calendar seems underutilized. Consider scheduling important tasks and blocking time for deep work.");
  } else if (metrics.calendarUtilization > 90) {
    recommendations.push("Your calendar is quite full. Ensure you're leaving time for breaks and spontaneous activities.");
  }

  // Email recommendations
  if (metrics.emailResponseRate < 60) {
    recommendations.push("Try processing emails in batches at specific times to improve efficiency and reduce context switching.");
  }

  // Work-life balance recommendations
  if (metrics.eventsAttended > 30) {
    recommendations.push("You have many scheduled events. Ensure you're maintaining a healthy work-life balance.");
  }

  // Overall productivity recommendations
  if (metrics.tasksCompleted > 20 && metrics.journalEntries > 15) {
    recommendations.push("You're showing excellent productivity across multiple areas. Keep up the great work!");
  }

  if (recommendations.length === 0) {
    recommendations.push("You're maintaining a good balance across all areas. Continue your current productivity habits.");
  }

  return recommendations.slice(0, 5); // Limit to 5 recommendations
}

async function calculateAchievements(
  userId: string,
  metrics: {
    tasksCompleted: number;
    journalEntries: number;
    eventsAttended: number;
    emailsProcessed: number;
  }
) {
  const achievements: Array<{
    type: string;
    description: string;
    achievedAt: Date;
  }> = [];

  // Task achievements
  if (metrics.tasksCompleted >= 1) {
    achievements.push({
      type: 'task_completion',
      description: 'Completed your first task',
      achievedAt: new Date()
    });
  }

  if (metrics.tasksCompleted >= 10) {
    achievements.push({
      type: 'productivity',
      description: 'Completed 10+ tasks this month',
      achievedAt: new Date()
    });
  }

  if (metrics.tasksCompleted >= 25) {
    achievements.push({
      type: 'productivity',
      description: 'Task master - 25+ tasks completed',
      achievedAt: new Date()
    });
  }

  // Journal achievements
  if (metrics.journalEntries >= 7) {
    achievements.push({
      type: 'consistency',
      description: 'Journal champion - 7+ entries',
      achievedAt: new Date()
    });
  }

  if (metrics.journalEntries >= 20) {
    achievements.push({
      type: 'consistency',
      description: 'Dedicated journaler - 20+ entries',
      achievedAt: new Date()
    });
  }

  // Calendar achievements
  if (metrics.eventsAttended >= 15) {
    achievements.push({
      type: 'time_management',
      description: 'Calendar pro - 15+ events attended',
      achievedAt: new Date()
    });
  }

  // Email achievements
  if (metrics.emailsProcessed >= 50) {
    achievements.push({
      type: 'communication',
      description: 'Email wizard - 50+ emails processed',
      achievedAt: new Date()
    });
  }

  // Overall productivity achievements
  const overallProductivity = metrics.tasksCompleted + Math.floor(metrics.journalEntries / 2) + metrics.eventsAttended + Math.floor(metrics.emailsProcessed / 10);

  if (overallProductivity >= 50) {
    achievements.push({
      type: 'productivity',
      description: 'Productivity superstar - Excellent overall performance',
      achievedAt: new Date()
    });
  }

  // Check for streak-based achievements
  const streakAchievements = await checkStreakAchievements(userId);
  achievements.push(...streakAchievements);

  return achievements;
}

async function checkStreakAchievements(userId: string) {
  const achievements: Array<{
    type: string;
    description: string;
    achievedAt: Date;
  }> = [];

  const now = new Date();
  const last7Days = subDays(now, 7);

  // Check for journal streak
  const journalEntriesLast7Days = await db.journalEntry.findMany({
    where: {
      userId,
      createdAt: { gte: last7Days }
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' }
  });

  const uniqueJournalDays = new Set(
    journalEntriesLast7Days.map(entry => entry.createdAt.toDateString())
  ).size;

  if (uniqueJournalDays >= 7) {
    achievements.push({
      type: 'streak',
      description: '7-day journal streak!',
      achievedAt: new Date()
    });
  }

  // Check for task completion streak
  const completedTasksLast7Days = await db.task.findMany({
    where: {
      userId,
      status: 'COMPLETED',
      completedAt: { gte: last7Days }
    },
    select: { completedAt: true },
    orderBy: { completedAt: 'asc' }
  });

  const uniqueTaskDays = new Set(
    completedTasksLast7Days.map(task => task.completedAt!.toDateString())
  ).size;

  if (uniqueTaskDays >= 5) {
    achievements.push({
      type: 'streak',
      description: 'Productive week - 5+ days with completed tasks',
      achievedAt: new Date()
    });
  }

  return achievements;
}