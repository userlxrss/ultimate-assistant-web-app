// Core application types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  dailyDigest: boolean;
  weeklyReport: boolean;
  journalReminder: boolean;
  taskReminder: boolean;
  calendarSummary: boolean;
}

export interface PrivacySettings {
  shareAnalytics: boolean;
  shareInsights: boolean;
  dataRetention: number; // days
}

// Journal types
export interface JournalEntry {
  id: string;
  userId: string;
  date: Date;
  reflections: string;
  mood: number; // 1-10
  biggestWin: string;
  learning: string;
  tags: string[];
  isPrivate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MoodAnalytics {
  averageMood: number;
  moodTrend: 'improving' | 'declining' | 'stable';
  currentStreak: number;
  longestStreak: number;
  moodDistribution: MoodDistribution[];
  weeklyComparison: WeekComparison;
}

export interface MoodDistribution {
  mood: number;
  count: number;
  percentage: number;
  emoji: string;
}

export interface WeekComparison {
  thisWeek: number;
  lastWeek: number;
  change: number;
  changePercent: number;
}

// Task types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimatedDuration?: number; // minutes
  actualDuration?: number;
  projectId?: string;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  motionId?: string; // Integration with Motion API
}

export interface TaskAnalytics {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  tasksDueToday: number;
  tasksThisWeek: number;
  averageCompletionTime: number; // hours
  productivityScore: number;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Calendar types
export interface CalendarEvent {
  id: string;
  userId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees: Attendee[];
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
  type: 'meeting' | 'focus_time' | 'personal' | 'break' | 'other';
  status: 'confirmed' | 'tentative' | 'cancelled';
  googleEventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attendee {
  id: string;
  name: string;
  email: string;
  status: 'accepted' | 'declined' | 'tentative' | 'needs_action';
  isOrganizer: boolean;
}

export interface RecurrencePattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
}

export interface CalendarConflict {
  event1: CalendarEvent;
  event2: CalendarEvent;
  conflictType: 'overlap' | 'back_to_back' | 'double_booking';
  suggestion?: ConflictSuggestion;
}

export interface ConflictSuggestion {
  type: 'reschedule' | 'shorten' | 'cancel';
  newTime?: Date;
  reason: string;
}

// Email types
export interface Email {
  id: string;
  userId: string;
  threadId: string;
  subject: string;
  body: string;
  bodyHtml?: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  attachments: EmailAttachment[];
  labels: EmailLabel[];
  isRead: boolean;
  isImportant: boolean;
  isStarred: boolean;
  isDraft: boolean;
  sentAt?: Date;
  receivedAt: Date;
  gmailId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAddress {
  name: string;
  email: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  size: number;
  mimeType: string;
  url?: string;
  gmailId?: string;
}

export interface EmailLabel {
  id: string;
  name: string;
  color: string;
  type: 'system' | 'user';
  gmailId?: string;
}

// Contact types
export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string[];
  phone: string[];
  company?: string;
  jobTitle?: string;
  address?: Address;
  birthday?: Date;
  notes?: string;
  tags: string[];
  photo?: string;
  isFavorite: boolean;
  lastContacted?: Date;
  googleContactId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// Dashboard types
export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  isVisible: boolean;
}

export type WidgetType =
  | 'mood_overview'
  | 'tasks_summary'
  | 'upcoming_events'
  | 'recent_activity'
  | 'productivity_score'
  | 'mood_trend'
  | 'journal_streak'
  | 'energy_correlation';

export interface WidgetPosition {
  x: number;
  y: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  dateRange: number; // days
  refreshInterval: number; // minutes
  showDetails: boolean;
  customSettings?: Record<string, any>;
}

export interface DashboardData {
  todayStats: TodayStats;
  moodAnalytics: MoodAnalytics;
  taskAnalytics: TaskAnalytics;
  upcomingEvents: CalendarEvent[];
  recentActivity: ActivityItem[];
  productivityScore: ProductivityScore;
  insights: Insight[];
}

export interface TodayStats {
  mood: {
    score: number;
    emoji: string;
    trend: 'up' | 'down' | 'same';
  };
  tasks: {
    total: number;
    completed: number;
    percentage: number;
  };
  nextEvent?: {
    title: string;
    startTime: Date;
    countdown: string;
  };
  winsThisWeek: number;
}

export interface ActivityItem {
  id: string;
  type: 'journal' | 'task' | 'calendar' | 'email' | 'contact';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface ProductivityScore {
  overall: number;
  taskCompletion: number;
  journalConsistency: number;
  calendarAdherence: number;
  emailResponsiveness: number;
  trend: 'improving' | 'declining' | 'stable';
}

export interface Insight {
  id: string;
  type: 'pattern' | 'recommendation' | 'achievement' | 'warning';
  title: string;
  description: string;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

// API Integration types
export interface MotionApiConfig {
  apiKey: string;
  workspaceId: string;
  syncEnabled: boolean;
  lastSync: Date;
}

export interface GoogleApiConfig {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  scopes: string[];
  calendarEnabled: boolean;
  gmailEnabled: boolean;
  contactsEnabled: boolean;
}

export interface SyncStatus {
  service: 'motion' | 'google_calendar' | 'google_gmail' | 'google_contacts';
  status: 'synced' | 'syncing' | 'error' | 'disabled';
  lastSync: Date;
  error?: string;
}

// UI State types
export interface AppState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  currentModule: ModuleType;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';
}

export type ModuleType = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts';

// Form types
export interface JournalFormData {
  date: Date;
  reflections: string;
  mood: number;
  biggestWin: string;
  learning: string;
  tags: string[];
  isPrivate: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  dueDate?: Date;
  priority: Task['priority'];
  estimatedDuration?: number;
  projectId?: string;
  labels: string[];
}

export interface EventFormData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendeeEmails?: string[];
  type: CalendarEvent['type'];
  isRecurring: boolean;
  recurrencePattern?: RecurrencePattern;
}

export interface EmailFormData {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
  isDraft: boolean;
  scheduledAt?: Date;
}

export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string[];
  phone: string[];
  company?: string;
  jobTitle?: string;
  address?: Address;
  birthday?: Date;
  notes?: string;
  tags: string[];
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface MoodChartData extends ChartDataPoint {
  mood: number;
  tasksCompleted: number;
}

export interface ProductivityChartData extends ChartDataPoint {
  tasksCompleted: number;
  journalEntries: number;
  meetingsAttended: number;
}

export interface HeatmapData {
  date: string;
  intensity: number;
  value: number;
  label?: string;
}

// Search and filter types
export interface SearchFilters {
  dateRange?: {
    start: Date;
    end: Date;
  };
  tags?: string[];
  moodRange?: [number, number];
  priority?: Task['priority'][];
  status?: Task['status'][];
  type?: CalendarEvent['type'][];
  hasAttachments?: boolean;
  isUnread?: boolean;
}

export interface SearchResult {
  type: 'journal' | 'task' | 'event' | 'email' | 'contact';
  id: string;
  title: string;
  description: string;
  relevanceScore: number;
  highlight?: string;
  metadata?: Record<string, any>;
}

// Export and import types
export interface ExportOptions {
  format: 'json' | 'csv' | 'pdf';
  dateRange: {
    start: Date;
    end: Date;
  };
  includeModules: ModuleType[];
  anonymizeData: boolean;
}

export interface ImportResult {
  success: boolean;
  itemsProcessed: number;
  itemsImported: number;
  itemsSkipped: number;
  errors: ImportError[];
}

export interface ImportError {
  line?: number;
  field?: string;
  message: string;
  data?: any;
}