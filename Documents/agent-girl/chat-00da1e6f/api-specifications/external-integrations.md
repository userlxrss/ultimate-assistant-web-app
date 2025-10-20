# External API Integration Specifications

This document details the integration patterns and data flow for external services that the Assistant Hub application connects with.

## Motion API Integration

### Overview
Motion is a task management platform that provides AI-powered scheduling and task automation.

### Authentication
```typescript
interface MotionAuthConfig {
  apiKey: string;
  workspaceId: string;
  baseUrl: 'https://api.usemotion.com/v1';
  rateLimit: {
    requestsPerSecond: 10;
    requestsPerMinute: 600;
  };
}
```

### API Endpoints Mapping

#### Task Synchronization
```typescript
// Motion Task -> Internal Task Mapping
interface MotionTask {
  id: string;
  name: string;
  description?: string;
  status: 'AutoScheduled' | 'Scheduled' | 'Unscheduled' | 'Completed' | 'Cancelled';
  priority: 'ASAP' | 'High' | 'Medium' | 'Low';
  dueDate?: string;
  startDate?: string;
  duration?: number; // in minutes
  projectId?: string;
  labels: string[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// Internal Task Schema -> Motion Task Mapping
interface TaskToMotionMapping {
  id: 'externalId'; // Maps to Motion task ID
  title: 'name';
  description: 'description';
  status: {
    'todo': 'Unscheduled',
    'in_progress': 'AutoScheduled',
    'completed': 'Completed',
    'cancelled': 'Cancelled'
  };
  priority: {
    'urgent': 'ASAP',
    'high': 'High',
    'medium': 'Medium',
    'low': 'Low'
  };
  dueDate: 'dueDate';
  tags: 'labels';
}
```

#### Sync Implementation
```typescript
class MotionSyncService {
  async syncTasks(direction: 'import' | 'export' | 'bidirectional'): Promise<TaskSyncResponse> {
    const lastSync = await this.getLastSyncTimestamp();

    if (direction === 'import' || direction === 'bidirectional') {
      await this.importTasksFromMotion(lastSync);
    }

    if (direction === 'export' || direction === 'bidirectional') {
      await this.exportTasksToMotion(lastSync);
    }

    return this.handleSyncConflicts();
  }

  private async importTasksFromMotion(lastSync: Date): Promise<void> {
    const motionTasks = await this.motionClient.getTasks({
      updatedAfter: lastSync,
      include: ['projects', 'labels']
    });

    for (const motionTask of motionTasks) {
      const existingTask = await this.findTaskByExternalId(motionTask.id);

      if (existingTask) {
        await this.updateTaskFromMotion(existingTask, motionTask);
      } else {
        await this.createTaskFromMotion(motionTask);
      }
    }
  }

  private async exportTasksToMotion(lastSync: Date): Promise<void> {
    const internalTasks = await this.getTasksUpdatedSince(lastSync);

    for (const task of internalTasks) {
      if (task.externalId) {
        await this.updateMotionTask(task);
      } else {
        const motionTask = await this.createMotionTask(task);
        task.externalId = motionTask.id;
        await this.saveTask(task);
      }
    }
  }

  private async handleSyncConflicts(): Promise<TaskSyncResponse> {
    const conflicts = await this.detectConflicts();
    const resolvedConflicts = [];

    for (const conflict of conflicts) {
      const resolution = await this.resolveConflict(conflict);
      resolvedConflicts.push(resolution);
    }

    return {
      success: true,
      data: {
        importedTasks: this.importedCount,
        exportedTasks: this.exportedCount,
        conflicts: resolvedConflicts,
        lastSyncAt: new Date().toISOString()
      }
    };
  }
}
```

### Webhook Integration
```typescript
// Motion Webhook Handler
interface MotionWebhookPayload {
  type: 'task.created' | 'task.updated' | 'task.deleted' | 'task.completed';
  data: MotionTask;
  timestamp: string;
  workspaceId: string;
}

class MotionWebhookHandler {
  async handleWebhook(payload: MotionWebhookPayload): Promise<void> {
    switch (payload.type) {
      case 'task.created':
        await this.handleTaskCreated(payload.data);
        break;
      case 'task.updated':
        await this.handleTaskUpdated(payload.data);
        break;
      case 'task.deleted':
        await this.handleTaskDeleted(payload.data);
        break;
      case 'task.completed':
        await this.handleTaskCompleted(payload.data);
        break;
    }

    // Broadcast real-time update
    this.websocketService.broadcast('task:update', {
      action: this.getActionType(payload.type),
      task: await this.mapMotionToInternalTask(payload.data),
      source: 'motion'
    });
  }
}
```

