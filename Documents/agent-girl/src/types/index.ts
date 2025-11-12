// Enhanced Email interface for Gmail-like functionality
export interface Email {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  bodyPlain?: string;
  date: Date;
  sent: boolean;
  read: boolean;
  starred: boolean;
  important: boolean;
  archived: boolean;
  deleted: boolean;
  draft: boolean;
  labels: EmailLabel[];
  attachments: EmailAttachment[];
  category: EmailCategory;
  folder: EmailFolder;
  snippet: string;
  hasAttachments: boolean;
  isEncrypted: boolean;
  signature?: string;
  scheduledFor?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size: number; // bytes
  messageCount?: number; // for threads
  replyTo?: EmailAddress;
  headers?: Record<string, string>;
}

export interface EmailAddress {
  name: string;
  email: string;
  avatar?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user' | 'category';
}

export interface EmailAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  inline: boolean;
  thumbnail?: string;
}

export type EmailCategory =
  | 'primary'
  | 'social'
  | 'promotions'
  | 'updates'
  | 'forums'
  | 'spam'
  | 'trash';

export type EmailFolder =
  | 'inbox'
  | 'sent'
  | 'drafts'
  | 'starred'
  | 'important'
  | 'archived'
  | 'spam'
  | 'trash'
  | 'all';

export interface EmailThread {
  id: string;
  messages: Email[];
  subject: string;
  participants: EmailAddress[];
  lastMessageDate: Date;
  messageCount: number;
  unreadCount: number;
  hasAttachments: boolean;
  labels: EmailLabel[];
  snippet: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: TemplateVariable[];
  category: string;
  lastUsed?: Date;
  useCount: number;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'email' | 'date' | 'number';
  defaultValue?: string;
  required: boolean;
}

export interface EmailFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  actions: FilterAction[];
  enabled: boolean;
}

export interface FilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  hasAttachment?: boolean;
  size?: {
    operator: '>' | '<' | '=';
    value: number;
    unit: 'KB' | 'MB' | 'GB';
  };
  date?: {
    operator: '>' | '<' | '=';
    value: Date;
  };
  labels?: string[];
  read?: boolean;
  starred?: boolean;
}

export interface FilterAction {
  type: 'apply_label' | 'archive' | 'mark_read' | 'star' | 'forward' | 'delete' | 'move_to';
  value?: string;
}

export interface EmailSignature {
  id: string;
  name: string;
  content: string;
  isDefault: boolean;
}

export interface EmailAnalytics {
  totalEmails: number;
  sentEmails: number;
  receivedEmails: number;
  unreadEmails: number;
  starredEmails: number;
  archivedEmails: number;
  deletedEmails: number;
  averageResponseTime: number; // hours
  topSenders: Array<{ email: string; name: string; count: number }>;
  topLabels: Array<{ label: string; count: number }>;
  emailTrends: Array<{ date: string; sent: number; received: number }>;
  storageUsed: number; // bytes
  storageQuota: number; // bytes
}

export interface EmailSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  autoSaveDrafts: boolean;
  autoSaveInterval: number; // seconds
  enableUndoSend: boolean;
  undoSendDelay: number; // seconds
  enableReadReceipts: boolean;
  enableSendReceipts: boolean;
  defaultSignature?: string;
  defaultCc?: EmailAddress[];
  defaultBcc?: EmailAddress[];
  replyAll: boolean;
  includeOriginalMessage: boolean;
  attachmentSizeLimit: number; // MB
  compactView: boolean;
  showPreviews: boolean;
  enableKeyboardShortcuts: boolean;
  autoAdvance: boolean;
  enableSmartCompose: boolean;
  enableSmartReply: boolean;
}

export interface ComposeEmailData {
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  attachments: File[];
  draftId?: string;
  replyToId?: string;
  forwardOfId?: string;
  templateId?: string;
  scheduledFor?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  signature?: string;
}

export interface SearchQuery {
  query?: string;
  from?: string;
  to?: string;
  subject?: string;
  body?: string;
  hasAttachment?: boolean;
  labels?: string[];
  category?: EmailCategory;
  folder?: EmailFolder;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  size?: {
    operator: '>' | '<' | '=';
    value: number;
    unit: 'KB' | 'MB' | 'GB';
  };
  read?: boolean;
  starred?: boolean;
}

export interface QuickReply {
  id: string;
  text: string;
  language: string;
  confidence: number;
}

// Existing interfaces from other modules
export interface MoodEntry {
  date: Date;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  notes?: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
}

export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  mood: number;
  themes: string[];
  insights: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  duration: number; // minutes
  type: 'meeting' | 'personal' | 'work' | 'learning' | 'health';
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  role?: string;
  createdAt: Date;
  category: string;
  lastContact?: Date;
  notes?: string;
  avatar?: string;
  favorite?: boolean;
}

export interface Activity {
  id: string;
  type: 'task' | 'journal' | 'email' | 'event' | 'contact';
  title: string;
  date: Date;
  description?: string;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  totalJournalEntries: number;
  totalEmails: number;
  totalEvents: number;
  totalContacts: number;
  averageMood: number;
  averageEnergy: number;
  productivityScore: number;
}

export interface AIInsight {
  type: 'pattern' | 'recommendation' | 'motivation';
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
}

export interface WeeklyComparison {
  currentWeek: {
    tasksCompleted: number;
    journalEntries: number;
    averageMood: number;
    meetingHours: number;
  };
  previousWeek: {
    tasksCompleted: number;
    journalEntries: number;
    averageMood: number;
    meetingHours: number;
  };
}

// Time Tracking Types
export interface TimeEntry {
  id: string;
  date: string; // YYYY-MM-DD format
  clockIn: Date | null;
  clockOut: Date | null;
  lunchBreak: LunchBreak | null;
  shortBreaks: ShortBreak[];
  totalHours: number; // Calculated excluding breaks
  status: 'not_started' | 'clocked_in' | 'on_break' | 'clocked_out';
  notes?: string;
  isLateArrival: boolean;
  scheduledStartTime?: string; // HH:MM format
}

export interface LunchBreak {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration?: number; // in minutes
}

export interface ShortBreak {
  id: string;
  startTime: Date;
  endTime: Date | null;
  duration?: number; // in minutes
  reason?: string;
}

export interface TimesheetFilter {
  dateRange: {
    start: Date;
    end: Date;
  };
  status?: TimeEntry['status'];
  showLateArrivalsOnly?: boolean;
  minHours?: number;
  maxHours?: number;
}

export interface TimesheetSummary {
  totalDays: number;
  totalHours: number;
  averageHoursPerDay: number;
  totalBreakTime: number;
  lateArrivals: number;
  onTimeArrivals: number;
  overtimeHours: number;
  regularHours: number;
}

export interface TimeTrackingSettings {
  workdayStart: string; // HH:MM format
  workdayEnd: string; // HH:MM format
  lunchBreakDuration: number; // minutes
  lateArrivalThreshold: number; // minutes after workdayStart
  autoClockOut: boolean;
  autoClockOutTime: string; // HH:MM format
  roundTime: boolean;
  roundToMinutes: number; // 5, 10, 15, etc.
  enableNotifications: boolean;
  breakReminderInterval: number; // minutes
}