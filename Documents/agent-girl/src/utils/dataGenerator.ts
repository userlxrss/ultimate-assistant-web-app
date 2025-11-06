import {
  MoodEntry,
  Task,
  JournalEntry,
  CalendarEvent,
  Email,
  Contact,
  Activity,
  AIInsight,
  WeeklyComparison
} from '../types';

const themes = [
  'productivity', 'mindfulness', 'learning', 'relationships', 'health',
  'career', 'creativity', 'finance', 'habits', 'goals', 'gratitude',
  'reflection', 'growth', 'balance', 'focus', 'planning', 'wellness'
];

const taskCategories = [
  'work', 'personal', 'learning', 'health', 'finance', 'creative', 'social'
];

const eventTypes = ['meeting', 'personal', 'work', 'learning', 'health'] as const;
const emailCategories = ['work', 'personal', 'newsletter', 'updates', 'finance'];
const contactCategories = ['professional', 'personal', 'networking', 'mentor', 'client'];

const insights = [
  { type: 'pattern' as const, title: 'Peak Productivity Window', content: 'You complete 40% more tasks between 9-11 AM' },
  { type: 'recommendation' as const, title: 'Energy Management', content: 'Schedule important tasks during your high-energy periods' },
  { type: 'motivation' as const, title: 'Consistency Champion', content: 'You\'ve maintained a daily journal streak for 15 days!' },
  { type: 'pattern' as const, title: 'Mood-Activity Correlation', content: 'Exercise days show 23% higher mood ratings' },
  { type: 'recommendation' as const, title: 'Meeting Optimization', content: 'Consider reducing meeting time by 25% to increase focus time' },
  { type: 'motivation' as const, title: 'Growth Achiever', content: 'You\'ve learned 3 new skills this month - keep it up!' },
  { type: 'pattern' as const, title: 'Weekly Rhythm', content: 'Mondays show lowest energy - consider lighter schedules' },
  { type: 'recommendation' as const, title: 'Social Connection', content: 'Regular social interactions correlate with higher mood ratings' }
];

const activityDescriptions = [
  'Completed important project milestone',
  'Wrote reflective journal entry',
  'Scheduled team meeting',
  'Responded to urgent emails',
  'Added new contact to network',
  'Updated task list',
  'Reviewed monthly goals',
  'Attended virtual workshop',
  'Completed course module',
  'Meditated for 15 minutes',
  'Planned weekly schedule',
  'Reviewed analytics dashboard',
  'Sent follow-up messages',
  'Organized digital files',
  'Prepared presentation slides'
];

const names = [
  'Alex Chen', 'Jordan Smith', 'Taylor Johnson', 'Morgan Davis',
  'Casey Wilson', 'Riley Brown', 'Avery Jones', 'Quinn Miller',
  'Dakota Garcia', 'Sage Martinez', 'River Anderson', 'Sky Taylor',
  'Phoenix Thomas', 'Indigo Jackson', 'Rowan White', 'Hazel Harris'
];

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function weightedChoice<T>(items: { item: T; weight: number }[]): T {
  const totalWeight = items.reduce((sum, { weight }) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const { item, weight } of items) {
    random -= weight;
    if (random <= 0) return item;
  }
  return items[0].item;
}

function generateDateRange(days: number): Date[] {
  const dates: Date[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  return dates;
}

export function generateMoodData(days: number = 60): MoodEntry[] {
  const dates = generateDateRange(days);
  let previousMood = 6;
  let previousEnergy = 5;

  return dates.map(date => {
    // Add some correlation and randomness to make it realistic
    const moodChange = (Math.random() - 0.5) * 2;
    const energyChange = (Math.random() - 0.5) * 2.5;

    const mood = Math.max(1, Math.min(10, Math.round(previousMood + moodChange)));
    const energy = Math.max(1, Math.min(10, Math.round(previousEnergy + energyChange)));

    previousMood = mood;
    previousEnergy = energy;

    return {
      date,
      mood,
      energy,
      notes: Math.random() > 0.7 ? `Feeling ${mood >= 7 ? 'good' : mood >= 5 ? 'okay' : 'challenged'} today` : undefined
    };
  });
}

export function generateTasks(days: number = 60): Task[] {
  const dates = generateDateRange(days);
  const tasks: Task[] = [];

  dates.forEach(date => {
    const tasksCount = randomBetween(2, 8);
    for (let i = 0; i < tasksCount; i++) {
      const createdAt = new Date(date);
      createdAt.setHours(randomBetween(8, 18), randomBetween(0, 59));

      const completed = Math.random() > 0.25;
      const completedAt = completed ? new Date(createdAt.getTime() + randomBetween(1, 8) * 60 * 60 * 1000) : undefined;

      tasks.push({
        id: `task-${tasks.length + 1}`,
        title: `${randomChoice(['Review', 'Complete', 'Start', 'Update', 'Finalize'])} ${randomChoice(['project', 'report', 'presentation', 'document', 'analysis', 'research'])}`,
        description: `${randomChoice(['This task involves', 'Need to work on', 'Complete the following'])} ${randomChoice(['detailed analysis', 'comprehensive review', 'thorough research', 'careful planning'])}`,
        completed,
        createdAt,
        completedAt,
        dueDate: new Date(createdAt.getTime() + randomBetween(1, 7) * 24 * 60 * 60 * 1000),
        priority: weightedChoice([
          { item: 'low' as const, weight: 30 },
          { item: 'medium' as const, weight: 50 },
          { item: 'high' as const, weight: 20 }
        ]),
        status: completed ? 'completed' : weightedChoice([
          { item: 'pending' as const, weight: 40 },
          { item: 'in-progress' as const, weight: 60 }
        ]),
        category: randomChoice(taskCategories),
        workspace: randomChoice(['Office', 'Home Office', 'Remote', 'Client Site']),
        duration: randomBetween(30, 180),
        subtasks: [],
        tags: [randomChoice(['urgent', 'important', 'follow-up', 'review'])],
        estimatedTime: randomBetween(30, 240),
        actualTime: completed ? randomBetween(15, 300) : undefined,
        recurrence: 'none',
        syncStatus: 'synced'
      });
    }
  });

  return tasks;
}

export function generateJournalEntries(days: number = 60): JournalEntry[] {
  const dates = generateDateRange(days);
  const entries: JournalEntry[] = [];

  dates.forEach(date => {
    if (Math.random() > 0.15) { // 85% chance of entry each day
      const mood = randomBetween(3, 10);
      const entryThemes: string[] = [];
      const themeCount = randomBetween(1, 3);

      for (let i = 0; i < themeCount; i++) {
        const theme = randomChoice(themes);
        if (!entryThemes.includes(theme)) {
          entryThemes.push(theme);
        }
      }

      entries.push({
        id: `journal-${entries.length + 1}`,
        date: new Date(date),
        content: `Today was ${mood >= 8 ? 'productive and fulfilling' : mood >= 6 ? 'challenging but rewarding' : 'difficult but educational'}. Focus was on ${entryThemes.join(' and ')}.`,
        mood,
        themes: entryThemes,
        insights: randomChoice([
          ['Learned importance of consistency', 'Recognized pattern in behavior'],
          ['Discovered new productivity technique', 'Realized need for better boundaries'],
          ['Appreciated small progress', 'Identified area for improvement']
        ])
      });
    }
  });

  return entries;
}

export function generateCalendarEvents(days: number = 60): CalendarEvent[] {
  const dates = generateDateRange(days);
  const events: CalendarEvent[] = [];

  dates.forEach(date => {
    const eventCount = randomBetween(0, 4);
    for (let i = 0; i < eventCount; i++) {
      const eventDate = new Date(date);
      eventDate.setHours(randomBetween(9, 17), randomBetween(0, 59));

      events.push({
        id: `event-${events.length + 1}`,
        title: randomChoice([
          'Team Standup', 'Project Review', 'Client Meeting', '1:1 Check-in',
          'Learning Session', 'Workshop', 'Exercise Class', 'Lunch Meeting',
          'Planning Session', 'Code Review', 'Design Review', 'Strategy Meeting'
        ]),
        date: eventDate,
        duration: randomBetween(30, 120),
        type: randomChoice([...eventTypes] as const)
      });
    }
  });

  return events;
}

export function generateEmails(days: number = 60): Email[] {
  const dates = generateDateRange(days);
  const emails: Email[] = [];

  dates.forEach(date => {
    const emailCount = randomBetween(2, 15);
    for (let i = 0; i < emailCount; i++) {
      const emailDate = new Date(date);
      emailDate.setHours(randomBetween(8, 20), randomBetween(0, 59));

      const isSent = Math.random() > 0.6;
      const name = randomChoice(names);

      emails.push({
        id: `email-${emails.length + 1}`,
        threadId: `thread-${randomBetween(1, 999)}`,
        from: {
          name: isSent ? 'Me' : name,
          email: isSent ? 'me@example.com' : `${name.toLowerCase().replace(' ', '.')}@example.com`
        },
        to: isSent ? [{
          name: name,
          email: `${name.toLowerCase().replace(' ', '.')}@example.com`
        }] : [{
          name: 'Me',
          email: 'me@example.com'
        }],
        subject: randomChoice([
          'Project Update', 'Meeting Notes', 'Action Items', 'Review Request',
          'Weekly Report', 'Quick Question', 'Follow-up', 'Confirmation',
          'Newsletter', 'Invoice', 'Proposal', 'Introduction'
        ]),
        body: randomChoice([
          'Hi, just wanted to update you on the progress we discussed.',
          'Please find attached the documents you requested.',
          'Looking forward to our meeting tomorrow.',
          'Thanks for your time today. Here are the next steps.',
          'Quick check-in regarding the project timeline.',
          'Following up on our conversation from last week.',
          'Can you review this when you get a chance?',
          'Great meeting today! Summary of action items below.'
        ]),
        date: emailDate,
        sent: isSent,
        read: Math.random() > 0.3,
        starred: Math.random() > 0.9,
        important: Math.random() > 0.85,
        archived: false,
        deleted: false,
        draft: false,
        labels: [],
        attachments: [],
        category: randomChoice(emailCategories) as any,
        folder: isSent ? 'sent' : 'inbox' as any,
        snippet: 'Email content preview...',
        hasAttachments: false,
        isEncrypted: false,
        priority: 'normal' as any,
        size: randomBetween(1000, 50000)
      });
    }
  });

  return emails;
}

export function generateContacts(days: number = 60): Contact[] {
  const contacts: Contact[] = [];

  // Generate contacts spread over the period
  for (let i = 0; i < randomBetween(15, 30); i++) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - randomBetween(0, days));
    const name = randomChoice(names);

    contacts.push({
      id: `contact-${contacts.length + 1}`,
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@example.com`,
      createdAt,
      category: randomChoice(contactCategories),
      lastContact: Math.random() > 0.3 ? new Date(createdAt.getTime() + randomBetween(1, 30) * 24 * 60 * 60 * 1000) : undefined
    });
  }

  return contacts;
}

export function generateActivities(days: number = 7): Activity[] {
  const activities: Activity[] = [];
  const now = new Date();

  for (let i = 0; i < randomBetween(10, 15); i++) {
    const activityDate = new Date(now);
    activityDate.setDate(activityDate.getDate() - randomBetween(0, days));
    activityDate.setHours(randomBetween(8, 20), randomBetween(0, 59));

    activities.push({
      id: `activity-${activities.length + 1}`,
      type: randomChoice(['task', 'journal', 'email', 'event', 'contact']),
      title: randomChoice(activityDescriptions),
      date: activityDate,
      description: Math.random() > 0.5 ? `Additional context about this activity` : undefined
    });
  }

  return activities.sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function generateAIInsights(): AIInsight[] {
  return insights.map((insight, index) => ({
    ...insight,
    priority: index < 2 ? 'high' : index < 5 ? 'medium' : 'low'
  }));
}

export function generateWeeklyComparison(): WeeklyComparison {
  return {
    currentWeek: {
      tasksCompleted: randomBetween(25, 40),
      journalEntries: randomBetween(5, 7),
      averageMood: randomBetween(65, 85) / 10,
      meetingHours: randomBetween(8, 20)
    },
    previousWeek: {
      tasksCompleted: randomBetween(20, 35),
      journalEntries: randomBetween(4, 7),
      averageMood: randomBetween(60, 80) / 10,
      meetingHours: randomBetween(6, 18)
    }
  };
}