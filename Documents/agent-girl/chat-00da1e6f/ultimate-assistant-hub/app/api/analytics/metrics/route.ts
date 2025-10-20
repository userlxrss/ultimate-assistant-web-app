import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, format } from 'date-fns';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: query, error } = validateQueryParams(searchParams, validationSchemas.analyticsQuery);

    if (error) {
      return error;
    }

    const {
      metricTypes = ['tasks_completed', 'journal_entries', 'calendar_events', 'emails_processed'],
      dateFrom,
      dateTo,
      granularity = 'day'
    } = query;

    // Default to last 30 days if no date range provided
    const now = new Date();
    const defaultDateFrom = subDays(now, 30);
    const fromDate = dateFrom || defaultDateFrom;
    const toDate = dateTo || now;

    const metrics = await calculateUserMetrics(user.id, metricTypes, fromDate, toDate, granularity);

    return createSuccessResponse(metrics);

  } catch (error) {
    return handleApiError(error);
  }
});

async function calculateUserMetrics(
  userId: string,
  metricTypes: string[],
  dateFrom: Date,
  dateTo: Date,
  granularity: 'day' | 'week' | 'month'
) {
  const metrics: any = {
    overview: {},
    trends: {},
    insights: []
  };

  // Calculate tasks metrics
  if (metricTypes.includes('tasks_completed')) {
    const tasksMetrics = await getTasksMetrics(userId, dateFrom, dateTo, granularity);
    metrics.tasks = tasksMetrics;
    metrics.overview.tasksCompleted = tasksMetrics.total;
  }

  // Calculate journal metrics
  if (metricTypes.includes('journal_entries')) {
    const journalMetrics = await getJournalMetrics(userId, dateFrom, dateTo, granularity);
    metrics.journal = journalMetrics;
    metrics.overview.journalEntries = journalMetrics.total;
  }

  // Calculate calendar metrics
  if (metricTypes.includes('calendar_events')) {
    const calendarMetrics = await getCalendarMetrics(userId, dateFrom, dateTo, granularity);
    metrics.calendar = calendarMetrics;
    metrics.overview.calendarEvents = calendarMetrics.total;
  }

  // Calculate email metrics
  if (metricTypes.includes('emails_processed')) {
    const emailMetrics = await getEmailMetrics(userId, dateFrom, dateTo, granularity);
    metrics.emails = emailMetrics;
    metrics.overview.emailsProcessed = emailMetrics.totalProcessed;
  }

  // Calculate contacts metrics
  if (metricTypes.includes('contacts_added')) {
    const contactsMetrics = await getContactsMetrics(userId, dateFrom, dateTo, granularity);
    metrics.contacts = contactsMetrics;
    metrics.overview.contactsAdded = contactsMetrics.total;
  }

  // Generate insights
  metrics.insights = generateInsights(metrics);

  return metrics;
}

async function getTasksMetrics(userId: string, dateFrom: Date, dateTo: Date, granularity: string) {
  const completedTasks = await db.task.groupBy({
    by: ['completedAt'],
    where: {
      userId,
      completedAt: { gte: dateFrom, lte: dateTo }
    },
    _count: { id: true }
  });

  const overdueTasks = await db.task.count({
    where: {
      userId,
      status: { not: 'COMPLETED' },
      dueDate: { lt: new Date() }
    }
  });

  const totalTasks = await db.task.count({
    where: {
      userId,
      createdAt: { gte: dateFrom, lte: dateTo }
    }
  });

  return {
    total: completedTasks.length,
    totalCreated: totalTasks,
    overdue: overdueTasks,
    completionRate: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
    timeSeries: groupByTimePeriod(completedTasks, 'completedAt', granularity)
  };
}