## Google Calendar API Integration

### Overview
Google Calendar API provides access to calendar events, scheduling, and calendar management.

### Authentication (OAuth 2.0)
```typescript
interface GoogleCalendarAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events'
  ];
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

// Token refresh implementation
class GoogleTokenManager {
  async refreshAccessToken(refreshToken: string): Promise<string> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const tokens = await response.json();
    return tokens.access_token;
  }
}
```

### Event Synchronization
```typescript
// Google Calendar Event -> Internal Event Mapping
interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  recurrence?: string[]; // RRULE format
  reminders?: {
    overrides?: Array<{
      method: 'email' | 'popup';
      minutes: number;
    }>;
  };
  created: string;
  updated: string;
}

// Event Mapping Service
class CalendarEventMapper {
  static googleToInternal(googleEvent: GoogleCalendarEvent): CalendarEvent {
    return {
      externalId: googleEvent.id,
      title: googleEvent.summary,
      description: googleEvent.description,
      startTime: googleEvent.start.dateTime || googleEvent.start.date,
      endTime: googleEvent.end.dateTime || googleEvent.end.date,
      location: googleEvent.location,
      isAllDay: !googleEvent.start.dateTime,
      attendees: googleEvent.attendees?.map(att => ({
        email: att.email,
        name: att.displayName,
        status: att.responseStatus,
        isOrganizer: false // Will be determined from organizer field
      })),
      recurrence: this.parseRecurrence(googleEvent.recurrence),
      reminders: googleEvent.reminders?.overrides?.map(rem => ({
        type: rem.method,
        minutesBefore: rem.minutes
      })),
      createdAt: googleEvent.created,
      updatedAt: googleEvent.updated
    };
  }

  static internalToGoogle(internalEvent: CalendarEvent): GoogleCalendarEvent {
    return {
      summary: internalEvent.title,
      description: internalEvent.description,
      start: {
        dateTime: internalEvent.isAllDay ? undefined : internalEvent.startTime,
        date: internalEvent.isAllDay ? internalEvent.startTime : undefined
      },
      end: {
        dateTime: internalEvent.isAllDay ? undefined : internalEvent.endTime,
        date: internalEvent.isAllDay ? internalEvent.endTime : undefined
      },
      location: internalEvent.location,
      attendees: internalEvent.attendees?.map(att => ({
        email: att.email,
        displayName: att.name,
        responseStatus: att.status
      })),
      recurrence: this.buildRecurrence(internalEvent.recurrence),
      reminders: {
        overrides: internalEvent.reminders?.map(rem => ({
          method: rem.type,
          minutes: rem.minutesBefore
        }))
      }
    };
  }

  private static parseRecurrence(recurrence: string[]): RecurrenceRule | null {
    if (!recurrence || recurrence.length === 0) return null;

    // Parse RRULE format
    const rrule = recurrence[0];
    const match = rrule.match(/FREQ=(\w+);INTERVAL=(\d+)/);

    if (match) {
      return {
        frequency: match[1].toLowerCase() as any,
        interval: parseInt(match[2])
      };
    }

    return null;
  }
}
```

