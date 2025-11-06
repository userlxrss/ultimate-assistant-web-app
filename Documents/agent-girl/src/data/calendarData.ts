import { CalendarEvent, EventType, Attendee, EventTemplate, Reminder, RecurrenceRule, ConferenceData } from '../types/calendar';

export const eventTypes: EventType[] = [
  { id: 'meeting', name: 'Meeting', color: '#69b491', icon: '🤝', defaultDuration: 60 },
  { id: 'call', name: 'Phone Call', color: '#6886b4', icon: '📞', defaultDuration: 30 },
  { id: 'focus', name: 'Focus Time', color: '#b9a4e1', icon: '🎯', defaultDuration: 90 },
  { id: 'break', name: 'Break', color: '#87c3a7', icon: '☕', defaultDuration: 15 },
  { id: 'learning', name: 'Learning', color: '#f59e0b', icon: '📚', defaultDuration: 60 },
  { id: 'exercise', name: 'Exercise', color: '#ef4444', icon: '🏃', defaultDuration: 45 },
  { id: 'personal', name: 'Personal', color: '#8b5cf6', icon: '👤', defaultDuration: 30 },
  { id: 'travel', name: 'Travel', color: '#06b6d4', icon: '✈️', defaultDuration: 120 },
  { id: 'lunch', name: 'Lunch', color: '#10b981', icon: '🍽️', defaultDuration: 60 },
  { id: 'review', name: 'Review', color: '#f97316', icon: '📋', defaultDuration: 45 },
];

const sampleAttendees: Attendee[] = [
  { email: 'user@example.com', name: 'John Doe', responseStatus: 'accepted', isOrganizer: true },
  { email: 'alice@company.com', name: 'Alice Smith', responseStatus: 'accepted' },
  { email: 'bob@company.com', name: 'Bob Johnson', responseStatus: 'tentative' },
  { email: 'carol@company.com', name: 'Carol Williams', responseStatus: 'needsAction' },
  { email: 'david@company.com', name: 'David Brown', responseStatus: 'accepted' },
  { email: 'emma@company.com', name: 'Emma Davis', responseStatus: 'declined' },
  { email: 'frank@company.com', name: 'Frank Miller', responseStatus: 'accepted' },
  { email: 'grace@company.com', name: 'Grace Wilson', responseStatus: 'needsAction' },
];

const conferenceData: ConferenceData = {
  conferenceId: 'abc123-meeting',
  conferenceSolution: {
    name: 'Google Meet',
    iconUri: 'https://meet.google.com/favicon.ico',
  },
  entryPoints: [
    {
      entryPointType: 'video',
      uri: 'https://meet.google.com/abc-123-def',
      label: 'Google Meet',
    },
  ],
};

const createSampleReminders = (): Reminder[] => [
  { id: '1', type: 'popup', minutesBefore: 15, enabled: true },
  { id: '2', type: 'email', minutesBefore: 60, enabled: true },
];