async function getJournalMetrics(userId: string, dateFrom: Date, dateTo: Date, granularity: string) {
  const journalEntries = await db.journalEntry.findMany({
    where: {
      userId,
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    select: {
      createdAt: true,
      mood: true,
      tags: true
    }
  });

  const moodDistribution = await db.journalEntry.groupBy({
    by: ['mood'],
    where: {
      userId,
      createdAt: { gte: dateFrom, lte: dateTo },
      mood: { not: null }
    },
    _count: { mood: true }
  });

  const totalEntries = journalEntries.length;
  const averageMood = calculateAverageMood(moodDistribution);
  const mostUsedTags = getMostUsedTags(journalEntries);

  return {
    total: totalEntries,
    averageMood,
    moodDistribution,
    mostUsedTags,
    timeSeries: groupByTimePeriod(journalEntries, 'createdAt', granularity)
  };
}

async function getCalendarMetrics(userId: string, dateFrom: Date, dateTo: Date, granularity: string) {
  const events = await db.calendarEvent.findMany({
    where: {
      userId,
      startTime: { gte: dateFrom, lte: dateTo }
    },
    select: {
      startTime: true,
      endTime: true,
      status: true
    }
  });

  const totalEvents = events.length;
  const totalDuration = events.reduce((acc, event) => {
    return acc + (event.endTime.getTime() - event.startTime.getTime());
  }, 0);

  const averageDuration = totalEvents > 0 ? totalDuration / totalEvents : 0;

  return {
    total: totalEvents,
    totalDuration: Math.round(totalDuration / (1000 * 60)), // in minutes
    averageDuration: Math.round(averageDuration / (1000 * 60)), // in minutes
    timeSeries: groupByTimePeriod(events, 'startTime', granularity)
  };
}

async function getEmailMetrics(userId: string, dateFrom: Date, dateTo: Date, granularity: string) {
  const emails = await db.email.findMany({
    where: {
      userId,
      receivedAt: { gte: dateFrom, lte: dateTo }
    },
    select: {
      receivedAt: true,
      isRead: true,
      isImportant: true,
      from: true
    }
  });

  const sentEmails = await db.email.findMany({
    where: {
      userId,
      sentAt: { gte: dateFrom, lte: dateTo }
    },
    select: {
      sentAt: true
    }
  });

  const totalReceived = emails.length;
  const totalSent = sentEmails.length;
  const totalProcessed = totalReceived + totalSent;
  const unreadCount = emails.filter(e => !e.isRead).length;

  return {
    totalProcessed,
    totalReceived,
    totalSent,
    unreadCount,
    responseRate: totalReceived > 0 ? (totalSent / totalReceived) * 100 : 0,
    timeSeries: groupByTimePeriod([...emails, ...sentEmails], 'receivedAt' in emails[0] ? 'receivedAt' : 'sentAt', granularity)
  };
}

async function getContactsMetrics(userId: string, dateFrom: Date, dateTo: Date, granularity: string) {
  const contacts = await db.contact.findMany({
    where: {
      userId,
      createdAt: { gte: dateFrom, lte: dateTo }
    },
    select: {
      createdAt: true,
      company: true,
      tags: true
    }
  });

  const totalContacts = contacts.length;
  const companies = [...new Set(contacts.map(c => c.company).filter(Boolean))];
  const topTags = getMostUsedTags(contacts);

  return {
    total: totalContacts,
    companies: companies.length,
    topTags,
    timeSeries: groupByTimePeriod(contacts, 'createdAt', granularity)
  };
}

function groupByTimePeriod(items: any[], dateField: string, granularity: string) {
  const grouped: Record<string, number> = {};

  items.forEach(item => {
    const date = new Date(item[dateField]);
    let key: string;

    switch (granularity) {
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(startOfWeek(date, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        break;
      case 'month':
        key = format(startOfMonth(date), 'yyyy-MM');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }

    grouped[key] = (grouped[key] || 0) + 1;
  });

  return Object.entries(grouped).map(([date, count]) => ({ date, count }));
}

function calculateAverageMood(moodDistribution: any[]) {
  if (moodDistribution.length === 0) return 0;

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

  const totalScore = moodDistribution.reduce((acc, item) => {
    const score = moodScores[item.mood!] || 3;
    return acc + (score * item._count.mood);
  }, 0);

  const totalCount = moodDistribution.reduce((acc, item) => acc + item._count.mood, 0);

  return Math.round((totalScore / totalCount) * 100) / 100;
}

function getMostUsedTags(items: any[]) {
  const tagCounts: Record<string, number> = {};

  items.forEach(item => {
    if (item.tags && Array.isArray(item.tags)) {
      item.tags.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    }
  });

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));
}

function generateInsights(metrics: any) {
  const insights: string[] = [];

  // Task completion insights
  if (metrics.tasks) {
    const completionRate = metrics.tasks.completionRate;
    if (completionRate > 80) {
      insights.push("Excellent task completion rate! You're highly productive.");
    } else if (completionRate > 60) {
      insights.push("Good task completion rate. Consider breaking down larger tasks.");
    } else {
      insights.push("Task completion could be improved. Try prioritizing high-impact tasks.");
    }
  }

  // Journal consistency insights
  if (metrics.journal) {
    const entriesPerDay = metrics.journal.total / 30; // assuming 30-day period
    if (entriesPerDay > 0.8) {
      insights.push("Great journaling consistency! Regular reflection supports personal growth.");
    } else if (entriesPerDay > 0.3) {
      insights.push("Good journaling habit. Consider setting a daily reminder.");
    } else {
      insights.push("Try to journal more regularly for better emotional awareness.");
    }
  }

  // Email management insights
  if (metrics.emails) {
    const unreadRatio = metrics.emails.unreadCount / metrics.emails.totalReceived;
    if (unreadRatio < 0.1) {
      insights.push("Excellent email management! You keep your inbox organized.");
    } else if (unreadRatio < 0.3) {
      insights.push("Good email management. Consider regular inbox clearing.");
    } else {
      insights.push("Many unread emails. Try processing emails in batches.");
    }
  }

  return insights;
}