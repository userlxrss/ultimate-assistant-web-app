# Data Models and Schemas

This document defines the comprehensive data models and schemas used throughout the Assistant Hub application.

## Core Data Models

### User Model
```typescript
interface User {
  // Primary fields
  id: string;                    // UUID v4
  email: string;                 // Email address (unique)
  username: string;              // Unique username
  name: string;                  // Display name

  // Profile information
  avatar?: string;               // Profile image URL
  bio?: string;                  // User biography
  timezone: string;              // IANA timezone identifier
  locale: string;                // Language/locale code (ISO 639-1)

  // Authentication
  passwordHash: string;          // Bcrypt hash
  emailVerified: boolean;        // Email verification status
  emailVerificationToken?: string; // Verification token
  passwordResetToken?: string;   // Password reset token
  passwordResetExpires?: Date;   // Reset token expiration

  // Preferences
  preferences: UserPreferences;

  // Security
  twoFactorEnabled: boolean;     // 2FA status
  twoFactorSecret?: string;      // TOTP secret
  lastLoginAt?: Date;            // Last login timestamp
  lastLoginIp?: string;          // Last login IP address

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;              // Soft delete timestamp
}

interface UserPreferences {
  // UI preferences
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  weekStartsOn: 0 | 1; // 0 = Sunday, 1 = Monday

  // Notification preferences
  notifications: {
    email: boolean;
    push: boolean;
    taskReminders: boolean;
    calendarAlerts: boolean;
    emailNotifications: boolean;
    mentions: boolean;
  };

  // Privacy preferences
  shareProfile: boolean;
  showOnlineStatus: boolean;
  allowInvitations: boolean;

  // Integration preferences
  autoSync: {
    motion: boolean;
    googleCalendar: boolean;
    googleContacts: boolean;
    gmail: boolean;
  };

  // Task preferences
  defaultTaskPriority: 'low' | 'medium' | 'high' | 'urgent';
  defaultTaskDuration: number; // in minutes
  taskAutoArchive: boolean;
  taskArchiveAfter: number; // in days

  // Calendar preferences
  defaultCalendarView: 'day' | 'week' | 'month' | 'agenda';
  workingHours: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
    days: number[]; // 0-6 (Sunday-Saturday)
  };

  // Email preferences
  emailSignature?: string;
  defaultEmailFolder: string;
  autoMarkAsRead: boolean;

  // Journal preferences
  defaultJournalPrivacy: 'private' | 'public';
    autoSaveDrafts: boolean;
  journalPromptSuggestions: boolean;
}
```

### Journal Models
```typescript
interface JournalEntry {
  // Primary fields
  id: string;                    // UUID v4
  userId: string;                // Foreign key to User
  title: string;                 // Entry title
  content: string;               // Entry content (Markdown supported)

  // Categorization
  tags: string[];                // User-defined tags
  categories: string[];          // Predefined categories
  mood?: MoodType;               // Mood tracking

  // Media and attachments
  attachments: JournalAttachment[];
  images: JournalImage[];

  // Privacy and sharing
  isPrivate: boolean;            // Privacy setting
  isPublic: boolean;             // Public visibility
  shareToken?: string;           // Share token for public entries

  // Metadata
  wordCount: number;             // Auto-calculated
  readingTime: number;           // Estimated reading time (minutes)

  // Relationships
  linkedTasks: string[];         // Related task IDs
  linkedEvents: string[];        // Related event IDs
  linkedContacts: string[];      // Related contact IDs

  // AI assistance
  aiSummary?: string;            // AI-generated summary
  aiInsights?: string;           // AI-generated insights
  aiTags?: string[];             // AI-suggested tags

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type MoodType =
  | 'happy'
  | 'sad'
  | 'neutral'
  | 'excited'
  | 'anxious'
  | 'grateful'
  | 'frustrated'
  | 'peaceful'
  | 'energetic'
  | 'tired';

interface JournalAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;                  // in bytes
  url: string;                   // Download URL
  thumbnailUrl?: string;         // Thumbnail for images
  uploadedAt: Date;
}

interface JournalImage {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  caption?: string;
  altText?: string;
  metadata: {
    width: number;
    height: number;
    exif?: any;                  // EXIF data
  };
  uploadedAt: Date;
}

interface JournalTemplate {
  id: string;
  userId: string;
  name: string;
  description?: string;
  content: string;               // Template content with placeholders
  tags: string[];
  isPublic: boolean;
  usageCount: number;            // How many times used
  createdAt: Date;
  updatedAt: Date;
}
```

