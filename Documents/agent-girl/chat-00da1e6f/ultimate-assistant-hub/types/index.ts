// Core API types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

// Auth types
export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  image?: string;
  emailVerified?: Date;
}

export interface AuthSession {
  user: AuthUser;
  expires: string;
  accessToken?: string;
  refreshToken?: string;
}

// Dashboard types
export interface DashboardMetrics {
  tasksSummary: {
    total: number;
    completed: number;
    inProgress: number;
    overdue: number;
  };
  journalSummary: {
    totalEntries: number;
    thisWeek: number;
    thisMonth: number;
    averageMood: number;
  };
  calendarSummary: {
    todayEvents: number;
    upcomingEvents: number;
    thisWeekEvents: number;
  };
  emailSummary: {
    unread: number;
    total: number;
    important: number;
  };
  contactsSummary: {
    total: number;
    recent: number;
    favorites: number;
  };
  productivityScore: number;
  weeklyActivity: {
    date: string;
    tasks: number;
    journal: number;
    events: number;
  }[];
}

// Journal types
export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  mood?: string;
  tags: string[];
  isPrivate: boolean;
  aiReflection?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateJournalEntryInput {
  title: string;
  content: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  mood?: string;
  tags?: string[];
  isPrivate?: boolean;
}

export interface JournalFilters {
  mood?: string;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

// Tasks types
export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: Date;
  completedAt?: Date;
  estimatedTime?: number;
  actualTime?: number;
  motionTaskId?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: Priority;
  dueDate?: Date;
  estimatedTime?: number;
  tags?: string[];
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: Date;
  estimatedTime?: number;
  actualTime?: number;
  tags?: string[];
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: Priority;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  tags?: string[];
  search?: string;
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
  isAllDay: boolean;
  googleEventId?: string;
  status: string;
  attendees: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCalendarEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  isAllDay?: boolean;
  attendees?: string[];
}

export interface UpdateCalendarEventInput {
  title?: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  location?: string;
  isAllDay?: boolean;
  status?: string;
  attendees?: string[];
}

export interface CalendarFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: string;
  location?: string;
  search?: string;
}

// Email types
export interface Email {
  id: string;
  userId: string;
  messageId: string;
  threadId?: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  content?: string;
  htmlContent?: string;
  isRead: boolean;
  isImportant: boolean;
  isDraft: boolean;
  attachments: string[];
  labels: string[];
  receivedAt: Date;
  sentAt?: Date;
  gmailId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SendEmailInput {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  htmlContent?: string;
  attachments?: string[];
}

export interface EmailFilters {
  isRead?: boolean;
  isImportant?: boolean;
  isDraft?: boolean;
  labels?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  from?: string;
  search?: string;
}

// Contacts types
export interface Contact {
  id: string;
  userId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags: string[];
  googleContactId?: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  notes?: string;
  tags?: string[];
  isFavorite?: boolean;
}

export interface ContactFilters {
  company?: string;
  tags?: string[];
  isFavorite?: boolean;
  search?: string;
}

// Analytics types
export interface UserMetric {
  id: string;
  userId: string;
  metricType: string;
  metricValue: number;
  metricDate: Date;
  metadata?: any;
  createdAt: Date;
}

export interface AnalyticsQuery {
  metricTypes?: string[];
  dateFrom?: Date;
  dateTo?: Date;
  granularity?: 'day' | 'week' | 'month';
}

export interface ProductivityInsights {
  overallScore: number;
  trends: {
    taskCompletion: number;
    journalFrequency: number;
    calendarUtilization: number;
    emailResponse: number;
  };
  recommendations: string[];
  achievements: {
    type: string;
    description: string;
    achievedAt: Date;
  }[];
}

// Error types
export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: any;
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // Business logic errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_LOCKED: 'RESOURCE_LOCKED',
  INVALID_OPERATION: 'INVALID_OPERATION'
} as const;

// HTTP Status Codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;