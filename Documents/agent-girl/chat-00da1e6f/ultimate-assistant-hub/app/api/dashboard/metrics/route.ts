import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { DashboardMetrics } from '@/types';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastWeekStart = subDays(weekStart, 7);

    // Tasks Summary
    const [
      totalTasks,
      completedTasks,
      inProgressTasks,
      overdueTasks
    ] = await Promise.all([
      db.task.count({ where: { userId: user.id } }),
      db.task.count({ where: { userId: user.id, status: 'COMPLETED' } }),
      db.task.count({ where: { userId: user.id, status: 'IN_PROGRESS' } }),
      db.task.count({
        where: {
          userId: user.id,
          status: { not: 'COMPLETED' },
          dueDate: { lt: today }
        }
      })
    ]);

    // Journal Summary
    const [
      totalJournalEntries,
      thisWeekJournalEntries,
      thisMonthJournalEntries
    ] = await Promise.all([
      db.journalEntry.count({ where: { userId: user.id } }),
      db.journalEntry.count({
        where: {
          userId: user.id,
          createdAt: { gte: weekStart, lte: weekEnd }
        }
      }),
      db.journalEntry.count({
        where: {
          userId: user.id,
          createdAt: { gte: monthStart, lte: monthEnd }
        }
      })
    ]);

    // Average mood calculation
    const moodStats = await db.journalEntry.groupBy({
      by: ['mood'],
      where: {
        userId: user.id,
        mood: { not: null },
        createdAt: { gte: monthStart }
      },
      _count: { mood: true }
    });

    const averageMood = moodStats.length > 0
      ? moodStats.reduce((acc, stat) => {
          const moodScore = getMoodScore(stat.mood!);
          return acc + (moodScore * stat._count.mood);
        }, 0) / moodStats.reduce((acc, stat) => acc + stat._count.mood, 0)
      : 0;

    // Calendar Summary
    const [
      todayEvents,
      upcomingEvents,
      thisWeekEvents
    ] = await Promise.all([
      db.calendarEvent.count({
        where: {
          userId: user.id,
          startTime: { gte: today, lte: todayEnd }
        }
      }),
      db.calendarEvent.count({
        where: {
          userId: user.id,
          startTime: { gt: today }
        }
      }),
      db.calendarEvent.count({
        where: {
          userId: user.id,
          startTime: { gte: weekStart, lte: weekEnd }
        }
      })
    ]);

    // Email Summary
    const [
      unreadEmails,
      totalEmails,
      importantEmails
    ] = await Promise.all([
      db.email.count({
        where: {
          userId: user.id,
          isRead: false
        }
      }),
      db.email.count({ where: { userId: user.id } }),
      db.email.count({
        where: {
          userId: user.id,
          isImportant: true
        }
      })
    ]);

    // Contacts Summary
    const [
      totalContacts,
      recentContacts,
      favoriteContacts
    ] = await Promise.all([
      db.contact.count({ where: { userId: user.id } }),
      db.contact.count({
        where: {
          userId: user.id,
          createdAt: { gte: lastWeekStart }
        }
      }),
      db.contact.count({
        where: {
          userId: user.id,
          isFavorite: true
        }
      })
    ]);

    // Weekly Activity Data
    const weeklyActivity = await getWeeklyActivity(user.id, weekStart, weekEnd);

    // Productivity Score Calculation
    const productivityScore = calculateProductivityScore({
      tasksCompleted: completedTasks,
      totalTasks,
      journalEntries: thisWeekJournalEntries,
      eventsAttended: thisWeekEvents,
      emailsProcessed: totalEmails - unreadEmails
    });

    const metrics: DashboardMetrics = {
      tasksSummary: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        overdue: overdueTasks
      },
      journalSummary: {
        totalEntries: totalJournalEntries,
        thisWeek: thisWeekJournalEntries,
        thisMonth: thisMonthJournalEntries,
        averageMood: Math.round(averageMood * 100) / 100
      },
      calendarSummary: {
        todayEvents,
        upcomingEvents,
        thisWeekEvents
      },
      emailSummary: {
        unread: unreadEmails,
        total: totalEmails,
        important: importantEmails
      },
      contactsSummary: {
        total: totalContacts,
        recent: recentContacts,
        favorites: favoriteContacts
      },
      productivityScore,
      weeklyActivity
    };

    return createSuccessResponse(metrics);

  } catch (error) {
    return handleApiError(error);
  }
});

function getMoodScore(mood: string): number {
  const moodScores: Record<string, number> = {
    happy: 5,
    excited: 4.5,
    calm: 4,
    neutral: 3,
    anxious: 2,
    frustrated: 1.5,
    sad: 1,
    angry: 0.5
  };
  return moodScores[mood] || 3;
}

async function getWeeklyActivity(userId: string, weekStart: Date, weekEnd: Date) {
  const days = [];
  const currentDay = new Date(weekStart);

  for (let i = 0; i < 7; i++) {
    const dayStart = startOfDay(currentDay);
    const dayEnd = endOfDay(currentDay);

    const [tasks, journal, events] = await Promise.all([
      db.task.count({
        where: {
          userId,
          completedAt: { gte: dayStart, lte: dayEnd }
        }
      }),
      db.journalEntry.count({
        where: {
          userId,
          createdAt: { gte: dayStart, lte: dayEnd }
        }
      }),
      db.calendarEvent.count({
        where: {
          userId,
          startTime: { gte: dayStart, lte: dayEnd }
        }
      })
    ]);

    days.push({
      date: currentDay.toISOString().split('T')[0],
      tasks,
      journal,
      events
    });

    currentDay.setDate(currentDay.getDate() + 1);
  }

  return days;
}

function calculateProductivityScore(data: {
  tasksCompleted: number;
  totalTasks: number;
  journalEntries: number;
  eventsAttended: number;
  emailsProcessed: number;
}): number {
  const taskCompletionRate = data.totalTasks > 0 ? data.tasksCompleted / data.totalTasks : 0;
  const journalFrequency = Math.min(data.journalEntries / 7, 1); // Normalize to weekly
  const calendarUtilization = Math.min(data.eventsAttended / 10, 1); // Assuming 10 is good weekly target
  const emailProcessingRate = Math.min(data.emailsProcessed / 50, 1); // Assuming 50 is good weekly target

  // Weighted average
  const score = (
    taskCompletionRate * 0.4 +
    journalFrequency * 0.2 +
    calendarUtilization * 0.2 +
    emailProcessingRate * 0.2
  ) * 100;

  return Math.round(score);
}