### Task Models
```typescript
interface Task {
  // Primary fields
  id: string;                    // UUID v4
  userId: string;                // Owner
  title: string;                 // Task title
  description?: string;          // Detailed description

  // Status and priority
  status: TaskStatus;
  priority: TaskPriority;
  completionPercentage: number;  // 0-100

  // Scheduling
  dueDate?: Date;
  startDate?: Date;
  estimatedDuration?: number;    // in minutes
  actualDuration?: number;       // in minutes (tracked)

  // Organization
  projectId?: string;            // Project grouping
  parentTaskId?: string;         // For subtasks
  tags: string[];
  labels: string[];              // Color-coded labels

  // Assignment
  assigneeId?: string;           // Assigned user
  collaboratorIds: string[];     // Multiple collaborators

  // Progress tracking
  checklists: TaskChecklist[];
  comments: TaskComment[];
  timeEntries: TimeEntry[];

  // External integration
  source: TaskSource;
  externalId?: string;           // ID from external system
  syncStatus: SyncStatus;
  lastSyncAt?: Date;

  // Dependencies
  dependencies: TaskDependency[];
  dependents: TaskDependency[];

  // AI assistance
  aiSuggestions?: string[];      // AI-generated suggestions
  estimatedComplexity?: number;  // 1-10 scale

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  deletedAt?: Date;
}

type TaskStatus =
  | 'todo'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'cancelled'
  | 'blocked';

type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

type TaskSource = 'internal' | 'motion' | 'google_tasks' | 'manual_import' | 'email';

type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

interface TaskChecklist {
  id: string;
  title: string;
  items: ChecklistItem[];
  completedAt?: Date;
}

interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: Date;
  assignedTo?: string;
}

interface TaskComment {
  id: string;
  userId: string;
  content: string;
  mentions: string[];            // Mentioned user IDs
  attachments: JournalAttachment[];
  createdAt: Date;
  updatedAt: Date;
}

interface TimeEntry {
  id: string;
  userId: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;             // in minutes
  billable: boolean;
  rate?: number;                 // hourly rate
  tags: string[];
  createdAt: Date;
}

interface TaskDependency {
  id: string;
  dependsOnTaskId: string;
  dependentTaskId: string;
  type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag?: number;                  // in days
}

interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;                // Hex color code
  status: 'active' | 'completed' | 'archived';
  startDate?: Date;
  endDate?: Date;
  taskIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Calendar Models
```typescript
interface CalendarEvent {
  // Primary fields
  id: string;                    // UUID v4
  userId: string;                // Owner
  title: string;
  description?: string;

  // Timing
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timezone: string;              // IANA timezone

  // Location and meeting
  location?: string;
  meetingUrl?: string;           // Video conference URL
  meetingType?: 'zoom' | 'meet' | 'teams' | 'other';

  // Participants
  organizerId: string;
  attendees: EventAttendee[];
  requiredAttendees: string[];   // User IDs
  optionalAttendees: string[];   // User IDs

  // Recurrence
  recurrence?: RecurrenceRule;
  recurringEventId?: string;     // For series instances
  originalStartTime?: Date;      // For exceptions

  // Reminders
  reminders: EventReminder[];

  // Scheduling assistance
  busy: boolean;                 // Show as busy/free
  visibility: 'public' | 'private' | 'confidential';

  // External integration
  source: EventSource;
  externalId?: string;
  calendarId?: string;           // External calendar ID
  syncStatus: SyncStatus;
  lastSyncAt?: Date;

  // Attachments and resources
  attachments: JournalAttachment[];
  resources: EventResource[];

  // Categories
  categories: string[];
  tags: string[];

  // Meeting preparation
  agenda?: string;
  preparationTime?: number;      // minutes before event

  // Follow-up
  followUpTaskId?: string;       // Task created after event
  meetingNotes?: string;         // Notes taken during meeting