### Sync Service Implementation
```typescript
class GoogleCalendarSyncService {
  async syncEvents(calendarIds: string[]): Promise<CalendarSyncResponse> {
    const syncResults = [];

    for (const calendarId of calendarIds) {
      const result = await this.syncCalendar(calendarId);
      syncResults.push(result);
    }

    return this.aggregateSyncResults(syncResults);
  }

  private async syncCalendar(calendarId: string): Promise<any> {
    const lastSync = await this.getLastSyncTimestamp(calendarId);
    const syncToken = await this.getSyncToken(calendarId);

    try {
      const googleEvents = await this.fetchIncrementalEvents(calendarId, syncToken);
      const internalEvents = await this.fetchUpdatedInternalEvents(lastSync);

      await this.processEventChanges(googleEvents, internalEvents);
      await this.updateSyncToken(calendarId);

      return { success: true, calendarId, processedEvents: googleEvents.length };
    } catch (error) {
      if (error.code === 410) { // Sync token expired
        await this.performFullSync(calendarId);
      }
      throw error;
    }
  }

  private async processEventChanges(
    googleEvents: GoogleCalendarEvent[],
    internalEvents: CalendarEvent[]
  ): Promise<void> {
    // Process Google Calendar changes
    for (const googleEvent of googleEvents) {
      const internalEvent = await this.findEventByExternalId(googleEvent.id);

      if (googleEvent.status === 'cancelled') {
        if (internalEvent) {
          await this.deleteInternalEvent(internalEvent.id);
        }
      } else {
        const mappedEvent = CalendarEventMapper.googleToInternal(googleEvent);

        if (internalEvent) {
          await this.updateInternalEvent(internalEvent.id, mappedEvent);
        } else {
          await this.createInternalEvent(mappedEvent);
        }
      }
    }

    // Process internal changes to export to Google
    for (const internalEvent of internalEvents) {
      if (internalEvent.externalId) {
        const googleEvent = CalendarEventMapper.internalToGoogle(internalEvent);
        await this.updateGoogleEvent(internalEvent.externalId, googleEvent);
      } else {
        const googleEvent = CalendarEventMapper.internalToGoogle(internalEvent);
        const createdEvent = await this.createGoogleEvent(googleEvent);
        internalEvent.externalId = createdEvent.id;
        await this.saveInternalEvent(internalEvent);
      }
    }
  }
}
```

## Google Contacts API Integration

### Authentication
Same OAuth 2.0 flow as Calendar API with additional scope:
```
https://www.googleapis.com/auth/contacts
```

### Contact Mapping
```typescript
// Google People API Contact -> Internal Contact Mapping
interface GooglePerson {
  resourceName: string;
  etag: string;
  names: Array<{
    displayName: string;
    familyName: string;
    givenName: string;
  }>;
  emailAddresses: Array<{
    value: string;
    type: string;
  }>;
  phoneNumbers: Array<{
    value: string;
    type: string;
  }>;
  addresses: Array<{
    streetAddress: string;
    city: string;
    region: string;
    postalCode: string;
    country: string;
    type: string;
  }>;
  organizations: Array<{
    name: string;
    title: string;
  }>;
  biographies: Array<{
    value: string;
  }>;
  metadata: {
    sources: Array<{
      type: string;
      id: string;
      etag: string;
      updateTime: string;
    }>;
  };
}

class ContactMapper {
  static googleToInternal(googlePerson: GooglePerson): Contact {
    const primaryName = googlePerson.names?.[0];

    return {
      externalId: googlePerson.resourceName,
      name: primaryName?.displayName || '',
      firstName: primaryName?.givenName || '',
      lastName: primaryName?.familyName || '',
      emails: googlePerson.emailAddresses?.map(email => ({
        email: email.value,
        name: ''
      })) || [],
      phones: googlePerson.phoneNumbers?.map(phone => ({
        number: phone.value,
        type: this.mapPhoneType(phone.type)
      })) || [],
      addresses: googlePerson.addresses?.map(addr => ({
        street: addr.streetAddress || '',
        city: addr.city || '',
        state: addr.region || '',
        postalCode: addr.postalCode || '',
        country: addr.country || '',
        type: this.mapAddressType(addr.type)
      })) || [],
      company: googlePerson.organizations?.[0]?.name || '',
      jobTitle: googlePerson.organizations?.[0]?.title || '',
      notes: googlePerson.biographies?.[0]?.value || '',
      tags: [],
      updatedAt: googlePerson.metadata?.sources?.[0]?.updateTime
    };
  }

  private static mapPhoneType(googleType: string): string {
    const typeMap: Record<string, string> = {
      'mobile': 'mobile',
      'home': 'home',
      'work': 'work',
      'main': 'home',
      'work_fax': 'work',
      'home_fax': 'home'
    };
    return typeMap[googleType] || 'other';
  }

  private static mapAddressType(googleType: string): string {
    const typeMap: Record<string, string> = {
      'home': 'home',
      'work': 'work',
      'other': 'other'
    };
    return typeMap[googleType] || 'other';
  }
}
```

