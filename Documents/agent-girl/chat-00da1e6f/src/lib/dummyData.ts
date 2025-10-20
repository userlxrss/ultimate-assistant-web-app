import {
  JournalEntry,
  Task,
  CalendarEvent,
  Email,
  Contact,
  User,
  JournalFormData,
  TaskFormData,
  EventFormData,
  EmailFormData,
  ContactFormData
} from '@/types'
import { generateId, addDays, subDays } from '@/lib/utils'

// Generate mock user
export const mockUser: User = {
  id: 'user-1',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  preferences: {
    theme: 'light',
    language: 'en',
    timezone: 'America/New_York',
    notifications: {
      email: true,
      push: true,
      dailyDigest: true,
      weeklyReport: true,
      journalReminder: true,
      taskReminder: true,
      calendarSummary: true,
    },
    privacy: {
      shareAnalytics: false,
      shareInsights: false,
      dataRetention: 365,
    },
  },
  createdAt: subDays(new Date(), 90),
  updatedAt: new Date(),
}

// Generate journal entries (60 days of data)
export const generateJournalEntries = (): JournalEntry[] => {
  const entries: JournalEntry[] = []
  const today = new Date()

  const sampleReflections = [
    "Had a productive day at work. The team meeting went really well and we made some great progress on the Q4 roadmap.",
    "Feeling grateful for the support system around me. Sometimes it's easy to forget how much people care.",
    "Challenging day but I learned a lot about handling difficult conversations. Growth happens outside comfort zones.",
    "Amazing breakthrough on the project I've been struggling with. Persistence really does pay off.",
    "Took some time for self-care today. Went for a long walk and reflected on what's truly important.",
    "Had a great workout session and feel energized. Physical health really impacts mental clarity.",
    "Spent quality time with family today. These moments are what life is all about.",
    "Learned a new framework at work today. Excited to apply it to our current project.",
    "Helped a colleague solve a complex problem. Teaching others helps reinforce my own understanding.",
    "Meditation session was very grounding. Need to make this a daily practice.",
  ]

  const sampleWins = [
    "Completed the project proposal ahead of schedule",
    "Successfully negotiated a better deal with a vendor",
    "Ran 5km without stopping",
    "Finished reading a great book",
    "Cooked a healthy meal from scratch",
    "Had a breakthrough conversation with my manager",
    "Fixed a long-standing bug in the codebase",
    "Received positive feedback from a client",
    "Helped a team member overcome a challenge",
    "Completed an online course",
  ]

  const sampleLearning = [
    "The importance of setting clear boundaries",
    "A new productivity technique that really works",
    "How to better manage my time and energy",
    "A new programming language feature",
    "Better communication strategies",
    "The value of taking regular breaks",
    "How to say no gracefully",
    "A new approach to problem-solving",
    "The importance of networking",
    "How to give and receive feedback effectively",
  ]

  const tags = [
    "work", "personal", "health", "growth", "family", "learning",
    "productivity", "mindfulness", "exercise", "reading", "coding",
    "meeting", "project", "breakthrough", "challenge", "gratitude"
  ]

  for (let i = 59; i >= 0; i--) {
    const date = subDays(today, i)

    // Skip some random days to make it more realistic
    if (Math.random() > 0.85) continue

    const mood = Math.floor(Math.random() * 5) + 6 // Bias towards higher moods (6-10)
    const entry: JournalEntry = {
      id: generateId(),
      userId: mockUser.id,
      date,
      reflections: sampleReflections[Math.floor(Math.random() * sampleReflections.length)],
      mood,
      biggestWin: sampleWins[Math.floor(Math.random() * sampleWins.length)],
      learning: sampleLearning[Math.floor(Math.random() * sampleLearning.length)],
      tags: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () =>
        tags[Math.floor(Math.random() * tags.length)]
      ).filter((tag, index, arr) => arr.indexOf(tag) === index),
      isPrivate: Math.random() > 0.8,
      createdAt: new Date(date.getTime() + Math.random() * 86400000), // Sometime during the day
      updatedAt: new Date(date.getTime() + Math.random() * 86400000),
    }

    entries.push(entry)
  }

  return entries.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// Generate tasks