  // AI assistance
  aiSuggestedTime?: boolean;
  aiTranscript?: string;
  aiSummary?: string;
  aiActionItems?: string[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type EventSource = 'internal' | 'google_calendar' | 'outlook_calendar' | 'ical_import';

interface EventAttendee {
  id: string;
  userId?: string;               // Internal user
  email: string;
  name?: string;
  status: AttendeeStatus;
  role: AttendeeRole;
  isOrganizer: boolean;
  responseAt?: Date;
  comment?: string;
}

type AttendeeStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'tentative';

type AttendeeRole = 'required' | 'optional' | 'resource';

interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;              // e.g., every 2 weeks
  count?: number;                // Number of occurrences
  until?: Date;                  // End date
  daysOfWeek?: number[];         // 0-6 (Sunday-Saturday)
  dayOfMonth?: number;           // 1-31
  weekOfMonth?: number;          // 1-5 (1st week, 2nd week, etc.)
  monthOfYear?: number;          // 1-12

  // Exceptions
  exceptions: RecurrenceException[];
}

interface RecurrenceException {
  originalDate: Date;
  action: 'delete' | 'modify';
  modifiedEvent?: Partial<CalendarEvent>;
}

interface EventReminder {
  id: string;
  type: 'email' | 'popup' | 'sms';
  minutesBefore: number;
  message?: string;
  isActive: boolean;
}

interface EventResource {
  id: string;
  name: string;
  type: 'room' | 'equipment' | 'other';
  capacity?: number;
  location?: string;
  bookingId?: string;
}

interface Calendar {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;                 // Hex color code
  isDefault: boolean;
  isVisible: boolean;
  source: EventSource;
  externalId?: string;
  syncEnabled: boolean;
  permissions: CalendarPermission[];
  createdAt: Date;
  updatedAt: Date;
}

interface CalendarPermission {
  userId: string;
  permission: 'read' | 'write' | 'admin';
  grantedBy: string;
  grantedAt: Date;
}
```

### Email Models
```typescript
interface EmailMessage {
  // Primary fields
  id: string;                    // UUID v4
  userId: string;                // Owner
  threadId: string;              // Email thread

  // Headers
  subject: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc: EmailAddress[];
  bcc: EmailAddress[];
  replyTo?: EmailAddress;

  // Content
  bodyText: string;
  bodyHtml: string;
  snippet: string;               // Preview text

  // Attachments
  attachments: EmailAttachment[];
  inlineImages: EmailInlineImage[];

  // Status and folders
  folder: string;                // INBOX, SENT, DRAFT, etc.
  isRead: boolean;
  isStarred: boolean;
  isImportant: boolean;
  isSpam: boolean;
  isDraft: boolean;
  isSent: boolean;

  // External integration
  source: EmailSource;
  externalId?: string;           // Gmail message ID
  externalThreadId?: string;
  syncStatus: SyncStatus;
  lastSyncAt?: Date;

  // Classification and processing
  category?: EmailCategory;
  priority: EmailPriority;
  sentiment?: EmailSentiment;
  entities?: EmailEntity[];      // Extracted entities

  // AI assistance
  aiSummary?: string;
  aiActionItems?: string[];
  aiSuggestedReplies?: string[];
  aiCategory?: string;

  // Thread information
  threadPosition: number;        // Position in thread
  totalInThread: number;

  // Metadata
  size: number;                  // in bytes
  messageHash: string;           // For deduplication