### Contact Sync Service
```typescript
class GoogleContactsSyncService {
  async syncContacts(): Promise<ContactSyncResponse> {
    const syncToken = await this.getContactsSyncToken();
    let hasMore = true;
    let totalProcessed = 0;
    let conflicts = [];

    while (hasMore) {
      const response = await this.fetchContactsBatch(syncToken);

      for (const person of response.connections) {
        try {
          await this.processContactChange(person);
          totalProcessed++;
        } catch (error) {
          if (error.type === 'CONFLICT') {
            conflicts.push(error.conflict);
          }
        }
      }

      syncToken = response.nextSyncToken;
      hasMore = !!response.nextPageToken;
    }

    await this.updateContactsSyncToken(syncToken);

    return {
      success: true,
      data: {
        importedContacts: totalProcessed,
        exportedContacts: 0,
        conflicts,
        lastSyncAt: new Date().toISOString()
      }
    };
  }

  private async processContactChange(googlePerson: GooglePerson): Promise<void> {
    const internalContact = await this.findContactByExternalId(googlePerson.resourceName);

    if (internalContact) {
      const mappedContact = ContactMapper.googleToInternal(googlePerson);
      const hasChanges = this.detectChanges(internalContact, mappedContact);

      if (hasChanges) {
        if (mappedContact.updated > internalContact.updatedAt) {
          await this.updateInternalContact(internalContact.id, mappedContact);
        } else {
          // Conflict - external and internal both changed
          throw new ConflictError(internalContact, mappedContact);
        }
      }
    } else {
      const mappedContact = ContactMapper.googleToInternal(googlePerson);
      await this.createInternalContact(mappedContact);
    }
  }
}
```

## Gmail API Integration

### Authentication
Same OAuth 2.0 flow with additional scope:
```
https://www.googleapis.com/auth/gmail.modify
```

### Email Synchronization
```typescript
// Gmail Message -> Internal Email Mapping
interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    mimeType: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
        attachmentId?: string;
      };
    }>;
  };
  internalDate: string;
  sizeEstimate: number;
}

class EmailMapper {
  static gmailToInternal(gmailMessage: GmailMessage): EmailMessage {
    const headers = this.parseHeaders(gmailMessage.payload.headers);
    const body = this.extractBody(gmailMessage.payload);

    return {
      externalId: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject: headers.subject || '(No Subject)',
      from: this.parseEmailAddress(headers.from),
      to: this.parseEmailAddresses(headers.to),
      cc: this.parseEmailAddresses(headers.cc),
      bcc: this.parseEmailAddresses(headers.bcc),
      body: body.text,
      bodyHtml: body.html,
      folder: this.mapGmailLabelsToFolder(gmailMessage.labelIds),
      isRead: !gmailMessage.labelIds.includes('UNREAD'),
      isStarred: gmailMessage.labelIds.includes('STARRED'),
      sentAt: new Date(parseInt(gmailMessage.internalDate)).toISOString(),
      receivedAt: new Date(parseInt(gmailMessage.internalDate)).toISOString(),
      attachments: [] // Would be populated separately
    };
  }

  private static parseHeaders(headers: Array<{name: string, value: string}>): Record<string, string> {
    return headers.reduce((acc, header) => {
      acc[header.name.toLowerCase()] = header.value;
      return acc;
    }, {});
  }

  private static parseEmailAddress(headerValue: string): EmailAddress {
    const match = headerValue.match(/^(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)$/);
    return {
      name: match?.[1]?.trim() || '',
      email: match?.[2] || headerValue
    };
  }

  private static mapGmailLabelsToFolder(labelIds: string[]): string {
    if (labelIds.includes('INBOX')) return 'INBOX';
    if (labelIds.includes('SENT')) return 'SENT';
    if (labelIds.includes('DRAFT')) return 'DRAFT';
    if (labelIds.includes('SPAM')) return 'SPAM';
    if (labelIds.includes('TRASH')) return 'TRASH';
    return 'INBOX'; // Default
  }
}
```