// Generate 30+ events (15 past, 15+ future)
export const generateSampleEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const now = new Date();
  const eventIdCounter = 1;

  // Helper function to create events
  const createEvent = (
    title: string,
    startOffset: number,
    duration: number,
    type: string,
    description?: string,
    location?: string,
    isRecurring = false,
    recurrenceRule?: RecurrenceRule,
    attendees: Attendee[] = [sampleAttendees[0]]
  ): CalendarEvent => {
    const startTime = new Date(now.getTime() + startOffset * 60 * 60 * 1000);
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const eventType = eventTypes.find(t => t.id === type) || eventTypes[0];

    return {
      id: `event-${eventIdCounter + events.length}`,
      title,
      description,
      startTime,
      endTime,
      location,
      attendees,
      type: eventType,
      color: eventType.color,
      isRecurring,
      recurrenceRule,
      reminders: createSampleReminders(),
      bufferTime: type === 'meeting' ? 15 : 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visibility: 'public',
      status: 'confirmed',
      creator: sampleAttendees[0],
      organizer: sampleAttendees[0],
      conferenceData: type === 'meeting' || type === 'call' ? conferenceData : undefined,
    };
  };

  // PAST EVENTS (15 events)

  // Yesterday's meetings
  events.push(createEvent(
    'Team Standup',
    -25, // Yesterday 9 AM
    30,
    'meeting',
    'Daily sync with the development team',
    'Conference Room A'
  ));

  events.push(createEvent(
    'Product Review',
    -24, // Yesterday 10 AM
    90,
    'meeting',
    'Review new product features',
    'Main Conference Room',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[2]]
  ));

  events.push(createEvent(
    'Client Call - ABC Corp',
    -22, // Yesterday 12 PM
    60,
    'call',
    'Discuss project requirements',
    undefined,
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[3]]
  ));

  events.push(createEvent(
    'Lunch with Team',
    -21, // Yesterday 1 PM
    60,
    'lunch',
    'Team building lunch',
    'Local Restaurant'
  ));

  events.push(createEvent(
    'Focus Time - Development',
    -20, // Yesterday 2 PM
    120,
    'focus',
    'Work on feature implementation',
    undefined,
    false,
    undefined,
    [sampleAttendees[0]]
  ));

  events.push(createEvent(
    'Design Review',
    -18.5, // Yesterday 4:30 PM
    60,
    'review',
    'Review UI/UX designs',
    'Design Lab'
  ));

  // 2 days ago
  events.push(createEvent(
    'Weekly Planning',
    -49, // 2 days ago 9 AM
    60,
    'meeting',
    'Plan weekly tasks and goals',
    'Conference Room B'
  ));

  events.push(createEvent(
    'Gym Session',
    -47, // 2 days ago 11 AM
    45,
    'exercise',
    'Morning workout',
    'Fitness Center'
  ));

  events.push(createEvent(
    'Learning: React Patterns',
    -45.5, // 2 days ago 1:30 PM
    90,
    'learning',
    'Study advanced React patterns',
    undefined,
    false,
    undefined,
    [sampleAttendees[0]]
  ));

  // 3 days ago
  events.push(createEvent(
    'Doctor Appointment',
    -73, // 3 days ago 10 AM
    30,
    'personal',
    'Annual checkup',
    'Medical Center'
  ));

  events.push(createEvent(
    'Project Kickoff - New Initiative',
    -72, // 3 days ago 11 AM
    120,
    'meeting',
    'Kickoff meeting for new project',
    'Main Conference Room',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[2], sampleAttendees[4]]
  ));

  // Last week
  events.push(createEvent(
    'Monday Team Sync',
    -169, // Last Monday 9 AM
    60,
    'meeting',
    'Weekly team synchronization',
    'Conference Room A',
    true,
    {
      frequency: 'WEEKLY',
      interval: 1,
      byWeekDay: [1], // Monday
      count: 12
    }
  ));

  events.push(createEvent(
    'Coffee Break',
    -168, // Last Monday 10 AM
    15,
    'break',
    'Quick coffee break',
    undefined,
    true,
    {
      frequency: 'DAILY',
      interval: 1,
      byWeekDay: [1, 2, 3, 4, 5], // Weekdays
      count: 60
    }
  ));

  events.push(createEvent(
    'Code Review Session',
    -167, // Last Monday 11 AM
    60,
    'review',
    'Review pull requests',
    'Development Area',
    true,
    {
      frequency: 'WEEKLY',
      interval: 1,
      byWeekDay: [1, 3, 5], // Mon, Wed, Fri
      count: 12
    }
  ));

  // FUTURE EVENTS (15+ events)

  // Today's events
  events.push(createEvent(
    'Morning Yoga',
    2, // Today 7 AM
    30,
    'exercise',
    'Morning yoga session',
    'Home'
  ));

  events.push(createEvent(
    'Daily Standup',
    9, // Today 9 AM
    30,
    'meeting',
    'Daily team sync',
    'Conference Room A'
  ));

  events.push(createEvent(
    'Focus Time - Feature Development',
    10, // Today 9:30 AM
    120,
    'focus',
    'Deep work on new feature',
    undefined
  ));

  events.push(createEvent(
    'Lunch with Sarah',
    13, // Today 12 PM
    60,
    'lunch',
    'Discuss collaboration opportunities',
    'Downtown Cafe',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[5]]
  ));

  events.push(createEvent(
    'Client Presentation - XYZ Company',
    14, // Today 1 PM
    90,
    'meeting',
    'Present quarterly results',
    'Client Office',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[6]]
  ));

  events.push(createEvent(
    'Team Retrospective',
    16, // Today 3 PM
    60,
    'meeting',
    'Sprint retrospective',
    'Conference Room B',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[2], sampleAttendees[7]]
  ));

  // CONFLICT EVENT - Same time as retrospective
  events.push(createEvent(
    'Important Client Call',
    16, // Today 3 PM - CONFLICT!
    45,
    'call',
    'Urgent client discussion',
    undefined,
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[3]]
  ));

  events.push(createEvent(
    'Evening Walk',
    18, // Today 5 PM
    30,
    'exercise',
    'Evening walk in the park',
    'Local Park'
  ));

  // Tomorrow
  events.push(createEvent(
    'Strategy Planning Session',
    33, // Tomorrow 9 AM
    180,
    'meeting',
    'Quarterly strategy planning',
    'Executive Conference Room',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[2], sampleAttendees[4], sampleAttendees[6]]
  ));

  events.push(createEvent(
    '1:1 with Manager',
    37, // Tomorrow 1 PM
    60,
    'meeting',
    'Monthly 1:1 discussion',
    'Office Room 201'
  ));

  // This week
  events.push(createEvent(
    'Team Building Event',
    58, // Thursday 2 PM
    180,
    'personal',
    'Quarterly team building activity',
    'Off-site location',
    false,
    undefined,
    sampleAttendees.slice(0, 5)
  ));

  events.push(createEvent(
    'Learning: TypeScript Advanced',
    49, // Wednesday 2 PM
    90,
    'learning',
    'Advanced TypeScript patterns and techniques',
    undefined
  ));

  // Next week
  events.push(createEvent(
    'Board Meeting',
    169, // Next Monday 9 AM
    120,
    'meeting',
    'Monthly board meeting',
    'Board Room',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[4], sampleAttendees[6]]
  ));

  events.push(createEvent(
    'Product Launch Preparation',
    171, // Next Monday 11 AM
    180,
    'meeting',
    'Final preparations for product launch',
    'Main Conference Room',
    false,
    undefined,
    [sampleAttendees[0], sampleAttendees[1], sampleAttendees[2], sampleAttendees[7]]
  ));

  events.push(createEvent(
    'Travel to Conference',
    190, // Next Wednesday 8 AM
    480, // 8 hours
    'travel',
    'Travel to tech conference',
    'Conference Center'
  ));

  events.push(createEvent(
    'Conference Registration',
    194, // Next Wednesday 4 PM
    60,
    'personal',
    'Register and pick up conference materials',
    'Conference Center'
  ));

  events.push(createEvent(
    'Tech Conference - Day 1',
    197, // Next Thursday 9 AM
    480, // 8 hours
    'learning',
    'Attend tech conference sessions and workshops',
    'Convention Center'
  ));

  return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
};

export const eventTemplates: EventTemplate[] = [
  {
    id: 'template-1',
    name: 'Team Meeting',
    title: 'Team Meeting - {{team}}',
    description: 'Weekly team sync and status update',
    duration: 60,
    type: 'meeting',
    color: '#69b491',
    attendees: [
      { email: 'user@example.com', name: 'John Doe', responseStatus: 'accepted' },
    ],
    reminders: [
      { type: 'popup', minutesBefore: 15, enabled: true },
      { type: 'email', minutesBefore: 60, enabled: true },
    ],
    bufferTime: 15,
  },
  {
    id: 'template-2',
    name: 'Focus Time',
    title: 'Focus Time - {{task}}',
    description: 'Deep work session without interruptions',
    duration: 90,
    type: 'focus',
    color: '#b9a4e1',
    attendees: [
      { email: 'user@example.com', name: 'John Doe', responseStatus: 'accepted' },
    ],
    reminders: [
      { type: 'popup', minutesBefore: 5, enabled: true },
    ],
    bufferTime: 0,
  },
  {
    id: 'template-3',
    name: 'Client Call',
    title: 'Client Call - {{client}}',
    description: 'Discussion with client about {{topic}}',
    duration: 45,
    type: 'call',
    color: '#6886b4',
    attendees: [
      { email: 'user@example.com', name: 'John Doe', responseStatus: 'accepted' },
    ],
    reminders: [
      { type: 'popup', minutesBefore: 15, enabled: true },
      { type: 'email', minutesBefore: 60, enabled: true },
    ],
    bufferTime: 10,
  },
];