  // Timestamps
  sentAt: Date;
  receivedAt: Date;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type EmailSource = 'gmail' | 'outlook' | 'imap' | 'internal';

type EmailCategory =
  | 'primary'
  | 'social'
  | 'promotions'
  | 'updates'
  | 'forums'
  | 'personal'
  | 'work';

type EmailPriority = 'low' | 'normal' | 'high' | 'urgent';

type EmailSentiment = 'positive' | 'neutral' | 'negative';

interface EmailAddress {
  email: string;
  name?: string;
  avatar?: string;
}

interface EmailAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  downloadUrl: string;
  thumbnailUrl?: string;
  isInline: boolean;
  contentId?: string;            // For inline images
  virusScanStatus: 'safe' | 'scanning' | 'infected';
  extractedText?: string;        // OCR text for images
  createdAt: Date;
}

interface EmailInlineImage {
  id: string;
  contentId: string;
  mimeType: string;
  size: number;
  url: string;
  width?: number;
  height?: number;
  altText?: string;
}

interface EmailEntity {
  type: 'person' | 'organization' | 'location' | 'date' | 'money' | 'email' | 'phone';
  text: string;
  confidence: number;            // 0-1
  startIndex: number;
  endIndex: number;
  metadata?: any;                // Additional data based on type
}

interface EmailThread {
  id: string;
  userId: string;
  subject: string;
  participants: EmailAddress[];
  messageCount: number;
  unreadCount: number;
  lastMessageAt: Date;
  snippet: string;
  isStarred: boolean;
  isImportant: boolean;
  labels: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface EmailFolder {
  id: string;
  userId: string;
  name: string;
  displayName: string;
  type: 'system' | 'custom';
  parentFolderId?: string;
  messageCount: number;
  unreadCount: number;
  isSubscribed: boolean;
  color?: string;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailRule {
  id: string;
  userId: string;
  name: string;
  conditions: EmailRuleCondition[];
  actions: EmailRuleAction[];
  isActive: boolean;
  priority: number;
  matchAll: boolean;             // true = AND, false = OR
  createdAt: Date;
  updatedAt: Date;
}

interface EmailRuleCondition {
  field: 'from' | 'to' | 'subject' | 'body' | 'attachments' | 'size' | 'date';
  operator: 'equals' | 'contains' | 'starts_with' | 'ends_with' | 'greater_than' | 'less_than';
  value: string | number;
  caseSensitive: boolean;
}

interface EmailRuleAction {
  type: 'move_to' | 'add_label' | 'remove_label' | 'mark_read' | 'mark_unread' | 'star' | 'unstar' | 'forward_to' | 'delete';
  value?: string;
}
```

### Contact Models
```typescript
interface Contact {
  // Primary fields
  id: string;                    // UUID v4
  userId: string;                // Owner

  // Basic information
  name: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  prefix?: string;               // Mr., Mrs., Dr., etc.
  suffix?: string;               // Jr., Sr., III, etc.
  nickname?: string;
  phoneticName?: string;

  // Contact details
  emails: ContactEmail[];
  phones: ContactPhone[];
  addresses: ContactAddress[];
  websites: ContactWebsite[];

  // Organization
  company?: string;
  jobTitle?: string;
  department?: string;
  manager?: string;
  assistant?: string;

  // Personal details
  birthday?: Date;
  anniversary?: Date;
  notes?: string;
  relationship?: string;         // Friend, Family, Colleague, etc.

  // Social profiles
  socialProfiles: SocialProfile[];

  // Custom fields
  customFields: ContactCustomField[];

  // Groups and tags
  groups: string[];              // Contact group IDs
  tags: string[];

  // Interaction history
  lastContacted?: Date;
  contactFrequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'never';
  interactionCount: number;

  // External integration
  source: ContactSource;
  externalId?: string;
  syncStatus: SyncStatus;
  lastSyncAt?: Date;

  // Privacy and sharing
  isPrivate: boolean;
  isShared: boolean;
  sharedWith: string[];          // User IDs

  // AI assistance
  aiTags?: string[];
  aiRelationshipStrength?: number; // 0-1

  // Metadata
  avatar?: string;               // Profile image URL
  initials: string;              // Auto-calculated
  searchVector: string;          // For full-text search
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

type ContactSource = 'manual' | 'google_contacts' | 'outlook_contacts' | 'csv_import' | 'business_card_scan';

interface ContactEmail {
  id: string;
  email: string;
  type: EmailType;
  isPrimary: boolean;
  isVerified: boolean;
  verificationToken?: string;
  createdAt: Date;
}

type EmailType = 'personal' | 'work' | 'other' | 'home' | 'mobile';

interface ContactPhone {
  id: string;
  number: string;
  countryCode: string;
  type: PhoneType;
  isPrimary: boolean;
  isVerified: boolean;
  carrier?: string;
  createdAt: Date;
}

type PhoneType = 'mobile' | 'home' | 'work' | 'main' | 'fax' | 'pager' | 'other';

interface ContactAddress {
  id: string;
  street: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  type: AddressType;
  isPrimary: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  createdAt: Date;
}

type AddressType = 'home' | 'work' | 'other' | 'billing' | 'shipping';

interface ContactWebsite {
  id: string;
  url: string;
  type: WebsiteType;
  isPrimary: boolean;
  createdAt: Date;
}

type WebsiteType = 'personal' | 'work' | 'blog' | 'portfolio' | 'social' | 'other';

interface SocialProfile {
  id: string;
  platform: SocialPlatform;
  username: string;
  url: string;
  isVerified: boolean;
  createdAt: Date;
}

type SocialPlatform =
  | 'linkedin'
  | 'twitter'
  | 'facebook'
  | 'instagram'
  | 'github'
  | 'youtube'
  | 'tiktok'
  | 'other';

interface ContactCustomField {
  id: string;
  name: string;
  value: string | number | boolean | Date;
  type: 'text' | 'number' | 'date' | 'boolean' | 'url' | 'email';
  isPrivate: boolean;
  sortOrder: number;
  createdAt: Date;
}

interface ContactGroup {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color?: string;
  memberCount: number;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactInteraction {
  id: string;
  contactId: string;
  userId: string;
  type: InteractionType;
  direction: 'inbound' | 'outbound';
  subject?: string;
  description?: string;
  relatedEntityId?: string;      // Related email, event, etc.
  relatedEntityType?: 'email' | 'event' | 'task';
  metadata?: Record<string, any>;
  createdAt: Date;
}

type InteractionType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'note'
  | 'task'
  | 'message'
  | 'social';
```

## Integration Models

### External Service Configuration
```typescript
interface ExternalServiceConfig {
  id: string;
  userId: string;
  service: ExternalService;
  isActive: boolean;
  configuration: ServiceConfiguration;
  syncSettings: SyncSettings;
  lastSyncAt?: Date;
  syncStatus: SyncStatus;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

type ExternalService = 'motion' | 'google_calendar' | 'google_contacts' | 'gmail' | 'outlook' | 'slack';

interface ServiceConfiguration {
  // OAuth credentials
  clientId?: string;
  clientSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;

  // API credentials
  apiKey?: string;
  apiSecret?: string;
  workspaceId?: string;

  // Service-specific settings
  settings: Record<string, any>;
}

interface SyncSettings {
  autoSync: boolean;
  syncInterval: number;          // in minutes
  syncDirection: 'import' | 'export' | 'bidirectional';
  dataTypes: string[];           // What data to sync
  filters: Record<string, any>;  // Sync filters
  conflictResolution: ConflictResolutionStrategy;
}

type ConflictResolutionStrategy =
  | 'last_write_wins'
  | 'first_write_wins'
  | 'manual'
  | 'merge'
  | 'skip';
```

### Sync and Queue Models
```typescript
interface SyncJob {
  id: string;
  userId: string;
  service: ExternalService;
  dataType: string;
  status: SyncJobStatus;
  direction: 'import' | 'export';
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  progress: {
    total: number;
    processed: number;
    errors: number;
  };
  result?: SyncJobResult;
  createdAt: Date;
  updatedAt: Date;
}

type SyncJobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

interface SyncJobResult {
  imported: number;
  exported: number;
  updated: number;
  deleted: number;
  conflicts: number;
  errors: string[];
}

interface SyncConflict {
  id: string;
  userId: string;
  service: ExternalService;
  entityType: string;
  entityId: string;
  externalEntityId: string;
  conflictType: ConflictType;
  localData: any;
  externalData: any;
  resolution?: ConflictResolution;
  createdAt: Date;
  resolvedAt?: Date;
}

type ConflictType =
  | 'version_conflict'
  | 'data_conflict'
  | 'delete_conflict'
  | 'duplicate';

interface ConflictResolution {
  strategy: ConflictResolutionStrategy;
  resolvedData: any;
  resolvedBy: string;            // User ID or 'auto'
  notes?: string;
}
```

## Analytics and Metrics Models

### Usage Analytics
```typescript
interface UserActivity {
  id: string;
  userId: string;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, any>;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

interface ModuleUsage {
  userId: string;
  module: AppModule;
  date: Date;
  actions: number;
  timeSpent: number;             // in minutes
  featuresUsed: string[];
  createdAt: Date;
}

type AppModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts';

interface PerformanceMetrics {
  date: Date;
  module: AppModule;
  responseTime: number;          // Average response time in ms
  errorRate: number;             // Percentage
  activeUsers: number;
  totalRequests: number;
  slowQueries: string[];
  createdAt: Date;
}
```

## Notification Models

### Notification System
```typescript
interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;    // Additional data

  // Delivery channels
  channels: NotificationChannel[];

  // Scheduling
  scheduledAt?: Date;
  expiresAt?: Date;

  // Status
  status: NotificationStatus;
  readAt?: Date;
  deliveredAt?: Date[];
  failedAt?: Date[];

  // Prioritization
  priority: NotificationPriority;

  // Grouping
  groupId?: string;              // For grouping related notifications

  // Actions
  actions?: NotificationAction[];

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

type NotificationType =
  | 'task_reminder'
  | 'calendar_alert'
  | 'email_received'
  | 'mention'
  | 'share_received'
  | 'sync_completed'
  | 'conflict_detected'
  | 'system_update';

type NotificationChannel = 'in_app' | 'email' | 'push' | 'sms';

type NotificationStatus =
  | 'pending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed'
  | 'expired';

type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

interface NotificationAction {
  id: string;
  label: string;
  url?: string;
  action?: string;               // Action identifier
  style: 'primary' | 'secondary' | 'danger';
}

interface NotificationPreference {
  userId: string;
  type: NotificationType;
  channels: NotificationChannel[];
  enabled: boolean;
  quietHours?: {
    start: string;               // HH:MM
    end: string;                 // HH:MM
    timezone: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  createdAt: Date;
  updatedAt: Date;
}
```

This comprehensive data model provides a solid foundation for the Assistant Hub application, covering all modules with proper relationships, indexing strategies, and scalability considerations.