### Gmail Sync Service
```typescript
class GmailSyncService {
  async syncEmails(folders: string[]): Promise<EmailSyncResponse> {
    const syncResults = [];

    for (const folder of folders) {
      const result = await this.syncFolder(folder);
      syncResults.push(result);
    }

    return this.aggregateEmailSyncResults(syncResults);
  }

  private async syncFolder(folder: string): Promise<any> {
    const label = this.mapFolderToGmailLabel(folder);
    const historyId = await this.getHistoryId(label);

    // Get message history since last sync
    const history = await this.fetchHistory(historyId, label);

    for (const historyRecord of history) {
      await this.processHistoryRecord(historyRecord);
    }

    return { success: true, folder, processedRecords: history.length };
  }

  private async processHistoryRecord(historyRecord: any): Promise<void> {
    for (const message of historyRecord.messagesAdded || []) {
      await this.processMessageAdded(message.message);
    }

    for (const message of historyRecord.messagesDeleted || []) {
      await this.processMessageDeleted(message.message);
    }

    for (const message of historyRecord.labelsAdded || []) {
      await this.processLabelsChanged(message.message, message.labelIdsAdded);
    }

    for (const message of historyRecord.labelsRemoved || []) {
      await this.processLabelsChanged(message.message, message.labelIdsRemoved);
    }
  }

  private async processMessageAdded(messageData: any): Promise<void> {
    const gmailMessage = await this.fetchFullMessage(messageData.id);
    const internalEmail = EmailMapper.gmailToInternal(gmailMessage);

    await this.createInternalEmail(internalEmail);

    // Broadcast real-time update
    this.websocketService.broadcast('email:new', {
      message: internalEmail,
      folder: internalEmail.folder,
      importance: this.calculateImportance(internalEmail)
    });
  }
}
```

## Rate Limiting and Error Handling

### Rate Limiting Strategy
```typescript
interface RateLimitConfig {
  motion: {
    requestsPerSecond: 10;
    requestsPerMinute: 600;
    burstLimit: 50;
  };
  google: {
    queriesPerSecond: 100;
    queriesPerDay: 1000000;
    concurrentRequests: 10;
  };
}

class RateLimitManager {
  private rateLimiters = new Map<string, TokenBucket>();

  async executeRequest<T>(
    service: keyof RateLimitConfig,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const limiter = this.getRateLimiter(service);

    await limiter.consume(1);

    try {
      return await requestFn();
    } catch (error) {
      if (this.isRateLimitError(error)) {
        await this.handleRateLimit(service, error);
        return await this.executeRequest(service, requestFn); // Retry
      }
      throw error;
    }
  }

  private async handleRateLimit(service: string, error: any): Promise<void> {
    const retryAfter = this.parseRetryAfter(error);
    await this.delay(retryAfter);
  }
}
```

### Error Handling Patterns
```typescript
class IntegrationErrorHandler {
  async handleMotionError(error: any): Promise<void> {
    switch (error.code) {
      case 401:
        await this.refreshMotionCredentials();
        break;
      case 429:
        await this.handleMotionRateLimit(error);
        break;
      case 500:
        await this.handleMotionServerError(error);
        break;
      default:
        await this.logIntegrationError('motion', error);
    }
  }

  async handleGoogleError(error: any): Promise<void> {
    switch (error.code) {
      case 401:
        await this.refreshGoogleCredentials();
        break;
      case 429:
        await this.handleGoogleRateLimit(error);
        break;
      case 403:
        await this.handleGoogleQuotaExceeded(error);
        break;
      default:
        await this.logIntegrationError('google', error);
    }
  }
}
```

## Configuration Management

### Environment Configuration
```typescript
interface IntegrationConfig {
  motion: {
    apiKey: string;
    workspaceId: string;
    webhooks: {
      signingSecret: string;
      endpointUrl: string;
    };
  };
  google: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    calendars: Array<{
      id: string;
      name: string;
      syncEnabled: boolean;
    }>;
  };
  sync: {
    intervals: {
      motion: number; // seconds
      calendar: number;
      contacts: number;
      email: number;
    };
    batchSizes: {
      tasks: number;
      events: number;
      contacts: number;
      emails: number;
    };
  };
}
```

This comprehensive integration design ensures robust, scalable, and maintainable connections to external services while providing real-time synchronization and proper error handling.