export const generateTasks = (): Task[] => {
  const tasks: Task[] = []

  const taskTitles = [
    "Complete quarterly report",
    "Review and respond to emails",
    "Prepare for team meeting",
    "Update project documentation",
    "Call client about new requirements",
    "Review code changes",
    "Plan next sprint",
    "Research new technologies",
    "Fix critical bugs",
    "Update portfolio website",
    "Prepare presentation for stakeholders",
    "Organize team building event",
    "Review budget proposals",
    "Schedule 1:1 with team members",
    "Complete online course module",
    "Write blog post",
    "Review contract terms",
    "Update personal development plan",
    "Network with industry professionals",
    "Plan vacation itinerary",
    "Renew certifications",
    "Clean up workspace",
    "Backup important files",
    "Schedule dentist appointment",
    "Plan weekend activities",
  ]

  const priorities: Task['priority'][] = ['urgent', 'high', 'medium', 'low']
  const statuses: Task['status'][] = ['pending', 'in_progress', 'completed']

  const now = new Date()

  for (let i = 0; i < 25; i++) {
    const dueDate = Math.random() > 0.3
      ? new Date(now.getTime() + (Math.random() - 0.5) * 14 * 24 * 60 * 60 * 1000) // ±7 days
      : undefined

    const status = Math.random() > 0.6 ? 'completed' :
                   Math.random() > 0.3 ? 'in_progress' : 'pending'

    const completedAt = status === 'completed'
      ? new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
      : undefined

    const task: Task = {
      id: generateId(),
      userId: mockUser.id,
      title: taskTitles[i % taskTitles.length],
      description: `Detailed description for ${taskTitles[i % taskTitles.length]}. This task requires careful attention to detail and timely completion.`,
      dueDate,
      priority: priorities[Math.floor(Math.random() * priorities.length)],
      status,
      estimatedDuration: Math.floor(Math.random() * 180) + 30, // 30-210 minutes
      actualDuration: completedAt ? Math.floor(Math.random() * 180) + 30 : undefined,
      projectId: `project-${Math.floor(Math.random() * 5) + 1}`,
      labels: ['work', 'personal', 'urgent', 'review'].filter(() => Math.random() > 0.6),
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      completedAt,
      motionId: `motion-${generateId()}`,
    }

    tasks.push(task)
  }

  return tasks.sort((a, b) => {
    // Sort by priority first, then by due date
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 }
    const aPriority = priorityOrder[a.priority]
    const bPriority = priorityOrder[b.priority]

    if (aPriority !== bPriority) {
      return aPriority - bPriority
    }

    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime()
    }

    return b.createdAt.getTime() - a.createdAt.getTime()
  })
}

// Generate calendar events
export const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = []

  const eventTitles = [
    "Team Standup Meeting",
    "Project Review",
    "Client Call",
    "1:1 with Manager",
    "Lunch with Team",
    "Department Meeting",
    "Training Session",
    "Doctor Appointment",
    "Gym Session",
    "Team Building Activity",
    "Board Meeting",
    "Product Demo",
    "Code Review",
    "Sprint Planning",
    "Budget Review",
    "Marketing Meeting",
    "Design Review",
    "Weekly Sync",
    "All Hands Meeting",
    "Happy Hour",
    "Yoga Class",
    "Book Club Meeting",
    "Volunteer Work",
    "Family Dinner",
    "Date Night",
  ]

  const eventTypes: CalendarEvent['type'][] = ['meeting', 'focus_time', 'personal', 'break', 'other']
  const statuses: CalendarEvent['status'][] = ['confirmed', 'tentative', 'cancelled']

  const now = new Date()
  const attendeeNames = [
    "Sarah Chen", "Mike Johnson", "Emily Davis", "James Wilson",
    "Lisa Anderson", "David Martinez", "Jennifer Taylor", "Robert Brown"
  ]

  for (let i = 0; i < 30; i++) {
    const isPast = Math.random() > 0.5
    const daysOffset = isPast
      ? -Math.floor(Math.random() * 30) // Past 30 days
      : Math.floor(Math.random() * 30)   // Next 30 days

    const eventDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)
    const startHour = 9 + Math.floor(Math.random() * 9) // 9 AM - 6 PM
    const duration = [30, 60, 90, 120][Math.floor(Math.random() * 4)] // 30min - 2hr

    const startTime = new Date(eventDate)
    startTime.setHours(startHour, Math.floor(Math.random() * 4) * 15, 0, 0)

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000)

    const attendeeCount = Math.floor(Math.random() * 5) + 1
    const attendees = Array.from({ length: attendeeCount }, (_, i) => ({
      id: `attendee-${i}`,
      name: attendeeNames[i % attendeeNames.length],
      email: `${attendeeNames[i % attendeeNames.length].toLowerCase().replace(' ', '.')}@example.com`,
      status: ['accepted', 'declined', 'tentative', 'needs_action'][Math.floor(Math.random() * 4)] as any,
      isOrganizer: i === 0,
    }))

    const event: CalendarEvent = {
      id: generateId(),
      userId: mockUser.id,
      title: eventTitles[i % eventTitles.length],
      description: `Detailed agenda for ${eventTitles[i % eventTitles.length]}. Please come prepared and review materials beforehand.`,
      startTime,
      endTime,
      location: Math.random() > 0.5 ? `Room ${Math.floor(Math.random() * 20) + 100}` : undefined,
      attendees,
      isRecurring: Math.random() > 0.7,
      type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      googleEventId: `google-${generateId()}`,
      createdAt: new Date(startTime.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(startTime.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000),
    }

    // Add recurrence pattern for recurring events
    if (event.isRecurring) {
      event.recurrencePattern = {
        frequency: ['weekly', 'daily', 'monthly'][Math.floor(Math.random() * 3)] as any,
        interval: 1,
        endDate: addDays(startTime, 30),
      }
    }

    events.push(event)
  }

  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
}

