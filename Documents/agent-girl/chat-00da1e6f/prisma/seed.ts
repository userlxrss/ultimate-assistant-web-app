import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.analyticsData.deleteMany();
  await prisma.userInsight.deleteMany();
  await prisma.dashboardWidget.deleteMany();
  await prisma.contactAddress.deleteMany();
  await prisma.contactPhone.deleteMany();
  await prisma.contactEmail.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.emailAttachment.deleteMany();
  await prisma.emailMessage.deleteMany();
  await prisma.emailThread.deleteMany();
  await prisma.eventReminder.deleteMany();
  await prisma.calendarEvent.deleteMany();
  await prisma.calendarSource.deleteMany();
  await prisma.taskTimeEntry.deleteMany();
  await prisma.taskDependency.deleteMany();
  await prisma.task.deleteMany();
  await prisma.taskProject.deleteMany();
  await prisma.learningInsight.deleteMany();
  await prisma.dailyWin.deleteMany();
  await prisma.journalReflection.deleteMany();
  await prisma.journalEntry.deleteMany();
  await prisma.externalConnection.deleteMany();
  await prisma.userPreferences.deleteMany();
  await prisma.user.deleteMany();

  // Create sample users
  console.log('👥 Creating sample users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@ultimateassistant.com',
      username: 'demo_user',
      passwordHash: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      timezone: 'America/New_York',
      language: 'en',
      emailVerified: true,
      isActive: true,
      userPreferences: {
        create: {
          theme: 'light',
          dashboardLayout: {
            widgets: [
              { type: 'mood_chart', position: { x: 0, y: 0, width: 6, height: 4 } },
              { type: 'task_summary', position: { x: 6, y: 0, width: 6, height: 4 } },
              { type: 'upcoming_events', position: { x: 0, y: 4, width: 12, height: 3 } }
            ]
          },
          notificationSettings: {
            email: true,
            push: true,
            taskReminders: true,
            calendarReminders: true
          },
          privacySettings: {
            shareAnalytics: false,
            publicProfile: false
          }
        }
      }
    }
  });

  const testUser = await prisma.user.create({
    data: {
      email: 'test@ultimateassistant.com',
      username: 'test_user',
      passwordHash: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      timezone: 'Europe/London',
      language: 'en',
      emailVerified: true,
      isActive: true,
      userPreferences: {
        create: {
          theme: 'dark',
          dashboardLayout: {
            widgets: [
              { type: 'productivity_chart', position: { x: 0, y: 0, width: 12, height: 6 } }
            ]
          }
        }
      }
    }
  });

  console.log(`✅ Created users: ${demoUser.email}, ${testUser.email}`);

  // Create external connections
  console.log('🔗 Creating external connections...');
  await prisma.externalConnection.createMany({
    data: [
      {
        userId: demoUser.id,
        serviceName: 'google',
        serviceUserId: 'google_user_123',
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        tokenExpiresAt: new Date(Date.now() + 3600000),
        syncEnabled: true,
        syncSettings: {
          calendar: true,
          gmail: true,
          contacts: true
        }
      },
      {
        userId: demoUser.id,
        serviceName: 'motion',
        serviceUserId: 'motion_user_456',
        accessToken: 'mock_motion_token',
        syncEnabled: true,
        syncSettings: {
          tasks: true,
          projects: true
        }
      }
    ]
  });

  // Create journal entries
  console.log('📔 Creating journal entries...');
  const journalEntries = await prisma.journalEntry.createMany({
    data: [
      {
        userId: demoUser.id,
        title: 'Great Productivity Day',
        content: 'Today was incredibly productive! I managed to complete all the tasks on my list and even had time for a walk in the park. The new task management system is really helping me stay organized.',
        entryDate: new Date(Date.now() - 86400000), // Yesterday
        moodScore: 8,
        moodLabel: 'Happy',
        tags: ['productivity', 'success', 'wellness'],
        isFavorite: true
      },
      {
        userId: demoUser.id,
        title: 'Challenges and Learning',
        content: 'Had some challenges with the project timeline, but learned a lot about problem-solving. Sometimes setbacks are opportunities for growth. Need to review my planning process.',
        entryDate: new Date(Date.now() - 172800000), // 2 days ago
        moodScore: 6,
        moodLabel: 'Neutral',
        tags: ['learning', 'challenges', 'growth']
      },
      {
        userId: demoUser.id,
        title: 'Weekend Reflection',
        content: 'Spent quality time with family this weekend. It\'s important to maintain work-life balance. Feeling refreshed and ready for the week ahead.',
        entryDate: new Date(Date.now() - 259200000), // 3 days ago
        moodScore: 9,
        moodLabel: 'Content',
        tags: ['family', 'balance', 'weekend'],
        isFavorite: true
      }
    ]
  });

  // Create daily wins
  console.log('🏆 Creating daily wins...');
  await prisma.dailyWin.createMany({
    data: [
      {
        userId: demoUser.id,
        entryDate: new Date(Date.now() - 86400000),
        winDescription: 'Completed project proposal ahead of schedule',
        category: 'Work',
        achievementLevel: 3
      },
      {
        userId: demoUser.id,
        entryDate: new Date(Date.now() - 86400000),
        winDescription: 'Meditated for 15 minutes in the morning',
        category: 'Wellness',
        achievementLevel: 2
      },
      {
        userId: demoUser.id,
        entryDate: new Date(Date.now() - 172800000),
        winDescription: 'Helped teammate solve technical problem',
        category: 'Teamwork',
        achievementLevel: 2
      }
    ]
  });

  // Create task projects
  console.log('📁 Creating task projects...');
  const projects = await prisma.taskProject.createMany({
    data: [
      {
        userId: demoUser.id,
        motionProjectId: 'motion_proj_1',
        name: 'Ultimate Assistant Development',
        description: 'Main project for the Ultimate Assistant Hub platform',
        color: '#3B82F6',
        isActive: true
      },
      {
        userId: demoUser.id,
        motionProjectId: 'motion_proj_2',
        name: 'Personal Growth',
        description: 'Personal development and learning goals',
        color: '#10B981',
        isActive: true
      },
      {
        userId: demoUser.id,
        name: 'Home Organization',
        description: 'Tasks related to home management and organization',
        color: '#F59E0B',
        isActive: true
      }
    ]
  });

  // Get created projects for reference
  const createdProjects = await prisma.taskProject.findMany({
    where: { userId: demoUser.id }
  });

  // Create tasks
  console.log('✅ Creating tasks...');
  await prisma.task.createMany({
    data: [
      {
        userId: demoUser.id,
        motionTaskId: 'motion_task_1',
        title: 'Set up PostgreSQL database for production',
        description: 'Configure production database with proper indexing and backups',
        status: 'in_progress',
        priority: 1,
        dueDate: new Date(Date.now() + 86400000 * 3), // 3 days from now
        estimatedDuration: 120,
        completionPercentage: 60,
        tags: ['database', 'production', 'urgent'],
        category: 'Development',
        projectId: createdProjects[0]?.id,
        externalData: { motionPriority: 'high' }
      },
      {
        userId: demoUser.id,
        motionTaskId: 'motion_task_2',
        title: 'Design dashboard analytics layout',
        description: 'Create mockups for the new analytics dashboard',
        status: 'pending',
        priority: 2,
        dueDate: new Date(Date.now() + 86400000 * 5), // 5 days from now
        estimatedDuration: 90,
        completionPercentage: 0,
        tags: ['design', 'analytics', 'ui/ux'],
        category: 'Design',
        projectId: createdProjects[0]?.id
      },
      {
        userId: demoUser.id,
        title: 'Complete online course on TypeScript',
        description: 'Finish the advanced TypeScript modules',
        status: 'in_progress',
        priority: 3,
        dueDate: new Date(Date.now() + 86400000 * 14), // 2 weeks from now
        estimatedDuration: 300,
        completionPercentage: 40,
        tags: ['learning', 'typescript', 'development'],
        category: 'Personal Development',
        projectId: createdProjects[1]?.id
      },
      {
        userId: demoUser.id,
        title: 'Organize home office space',
        description: 'Declutter and organize the home office for better productivity',
        status: 'pending',
        priority: 3,
        dueDate: new Date(Date.now() + 86400000 * 7), // 1 week from now
        estimatedDuration: 180,
        completionPercentage: 0,
        tags: ['home', 'organization', 'productivity'],
        category: 'Personal',
        projectId: createdProjects[2]?.id
      },
      {
        userId: demoUser.id,
        motionTaskId: 'motion_task_3',
        title: 'Review and optimize database queries',
        description: 'Analyze slow queries and add necessary indexes',
        status: 'completed',
        priority: 2,
        dueDate: new Date(Date.now() - 86400000), // Yesterday
        estimatedDuration: 60,
        actualDuration: 45,
        completionPercentage: 100,
        completedAt: new Date(Date.now() - 43200000), // 12 hours ago
        tags: ['database', 'optimization', 'performance'],
        category: 'Development',
        projectId: createdProjects[0]?.id
      }
    ]
  });

  // Create calendar sources
  console.log('📅 Creating calendar sources...');
  await prisma.calendarSource.createMany({
    data: [
      {
        userId: demoUser.id,
        googleCalendarId: 'primary',
        name: 'Primary Calendar',
        description: 'Main calendar for events and appointments',
        color: '#3B82F6',
        timezone: 'America/New_York',
        isPrimary: true,
        syncEnabled: true
      },
      {
        userId: demoUser.id,
        googleCalendarId: 'work',
        name: 'Work Calendar',
        description: 'Work-related events and meetings',
        color: '#EF4444',
        timezone: 'America/New_York',
        syncEnabled: true
      },
      {
        userId: demoUser.id,
        googleCalendarId: 'personal',
        name: 'Personal Calendar',
        description: 'Personal events and activities',
        color: '#10B981',
        timezone: 'America/New_York',
        syncEnabled: true
      }
    ]
  });

  // Create calendar events
  console.log('📆 Creating calendar events...');
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 86400000);
  const nextWeek = new Date(now.getTime() + 86400000 * 7);

  await prisma.calendarEvent.createMany({
    data: [
      {
        userId: demoUser.id,
        googleEventId: 'google_event_1',
        calendarId: 'primary',
        title: 'Team Standup Meeting',
        description: 'Daily sync with the development team',
        location: 'Virtual - Zoom',
        startTime: new Date(now.getTime() + 3600000), // 1 hour from now
        endTime: new Date(now.getTime() + 5400000), // 1.5 hours from now
        timezone: 'America/New_York',
        status: 'confirmed',
        attendees: [
          { email: 'team@company.com', name: 'Development Team' },
          { email: 'manager@company.com', name: 'Project Manager' }
        ]
      },
      {
        userId: demoUser.id,
        googleEventId: 'google_event_2',
        calendarId: 'work',
        title: 'Project Review - Ultimate Assistant',
        description: 'Quarterly review of the Ultimate Assistant project',
        location: 'Conference Room A',
        startTime: tomorrow,
        endTime: new Date(tomorrow.getTime() + 3600000),
        timezone: 'America/New_York',
        status: 'confirmed',
        attendees: [
          { email: 'stakeholder@company.com', name: 'Stakeholder' },
          { email: 'team@company.com', name: 'Project Team' }
        ]
      },
      {
        userId: demoUser.id,
        googleEventId: 'google_event_3',
        calendarId: 'personal',
        title: 'Gym Session',
        description: 'Weekly workout routine',
        location: 'Local Gym',
        startTime: new Date(now.getTime() + 86400000 * 2), // 2 days from now
        endTime: new Date(now.getTime() + 86400000 * 2 + 3600000),
        timezone: 'America/New_York',
        status: 'confirmed',
        isAllDay: false
      },
      {
        userId: demoUser.id,
        googleEventId: 'google_event_4',
        calendarId: 'personal',
        title: 'Birthday Party',
        description: 'Friend\'s birthday celebration',
        location: 'Downtown Restaurant',
        startTime: nextWeek,
        endTime: new Date(nextWeek.getTime() + 14400000), // 4 hours duration
        timezone: 'America/New_York',
        status: 'confirmed'
      }
    ]
  });

  // Create contacts
  console.log('👥 Creating contacts...');
  await prisma.contact.createMany({
    data: [
      {
        userId: demoUser.id,
        googleContactId: 'google_contact_1',
        firstName: 'John',
        lastName: 'Smith',
        displayName: 'John Smith',
        company: 'Tech Corp',
        jobTitle: 'Senior Developer',
        notes: 'Met at tech conference. Works on similar projects.',
        isFavorite: true,
        tags: ['work', 'developer', 'tech']
      },
      {
        userId: demoUser.id,
        googleContactId: 'google_contact_2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        displayName: 'Sarah Johnson',
        company: 'Design Studio',
        jobTitle: 'UX Designer',
        notes: 'Freelance designer. Great with user interfaces.',
        tags: ['design', 'freelance', 'ux']
      },
      {
        userId: demoUser.id,
        firstName: 'Michael',
        lastName: 'Brown',
        displayName: 'Michael Brown',
        company: 'Startup Inc',
        jobTitle: 'Product Manager',
        birthday: new Date('1990-05-15'),
        tags: ['product', 'startup', 'agile']
      }
    ]
  });

  // Create contact emails, phones, and addresses
  const createdContacts = await prisma.contact.findMany({
    where: { userId: demoUser.id }
  });

  await prisma.contactEmail.createMany({
    data: [
      { contactId: createdContacts[0]?.id, email: 'john.smith@techcorp.com', type: 'work', isPrimary: true },
      { contactId: createdContacts[0]?.id, email: 'john.smith.personal@gmail.com', type: 'home' },
      { contactId: createdContacts[1]?.id, email: 'sarah.j@designstudio.com', type: 'work', isPrimary: true },
      { contactId: createdContacts[2]?.id, email: 'michael.brown@startupinc.com', type: 'work', isPrimary: true }
    ]
  });

  await prisma.contactPhone.createMany({
    data: [
      { contactId: createdContacts[0]?.id, phoneNumber: '+1-555-0101', type: 'work', isPrimary: true },
      { contactId: createdContacts[0]?.id, phoneNumber: '+1-555-0102', type: 'mobile' },
      { contactId: createdContacts[1]?.id, phoneNumber: '+1-555-0201', type: 'work', isPrimary: true },
      { contactId: createdContacts[2]?.id, phoneNumber: '+1-555-0301', type: 'work', isPrimary: true }
    ]
  });

  await prisma.contactAddress.createMany({
    data: [
      {
        contactId: createdContacts[0]?.id,
        streetAddress: '123 Tech Street',
        city: 'San Francisco',
        state: 'CA',
        postalCode: '94105',
        country: 'USA',
        type: 'work',
        isPrimary: true
      },
      {
        contactId: createdContacts[1]?.id,
        streetAddress: '456 Design Avenue',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
        type: 'work',
        isPrimary: true
      }
    ]
  });

  // Create email threads
  console.log('📧 Creating email threads...');
  await prisma.emailThread.createMany({
    data: [
      {
        userId: demoUser.id,
        gmailThreadId: 'gmail_thread_1',
        subject: 'Re: Project Proposal Feedback',
        snippet: 'Thanks for the detailed feedback on the proposal...',
        participantEmails: ['john.smith@techcorp.com', 'sarah.j@designstudio.com'],
        lastMessageAt: new Date(Date.now() - 3600000),
        messageCount: 3,
        isRead: true,
        isImportant: true,
        labels: ['work', 'project']
      },
      {
        userId: demoUser.id,
        gmailThreadId: 'gmail_thread_2',
        subject: 'Meeting Reminder - Tomorrow 2PM',
        snippet: 'Just a quick reminder about our meeting tomorrow...',
        participantEmails: ['manager@company.com'],
        lastMessageAt: new Date(Date.now() - 7200000),
        messageCount: 2,
        isRead: false,
        isImportant: true,
        labels: ['meetings', 'important']
      },
      {
        userId: demoUser.id,
        gmailThreadId: 'gmail_thread_3',
        subject: 'Weekly Newsletter - Tech Updates',
        snippet: 'This week in tech: New frameworks, AI advances...',
        participantEmails: ['newsletter@techupdates.com'],
        lastMessageAt: new Date(Date.now() - 86400000),
        messageCount: 1,
        isRead: false,
        labels: ['newsletter', 'tech']
      }
    ]
  });

  // Create dashboard widgets
  console.log('📊 Creating dashboard widgets...');
  await prisma.dashboardWidget.createMany({
    data: [
      {
        userId: demoUser.id,
        widgetType: 'mood_chart',
        title: 'Mood Trends',
        position: { x: 0, y: 0, width: 6, height: 4 },
        config: {
          timeRange: '30d',
          chartType: 'line',
          showAverage: true
        },
        isActive: true
      },
      {
        userId: demoUser.id,
        widgetType: 'task_summary',
        title: 'Task Overview',
        position: { x: 6, y: 0, width: 6, height: 4 },
        config: {
          showCompleted: true,
          showPending: true,
          groupBy: 'project'
        },
        isActive: true
      },
      {
        userId: demoUser.id,
        widgetType: 'upcoming_events',
        title: 'Upcoming Events',
        position: { x: 0, y: 4, width: 12, height: 3 },
        config: {
          daysAhead: 7,
          showCalendarColors: true
        },
        isActive: true
      },
      {
        userId: demoUser.id,
        widgetType: 'productivity_metrics',
        title: 'Productivity Metrics',
        position: { x: 0, y: 7, width: 8, height: 4 },
        config: {
          metrics: ['tasks_completed', 'journal_entries', 'focus_time'],
          timeRange: '7d'
        },
        isActive: true
      },
      {
        userId: demoUser.id,
        widgetType: 'recent_insights',
        title: 'AI Insights',
        position: { x: 8, y: 7, width: 4, height: 4 },
        config: {
          maxItems: 5,
          showDismissed: false
        },
        isActive: true
      }
    ]
  });

  // Create analytics data
  console.log('📈 Creating analytics data...');
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today.getTime() - i * 86400000);
    const weekStart = new Date(date.getTime() - date.getDay() * 86400000);

    await prisma.analyticsData.createMany({
      data: [
        {
          userId: demoUser.id,
          metricName: 'tasks_completed',
          metricValue: Math.floor(Math.random() * 8) + 1,
          metricUnit: 'count',
          periodStart: weekStart,
          periodEnd: new Date(weekStart.getTime() + 86400000 * 7),
          dimensions: { priority: 'all', project: 'all' }
        },
        {
          userId: demoUser.id,
          metricName: 'journal_entries',
          metricValue: Math.random() > 0.3 ? 1 : 0,
          metricUnit: 'count',
          periodStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          periodEnd: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
          dimensions: { mood_tracked: true }
        },
        {
          userId: demoUser.id,
          metricName: 'focus_time',
          metricValue: Math.floor(Math.random() * 300) + 60,
          metricUnit: 'minutes',
          periodStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
          periodEnd: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
          dimensions: { deep_work: true }
        }
      ]
    });
  }

  // Create user insights
  console.log('💡 Creating user insights...');
  await prisma.userInsight.createMany({
    data: [
      {
        userId: demoUser.id,
        insightType: 'productivity',
        title: 'Peak Productivity Hours',
        description: 'Your most productive hours are between 9 AM and 11 AM. Consider scheduling important tasks during this time.',
        confidenceScore: 0.85,
        actionItems: [
          'Schedule important tasks between 9-11 AM',
          'Block distractions during peak hours',
          'Track energy levels throughout the day'
        ],
        relatedData: { peak_hours: ['09:00', '10:00', '11:00'], avg_completion_rate: 0.92 }
      },
      {
        userId: demoUser.id,
        insightType: 'wellness',
        title: 'Mood Pattern Detected',
        description: 'Your mood scores tend to be higher on days when you journal. Keep up the great habit!',
        confidenceScore: 0.78,
        actionItems: [
          'Continue daily journaling',
          'Try journaling at the same time each day',
          'Reflect on positive experiences more often'
        ],
        relatedData: { journal_correlation: 0.82, avg_mood_with_journal: 7.8, avg_mood_without: 6.2 }
      },
      {
        userId: demoUser.id,
        insightType: 'pattern',
        title: 'Task Completion Trend',
        description: 'You complete 25% more tasks when you break them down into smaller subtasks.',
        confidenceScore: 0.91,
        actionItems: [
          'Break large tasks into smaller steps',
          'Use task dependency management',
          'Celebrate small wins'
        ],
        relatedData: { completion_rate_with_subtasks: 0.87, completion_rate_without: 0.62 }
      }
    ]
  });

  // Create activity logs
  console.log('📝 Creating activity logs...');
  await prisma.activityLog.createMany({
    data: [
      {
        userId: demoUser.id,
        activityType: 'task_created',
        entityType: 'task',
        entityId: uuidv4(),
        details: { title: 'Set up PostgreSQL database', priority: 'high' }
      },
      {
        userId: demoUser.id,
        activityType: 'journal_entry_created',
        entityType: 'journal_entry',
        entityId: uuidv4(),
        details: { mood_score: 8, word_count: 156 }
      },
      {
        userId: demoUser.id,
        activityType: 'calendar_event_created',
        entityType: 'calendar_event',
        entityId: uuidv4(),
        details: { title: 'Team Standup Meeting', duration_minutes: 30 }
      },
      {
        userId: demoUser.id,
        activityType: 'contact_added',
        entityType: 'contact',
        entityId: uuidv4(),
        details: { name: 'John Smith', company: 'Tech Corp' }
      },
      {
        userId: demoUser.id,
        activityType: 'task_completed',
        entityType: 'task',
        entityId: uuidv4(),
        details: { title: 'Review database queries', completion_time_minutes: 45 }
      }
    ]
  });

  // Create feature flags
  console.log('🚩 Creating feature flags...');
  await prisma.featureFlag.createMany({
    data: [
      {
        flagName: 'advanced_analytics',
        isEnabled: true,
        rolloutPercentage: 100,
        description: 'Enable advanced analytics dashboard with custom metrics'
      },
      {
        flagName: 'ai_insights',
        isEnabled: true,
        rolloutPercentage: 50,
        description: 'AI-powered insights and recommendations'
      },
      {
        flagName: 'beta_features',
        isEnabled: false,
        rolloutPercentage: 10,
        description: 'Beta features for early adopters'
      },
      {
        flagName: 'enhanced_search',
        isEnabled: true,
        rolloutPercentage: 75,
        description: 'Enhanced search with full-text and semantic capabilities'
      }
    ]
  });

  console.log('✅ Database seeding completed successfully!');
  console.log(`👤 Demo user: ${demoUser.email} (password: password123)`);
  console.log(`👤 Test user: ${testUser.email} (password: password123)`);
  console.log('📊 Summary:');
  console.log(`  - Users: 2`);
  console.log(`  - Journal Entries: 3`);
  console.log(`  - Tasks: 5`);
  console.log(`  - Calendar Events: 4`);
  console.log(`  - Contacts: 3`);
  console.log(`  - Email Threads: 3`);
  console.log(`  - Dashboard Widgets: 5`);
  console.log(`  - Analytics Data Points: ${30 * 3}`);
  console.log(`  - User Insights: 3`);
  console.log(`  - Activity Logs: 5`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });