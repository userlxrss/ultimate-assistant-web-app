export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees: Attendee[];
  type: EventType;
  color?: string;
  isRecurring?: boolean;
  recurrenceRule?: RecurrenceRule;
  reminders: Reminder[];
  bufferTime?: number; // minutes
  timezone: string;
  visibility: 'public' | 'private' | 'confidential';
  status: 'confirmed' | 'tentative' | 'cancelled';
  creator: Attendee;
  organizer?: Attendee;
  attachments?: Attachment[];
  notes?: string;
  conferenceData?: ConferenceData;
  extendedProperties?: Record<string, any>;
}

export interface Attendee {
  id?: string;
  email: string;
  name?: string;
  responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  optional?: boolean;
  isOrganizer?: boolean;
  isResource?: boolean;
  comment?: string;
}

export interface EventType {
  id: string;
  name: string;
  color: string;
  icon: string;
  defaultDuration: number; // minutes
}

export interface RecurrenceRule {
  frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';
  interval: number; // e.g., 1 for every week, 2 for every other week
  until?: Date;
  count?: number; // number of occurrences
  byWeekDay?: number[]; // 0-6, Sunday-Saturday
  byMonthDay?: number[];
  byMonth?: number[];
}

export interface Reminder {
  id: string;
  type: 'email' | 'popup' | 'sms';
  minutesBefore: number;
  method?: 'override' | 'absolute';
  enabled: boolean;
}

export interface Attachment {
  id: string;
  title: string;
  url: string;
  mimeType: string;
  size?: number;
  iconLink?: string;
}

export interface ConferenceData {
  conferenceId: string;
  conferenceSolution: {
    name: string;
    iconUri: string;
    key?: {
      type: string;
    };
  };
  entryPoints: {
    entryPointType: 'video' | 'phone' | 'sip';
    uri: string;
    label?: string;
    accessCode?: string;
    password?: string;
  }[];
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  conflicts?: CalendarEvent[];
  score?: number; // for "Find Time" feature
}

export interface CalendarView {
  type: 'week' | 'month' | 'day' | 'agenda';
  startDate: Date;
  endDate: Date;
}

export interface EventTemplate {
  id: string;
  name: string;
  title: string;
  description?: string;
  duration: number;
  type: string;
  color: string;
  attendees: Omit<Attendee, 'id'>[];
  reminders: Omit<Reminder, 'id'>[];
  bufferTime?: number;
}

export interface DaySummary {
  date: Date;
  totalEvents: number;
  totalHours: number;
  eventsByType: Record<string, number>;
  conflicts: CalendarEvent[];
  suggestions: string[];
  highlights: CalendarEvent[];
}

export interface ConflictResolution {
  originalEvent: CalendarEvent;
  suggestedSlots: TimeSlot[];
  resolutionType: 'reschedule' | 'buffer' | 'split' | 'skip';
  reason: string;
}

export interface ExportOptions {
  format: 'pdf' | 'ical' | 'csv';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeDetails: boolean;
  includeAttachments: boolean;
}

export interface SearchFilters {
  query?: string;
  eventTypes?: string[];
  attendees?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  status?: CalendarEvent['status'][];
  hasAttachments?: boolean;
  isRecurring?: boolean;
  hasConflicts?: boolean;
}

export interface CalendarPreferences {
  defaultView: CalendarView['type'];
  workingHours: {
    start: string; // "09:00"
    end: string; // "17:00"
    days: number[]; // 1-5 for Mon-Fri
  };
  timezone: string;
  defaultEventDuration: number;
  defaultReminders: Reminder[];
  weekStartDay: 0 | 1; // 0=Sunday, 1=Monday
  showWeekNumbers: boolean;
  timeFormat: '12h' | '24h';
  dateFormat: string;
  enableBufferTime: boolean;
  defaultBufferTime: number;
  workingLocationDefaults: {
    inOfficeDays: number[];
    remoteDays: number[];
  };
}