// Generate emails
export const generateEmails = (): Email[] => {
  const emails: Email[] = []

  const subjects = [
    "Meeting Recap - Action Items",
    "Project Update - Q4 Planning",
    "Invitation: Team Building Event",
    "Urgent: Client Feedback Required",
    "Weekly Newsletter - Industry Insights",
    "Congratulations on Your Achievement!",
    "Follow-up from Our Conversation",
    "New Feature Release Announcement",
    "Budget Approval Request",
    "Training Opportunity - Advanced Skills",
    "Thank You for Your Presentation",
    "Schedule Change for Next Week",
    "Document Review Request",
    "Welcome to the Team!",
    "Holiday Schedule Update",
    "System Maintenance Notification",
    "Conference Registration Open",
    "Feedback Request: Recent Changes",
    "Important Security Update",
    "Quarterly Performance Review",
  ]

  const senderNames = [
    { name: "Sarah Chen", email: "sarah.chen@company.com" },
    { name: "Mike Johnson", email: "mike.johnson@company.com" },
    { name: "Emily Davis", email: "emily.davis@company.com" },
    { name: "James Wilson", email: "james.wilson@company.com" },
    { name: "Lisa Anderson", email: "lisa.anderson@company.com" },
    { name: "David Martinez", email: "david.martinez@company.com" },
    { name: "HR Department", email: "hr@company.com" },
    { name: "IT Support", email: "it.support@company.com" },
  ]

  const now = new Date()

  for (let i = 0; i < 50; i++) {
    const isPast = Math.random() > 0.1
    const daysOffset = isPast
      ? -Math.floor(Math.random() * 30) // Past 30 days
      : Math.floor(Math.random() * 2)    // Recent or future

    const receivedDate = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000)
    const sender = senderNames[Math.floor(Math.random() * senderNames.length)]

    const email: Email = {
      id: generateId(),
      userId: mockUser.id,
      threadId: `thread-${Math.floor(Math.random() * 10) + 1}`,
      subject: subjects[i % subjects.length],
      body: `Hi Alex,\n\nI hope this email finds you well. I wanted to reach out regarding ${subjects[i % subjects.length].toLowerCase()}.\n\nThis is an important matter that requires your attention. Please review the attached documents and let me know your thoughts at your earliest convenience.\n\nKey points to consider:\n- Timeline and deliverables\n- Budget constraints\n- Resource allocation\n- Risk assessment\n\nLooking forward to hearing from you soon.\n\nBest regards,\n${sender.name}`,
      bodyHtml: `<p>Hi Alex,</p><p>I hope this email finds you well. I wanted to reach out regarding ${subjects[i % subjects.length].toLowerCase()}.</p><p>This is an important matter that requires your attention. Please review the attached documents and let me know your thoughts at your earliest convenience.</p><p>Best regards,<br>${sender.name}</p>`,
      from: sender,
      to: [{ name: "Alex Johnson", email: mockUser.email }],
      cc: Math.random() > 0.7 ? [senderNames[Math.floor(Math.random() * senderNames.length)]] : undefined,
      attachments: Math.random() > 0.6 ? [
        {
          id: generateId(),
          filename: "document.pdf",
          size: 1024000,
          mimeType: "application/pdf",
          url: "https://example.com/document.pdf",
        }
      ] : [],
      labels: Math.random() > 0.5 ? ['important', 'work', 'personal'].filter(() => Math.random() > 0.5).map(label => ({
        id: `label-${label}`,
        name: label,
        color: ['blue', 'red', 'green', 'yellow'][Math.floor(Math.random() * 4)],
        type: 'user' as const,
      })) : [],
      isRead: Math.random() > 0.4,
      isImportant: Math.random() > 0.7,
      isStarred: Math.random() > 0.8,
      isDraft: Math.random() > 0.95,
      receivedAt: receivedDate,
      sentAt: Math.random() > 0.3 ? new Date(receivedDate.getTime() - Math.random() * 60000) : undefined,
      gmailId: `gmail-${generateId()}`,
      createdAt: receivedDate,
      updatedAt: receivedDate,
    }

    emails.push(email)
  }

  return emails.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime())
}

// Generate contacts
export const generateContacts = (): Contact[] => {
  const contacts: Contact[] = []

  const firstNames = [
    "Sarah", "Mike", "Emily", "James", "Lisa", "David", "Jennifer", "Robert",
    "Amanda", "Christopher", "Jessica", "Matthew", "Ashley", "Daniel", "Stephanie", "Mark"
  ]

  const lastNames = [
    "Chen", "Johnson", "Davis", "Wilson", "Anderson", "Martinez", "Taylor", "Brown",
    "Miller", "Jones", "Garcia", "Rodriguez", "Lee", "Walker", "Hall", "Allen"
  ]

  const companies = [
    "Tech Corp", "Innovation Inc", "Digital Solutions", "Creative Agency",
    "StartUp Hub", "Enterprise Systems", "Cloud Technologies", "Data Analytics Co"
  ]

  const jobTitles = [
    "Software Engineer", "Product Manager", "UX Designer", "Marketing Director",
    "Sales Representative", "Project Manager", "Data Scientist", "Business Analyst",
    "Team Lead", "Consultant", "Architect", "Specialist"
  ]

  for (let i = 0; i < 40; i++) {
    const firstName = firstNames[i % firstNames.length]
    const lastName = lastNames[i % lastNames.length]
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`

    const contact: Contact = {
      id: generateId(),
      userId: mockUser.id,
      firstName,
      lastName,
      email: [email],
      phone: Math.random() > 0.3 ? [`+1${Math.floor(Math.random() * 9000000000) + 1000000000}`] : [],
      company: companies[Math.floor(Math.random() * companies.length)],
      jobTitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
      address: Math.random() > 0.6 ? {
        street: `${Math.floor(Math.random() * 9999) + 1} Main St`,
        city: ["New York", "San Francisco", "Austin", "Seattle", "Boston"][Math.floor(Math.random() * 5)],
        state: ["NY", "CA", "TX", "WA", "MA"][Math.floor(Math.random() * 5)],
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        country: "USA"
      } : undefined,
      birthday: Math.random() > 0.7 ? new Date(1970 + Math.floor(Math.random() * 40), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1) : undefined,
      notes: Math.random() > 0.8 ? `Met at ${['conference', 'meeting', 'workshop', 'networking event'][Math.floor(Math.random() * 4)]}. Great connection for future collaboration.` : undefined,
      tags: ['client', 'colleague', 'friend', 'family', 'mentor', 'lead', 'vendor'].filter(() => Math.random() > 0.7),
      photo: Math.random() > 0.5 ? `https://images.unsplash.com/photo-${Math.floor(Math.random() * 10000000000)}?w=150&h=150&fit=crop&crop=face` : undefined,
      isFavorite: Math.random() > 0.8,
      lastContacted: Math.random() > 0.4 ? new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
      googleContactId: `google-${generateId()}`,
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    }

    contacts.push(contact)
  }

  return contacts.sort((a, b) => a.lastName.localeCompare(b.lastName))
}

// Generate all dummy data
export const generateAllDummyData = () => {
  return {
    user: mockUser,
    journalEntries: generateJournalEntries(),
    tasks: generateTasks(),
    events: generateCalendarEvents(),
    emails: generateEmails(),
    contacts: generateContacts(),
  }
}