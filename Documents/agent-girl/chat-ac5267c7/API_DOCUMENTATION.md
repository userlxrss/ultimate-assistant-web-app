# Productivity Hub - API Documentation

## Table of Contents
1. [Google APIs Overview](#google-apis-overview)
2. [Authentication](#authentication)
3. [Google Calendar API](#google-calendar-api)
4. [Gmail API](#gmail-api)
5. [Google People API](#google-people-api)
6. [Local Storage API](#local-storage-api)
7. [Security & Validation](#security--validation)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples & Code Snippets](#examples--code-snippets)

## Google APIs Overview

Productivity Hub integrates with three main Google Workspace APIs:

| API | Version | Purpose | Key Features |
|-----|---------|---------|-------------|
| Google Calendar | v3 | Event management & scheduling | CRUD operations, recurring events, reminders |
| Gmail | v1 | Email management | Send/receive, threads, labels, attachments |
| Google People | v1 | Contact management | CRUD operations, groups, relationships |

### Required OAuth Scopes

```typescript
const REQUIRED_SCOPES = [
  'https://www.googleapis.com/auth/calendar',          // Calendar access
  'https://www.googleapis.com/auth/calendar.events',    // Calendar events
  'https://www.googleapis.com/auth/gmail.readonly',     // Read Gmail
  'https://www.googleapis.com/auth/gmail.send',         // Send Gmail
  'https://www.googleapis.com/auth/contacts',           // Contacts access
  'https://www.googleapis.com/auth/userinfo.email',      // User email
  'https://www.googleapis.com/auth/userinfo.profile'     // User profile
];
```

## Authentication

### OAuth 2.0 Flow

The application implements the Google OAuth 2.0 Authorization Code Flow:

#### 1. Initialize OAuth
```typescript
const initializeOAuth = async () => {
  // Load Google Identity Services
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => {
    // Initialize token client
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: REQUIRED_SCOPES.join(' '),
      callback: handleTokenResponse
    });
  };
  document.body.appendChild(script);
};
```

#### 2. Request Authorization
```typescript
const requestAuthorization = async () => {
  try {
    // Check if user is already signed in
    const response = await window.google.accounts.oauth2.initiateTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: REQUIRED_SCOPES.join(' ')
    });

    // Request token
    await response.requestAccessToken();
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
};
```

#### 3. Token Response Handling
```typescript
const handleTokenResponse = (tokenResponse: any) => {
  if (tokenResponse.access_token) {
    // Store access token securely
    localStorage.setItem('google_access_token', tokenResponse.access_token);

    // Store expiry time
    const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
    localStorage.setItem('token_expiry', expiryTime.toString());

    // Store refresh token if available
    if (tokenResponse.refresh_token) {
      localStorage.setItem('google_refresh_token', tokenResponse.refresh_token);
    }

    // Initialize API clients
    initializeAPIClients();
  } else {
    console.error('No access token received');
  }
};
```

#### 4. Token Refresh
```typescript
const refreshToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem('google_refresh_token');

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      })
    });

    const data = await response.json();

    if (data.access_token) {
      localStorage.setItem('google_access_token', data.access_token);
      return data.access_token;
    } else {
      throw new Error('Token refresh failed');
    }
  } catch (error) {
    console.error('Token refresh error:', error);
    // Clear tokens and redirect to login
    clearAllTokens();
    window.location.href = '/login';
    throw error;
  }
};
```

## Google Calendar API

### Configuration

```typescript
interface CalendarConfig {
  apiKey: string;
  clientId: string;
  discoveryDoc: string;
  scopes: string[];
}

const calendarConfig: CalendarConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY,
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  scopes: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};
```

### API Methods

#### Initialize Calendar API
```typescript
class GoogleCalendarAPI {
  private gapiClient: any = null;
  private tokenClient: any = null;

  async initialize(): Promise<void> {
    // Load Google API script
    await this.loadGoogleAPIScript();

    // Initialize client
    await window.gapi.client.init({
      apiKey: calendarConfig.apiKey,
      discoveryDocs: [calendarConfig.discoveryDoc]
    });

    this.gapiClient = window.gapi.client;
  }

  private async loadGoogleAPIScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}
```

#### Get Calendar List
```typescript
async getCalendarList(): Promise<Calendar[]> {
  try {
    const response = await this.gapi.client.calendar.calendarList.list({
      minAccessRole: 'writer'
    });

    return response.result.items.map((calendar: any) => ({
      id: calendar.id,
      summary: calendar.summary,
      description: calendar.description,
      timezone: calendar.timeZone,
      primary: calendar.primary,
      backgroundColor: calendar.backgroundColor,
      foregroundColor: calendar.foregroundColor
    }));
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw error;
  }
}
```

#### Get Events
```typescript
async getEvents(
  calendarId: string = 'primary',
  timeMin?: Date,
  timeMax?: Date,
  maxResults: number = 250
): Promise<CalendarEvent[]> {
  try {
    const params: any = {
      calendarId,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime'
    };

    if (timeMin) {
      params.timeMin = timeMin.toISOString();
    }

    if (timeMax) {
      params.timeMax = timeMax.toISOString();
    }

    const response = await this.gapi.client.calendar.events.list(params);

    return response.result.items.map((event: any) =>
      this.convertGoogleEvent(event)
    );
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}
```

#### Create Event
```typescript
async createEvent(calendarId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
  try {
    const googleEvent = this.convertToGoogleEvent(eventData);

    const response = await this.gapi.client.calendar.events.insert({
      calendarId,
      resource: googleEvent
    });

    return this.convertGoogleEvent(response.result);
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

private convertToGoogleEvent(event: Partial<CalendarEvent>): any {
  return {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startTime?.toISOString(),
      timeZone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    end: {
      dateTime: event.endTime?.toISOString(),
      timezone: event.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    attendees: event.attendees?.map(attendee => ({
      email: attendee.email,
      displayName: attendee.name
    })),
    colorId: this.getColorId(event.color),
    reminders: {
      useDefault: false,
      overrides: event.reminders?.map(reminder => ({
        method: reminder.type === 'popup' ? 'popup' : 'email',
        minutes: reminder.minutesBefore
      }))
    }
  };
}
```

#### Update Event
```typescript
async updateEvent(
  calendarId: string,
  eventId: string,
  eventData: Partial<CalendarEvent>
): Promise<CalendarEvent> {
  try {
    const googleEvent = this.convertToGoogleEvent(eventData);

    const response = await this.gapi.client.calendar.events.update({
      calendarId,
      eventId,
      resource: googleEvent
    });

    return this.convertGoogleEvent(response.result);
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
}
```

#### Delete Event
```typescript
async deleteEvent(calendarId: string, eventId: string): Promise<void> {
  try {
    await this.gapi.client.calendar.events.delete({
      calendarId,
      eventId
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}
```

## Gmail API

### Configuration

```typescript
interface GmailConfig {
  clientId: string;
  apiKey: string;
  baseUrl: string;
  scopes: string[];
}

const gmailConfig: GmailConfig = {
  clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  apiKey: import.meta.env.VITE_GOOGLE_GMAIL_API_KEY,
  baseUrl: 'https://www.googleapis.com/gmail/v1',
  scopes: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ]
};
```

### API Methods

#### Initialize Gmail API
```typescript
class GmailAPI {
  private accessToken: string | null = null;

  constructor() {
    this.loadStoredToken();
  }

  private loadStoredToken(): void {
    this.accessToken = localStorage.getItem('google_access_token');
  }

  private async makeAuthenticatedRequest(url: string, options?: RequestInit): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers
      }
    });

    if (response.status === 401) {
      // Try to refresh token
      await refreshToken();
      return this.makeAuthenticatedRequest(url, options);
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }
}
```

#### Get Messages
```typescript
async getMessages(filter?: EmailFilter, maxResults: number = 50): Promise<Email[]> {
  let url = `${gmailConfig.baseUrl}/users/me/messages?maxResults=${maxResults}`;

  if (filter?.query) {
    url += `&q=${encodeURIComponent(filter.query)}`;
  }

  if (filter?.isUnread) {
    url += '&q=is:unread';
  }

  if (filter?.isStarred) {
    url += '&q=is:starred';
  }

  if (filter?.hasAttachments) {
    url += '&q=has:attachment';
  }

  const response = await this.makeAuthenticatedRequest(url);
  const messages = response.messages || [];

  return Promise.all(
    messages.map((msg: any) => this.getMessage(msg.id))
  );
}
```

#### Get Message Details
```typescript
async getMessage(messageId: string): Promise<Email> {
  const response = await this.makeAuthenticatedRequest(
    `${gmailConfig.baseUrl}/users/me/messages/${messageId}?format=full`
  );

  return this.parseGmailMessage(response);
}

private parseGmailMessage(gmailMessage: any): Email {
  const headers = gmailMessage.payload.headers;
  const getHeader = (name: string) => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  };

  const parseEmailAddresses = (headerValue: string) => {
    if (!headerValue) return [];
    return headerValue.split(',').map(addr => {
      const match = addr.trim().match(/^(.*?)\s*<(.+?)>$/) || [, '', addr.trim()];
      return {
        name: match[1]?.replace(/"/g, '').trim() || '',
        email: match[2] || addr.trim(),
      };
    });
  };

  return {
    id: gmailMessage.id,
    threadId: gmailMessage.threadId,
    subject: getHeader('Subject') || '(No subject)',
    snippet: gmailMessage.snippet || '',
    body: this.extractBody(gmailMessage.payload),
    from: parseEmailAddresses(getHeader('From'))[0] || { email: 'unknown@example.com' },
    to: parseEmailAddresses(getHeader('To')),
    cc: parseEmailAddresses(getHeader('Cc')),
    date: new Date(parseInt(gmailMessage.internalDate)),
    isRead: !gmailMessage.labelIds?.includes('UNREAD'),
    isStarred: gmailMessage.labelIds?.includes('STARRED') || false,
    isImportant: gmailMessage.labelIds?.includes('IMPORTANT') || false,
    labels: gmailMessage.labelIds || [],
    attachments: this.extractAttachments(gmailMessage.payload),
    hasAttachments: this.hasAttachments(gmailMessage.payload),
    folder: this.determineFolder(gmailMessage.labelIds || [])
  };
}
```

#### Send Email
```typescript
async sendMessage(emailData: ComposeEmailData): Promise<any> {
  const message = this.createEmailMessage(emailData);

  const response = await this.makeAuthenticatedRequest(
    `${gmailConfig.baseUrl}/users/me/messages/send`,
    {
      method: 'POST',
      body: JSON.stringify({
        raw: this.base64UrlEncode(message)
      })
    }
  );

  return response;
}

private createEmailMessage(emailData: ComposeEmailData): string {
  const to = emailData.to.map(addr =>
    `${addr.name ? `"${addr.name}" ` : ''}${addr.email}`
  ).join(', ');

  const cc = emailData.cc ?
    `Cc: ${emailData.cc.map(addr =>
      `${addr.name ? `"${addr.name}" ` : ''}${addr.email}`
    ).join(', ')}\r\n` : '';

  const parts = [
    `To: ${to}`,
    cc,
    `Subject: ${emailData.subject || ''}`,
    '\r\n',
    emailData.body || ''
  ].filter(Boolean);

  return parts.join('\r\n');
}
```

#### Modify Message (Add/Remove Labels)
```typescript
async modifyMessage(messageId: string, modifications: MessageModifications): Promise<void> {
  await this.makeAuthenticatedRequest(
    `${gmailConfig.baseUrl}/users/me/messages/${messageId}/modify`,
    {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: modifications.addLabels || [],
        removeLabelIds: modifications.removeLabels || []
      })
    }
  );
}

// Usage examples
await modifyMessage('msg_123', {
  addLabels: ['STARRED'],
  removeLabels: ['UNREAD']
});
```

## Google People API

### Configuration

```typescript
interface PeopleConfig {
  apiKey: string;
  baseUrl: string;
  scopes: string[];
}

const peopleConfig: PeopleConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_CONTACTS_API_KEY,
  baseUrl: 'https://people.googleapis.com/v1',
  scopes: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/contacts.readonly'
  ]
};
```

### API Methods

#### Get Contacts
```typescript
class GooglePeopleAPI {
  private accessToken: string | null = null;

  async getContacts(options?: ContactOptions): Promise<Contact[]> {
    let url = `${peopleConfig.baseUrl}/people/me/connections?personFields=${this.getPersonFields()}`;

    if (options?.pageSize) {
      url += `&pageSize=${options.pageSize}`;
    }

    if (options?.sortOrder) {
      url += `&sortOrder=${options.sortOrder}`;
    }

    if (options?.pageToken) {
      url += `&pageToken=${options.pageToken}`;
    }

    const response = await this.makeAuthenticatedRequest(url);

    return response.connections?.map((contact: any) =>
      this.parseGoogleContact(contact)
    ) || [];
  }

  private getPersonFields(): string {
    return [
      'names',
      'emailAddresses',
      'phoneNumbers',
      'addresses',
      'organizations',
      'photos',
      'biographies',
      'birthdays',
      'relations'
    ].join(',');
  }
}
```

#### Create Contact
```typescript
async createContact(contactData: CreateContactData): Promise<Contact> {
  const googleContact = this.convertToGoogleContact(contactData);

  const response = await this.makeAuthenticatedRequest(
    `${peopleConfig.baseUrl}/people:createContact`,
    {
      method: 'POST',
      body: JSON.stringify({
        personFields: this.getPersonFields(),
        ...googleContact
      })
    }
  );

  return this.parseGoogleContact(response);
}

private convertToGoogleContact(contact: CreateContactData): any {
  return {
    names: [{
      givenName: contact.firstName,
      familyName: contact.lastName,
      displayName: `${contact.firstName} ${contact.lastName}`
    }],
    emailAddresses: contact.emailAddresses?.map(email => ({
      value: email,
      type: 'main'
    })),
    phoneNumbers: contact.phoneNumbers?.map(phone => ({
      value: phone.number,
      type: phone.type || 'main'
    })),
    organizations: contact.organization ? [{
      name: contact.organization.name,
      title: contact.organization.title
    }] : undefined
  };
}
```

#### Update Contact
```typescript
async updateContact(contactId: string, updateData: UpdateContactData): Promise<Contact> {
  const updateMask = this.generateUpdateMask(updateData);
  const googleContact = this.convertToUpdateData(updateData);

  const response = await this.makeAuthenticatedRequest(
    `${peopleConfig.baseUrl}/people/${contactId}:updateContact`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        updatePersonFields: updateMask,
        personFields: this.getPersonFields(),
        ...googleContact
      })
    }
  );

  return this.parseGoogleContact(response);
}

private generateUpdateMask(updateData: UpdateContactData): string {
  const fields = [];
  if (updateData.names) fields.push('names');
  if (updateData.emailAddresses) fields.push('emailAddresses');
  if (updateData.phoneNumbers) fields.push('phoneNumbers');
  if (updateData.organizations) fields.push('organizations');
  return fields.join(',');
}
```

## Local Storage API

### Secure User Storage

The application implements a secure, user-specific storage system to prevent data leakage between users.

#### User-Specific Keys
```typescript
class SecureUserStorage {
  private generateUserKey(baseKey: string, userEmail: string): string {
    // Sanitize email to create valid localStorage key
    const sanitizedEmail = userEmail
      .replace(/[^a-zA-Z0-9@.-]/g, '_')
      .toLowerCase()
      .substring(0, 50);

    return `productivity_hub_${sanitizedEmail}_${baseKey}`;
  }

  setData<T>(key: string, data: T, userEmail: string): void {
    const userKey = this.generateUserKey(key, userEmail);

    try {
      const serializedData = JSON.stringify({
        data,
        timestamp: Date.now(),
        version: '1.0'
      });

      localStorage.setItem(userKey, serializedData);
    } catch (error) {
      console.error(`Error storing data for key ${key}:`, error);
      throw error;
    }
  }

  getData<T>(key: string, userEmail: string): T | null {
    const userKey = this.generateUserKey(key, userEmail);

    try {
      const storedData = localStorage.getItem(userKey);
      if (!storedData) return null;

      const parsed = JSON.parse(storedData);

      // Validate data structure
      if (!parsed.data || !parsed.timestamp) {
        console.warn(`Invalid data structure for key ${key}`);
        return null;
      }

      return parsed.data as T;
    } catch (error) {
      console.error(`Error retrieving data for key ${key}:`, error);
      return null;
    }
  }

  removeData(key: string, userEmail: string): void {
    const userKey = this.generateUserKey(key, userEmail);
    localStorage.removeItem(userKey);
  }

  // Clean up all user data on logout
  clearUserData(userEmail: string): void {
    const prefix = `productivity_hub_${userEmail.replace(/[^a-zA-Z0-9@.-]/g, '_').toLowerCase()}`;

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(prefix)) {
        localStorage.removeItem(key);
      }
    });
  }
}
```

#### Storage Utilities
```typescript
// Journal Storage
export const journalStorage = {
  saveEntry: (entry: JournalEntry, userEmail: string) => {
    const storage = new SecureUserStorage();
    const entries = storage.getData<JournalEntry[]>('journal_entries', userEmail) || [];

    // Remove existing entry if updating
    const filteredEntries = entries.filter(e => e.id !== entry.id);
    filteredEntries.push(entry);

    storage.setData('journal_entries', filteredEntries, userEmail);
  },

  getEntries: (userEmail: string): JournalEntry[] => {
    const storage = new SecureUserStorage();
    return storage.getData<JournalEntry[]>('journal_entries', userEmail) || [];
  },

  deleteEntry: (entryId: string, userEmail: string) => {
    const storage = new SecureUserStorage();
    const entries = storage.getData<JournalEntry[]>('journal_entries', userEmail) || [];
    const filteredEntries = entries.filter(e => e.id !== entryId);
    storage.setData('journal_entries', filteredEntries, userEmail);
  }
};

// Task Storage
export const taskStorage = {
  saveTask: (task: Task, userEmail: string) => {
    const storage = new SecureUserStorage();
    const tasks = storage.getData<Task[]>('tasks', userEmail) || [];

    const filteredTasks = tasks.filter(t => t.id !== task.id);
    filteredTasks.push(task);

    storage.setData('tasks', filteredTasks, userEmail);
  },

  getTasks: (userEmail: string): Task[] => {
    const storage = new SecureUserStorage();
    return storage.getData<Task[]>('tasks', userEmail) || [];
  }
};
```

## Security & Validation

### Input Validation

#### Email Validation
```typescript
export const validators = {
  email: (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  url: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return ['http:', 'https:'].includes(urlObj.protocol);
    } catch {
      return false;
    }
  },

  phoneNumber: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(phone) && phone.length >= 10;
  },

  alphanumeric: (str: string, maxLength: number = 100): boolean => {
    const alphaNumericRegex = /^[a-zA-Z0-9]+$/;
    return alphaNumericRegex.test(str) && str.length <= maxLength;
  },

  text: (str: string, maxLength: number = 1000): boolean => {
    const textRegex = /^[a-zA-Z0-9\s.,!?@#%&*()_+-=[\]{}|;':"<>.,?/~`]+$/;
    return textRegex.test(str) && str.length <= maxLength;
  }
};
```

#### Content Sanitization
```typescript
import xss from 'xss';

export const sanitizer = {
  strict: (dirty: string): string => {
    return xss(dirty, {
      whiteList: {}, // No HTML tags allowed
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  },

  permissive: (dirty: string): string => {
    return xss(dirty, {
      whiteList: {
        a: ['href', 'title', 'target'],
        b: [],
        i: [],
        em: [],
        strong: [],
        p: [],
        br: [],
        span: ['class']
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script'],
      onTagAttr: function(tag, name, value, isWhiteAttr) {
        if (name === 'href') {
          if (value.startsWith('javascript:') || value.startsWith('data:')) {
            return '';
          }
        }
        if (name.startsWith('on')) {
          return '';
        }
      }
    });
  }
};
```

### CSRF Protection
```typescript
export class CSRFProtection {
  private static tokens: Set<string> = new Set();
  private static readonly TOKEN_LENGTH = 32;

  static generateToken(): string {
    const token = Array.from({ length: this.TOKEN_LENGTH }, () =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 62)]
    ).join('');

    this.tokens.add(token);

    // Cleanup old tokens (keep only last 100)
    if (this.tokens.size > 100) {
      const tokensArray = Array.from(this.tokens);
      this.tokens = new Set(tokensArray.slice(-100));
    }

    return token;
  }

  static validateToken(token: string): boolean {
    return this.tokens.has(token);
  }

  static validateRequest(request: Request): boolean {
    const token = request.headers.get('X-CSRF-Token');
    return token ? this.validateToken(token) : false;
  }
}
```

## Error Handling

### API Error Handling
```typescript
export class APIError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: string;
  public readonly details: any;

  constructor(message: string, statusCode: number, errorCode: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
}

export const errorHandler = {
  handleGoogleAPIError: (error: any): APIError => {
    if (error.status) {
      switch (error.status) {
        case 400:
          return new APIError('Bad request', 400, 'BAD_REQUEST', error.message);
        case 401:
          return new APIError('Authentication failed', 401, 'AUTH_FAILED', error.message);
        case 403:
          return new APIError('Access forbidden', 403, 'FORBIDDEN', error.message);
        case 429:
          return new APIError('Rate limit exceeded', 429, 'RATE_LIMIT', error.message);
        case 500:
          return new APIError('Server error', 500, 'SERVER_ERROR', error.message);
        default:
          return new APIError('Unknown error', error.status, 'UNKNOWN', error.message);
      }
    }

    return new APIError('Network error', 0, 'NETWORK_ERROR', error.message);
  },

  handleStorageError: (error: any): APIError => {
    if (error.name === 'QuotaExceededError') {
      return new APIError('Storage quota exceeded', 413, 'STORAGE_FULL');
    }

    if (error.name === 'SecurityError') {
      return new APIError('Storage access denied', 403, 'STORAGE_DENIED');
    }

    return new APIError('Storage error', 500, 'STORAGE_ERROR', error.message);
  }
};
```

### Retry Logic
```typescript
export class RetryManager {
  private static readonly DEFAULT_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    retries: number = this.DEFAULT_RETRIES,
    baseDelay: number = this.BASE_DELAY
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on authentication errors
        if (error instanceof APIError && error.statusCode === 401) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          throw error;
        }

        // Exponential backoff with jitter
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}
```

## Rate Limiting

### API Rate Limiting
```typescript
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getResetTime(): number {
    if (this.requests.length === 0) return 0;

    const oldestRequest = Math.min(...this.requests);
    return oldestRequest + this.windowMs;
  }

  reset(): void {
    this.requests = [];
  }
}

// Usage example
const calendarRateLimiter = new RateLimiter(100, 60000); // 100 requests per minute

const makeCalendarRequest = async (operation: () => Promise<any>) => {
  if (!calendarRateLimiter.isAllowed()) {
    const resetTime = calendarRateLimiter.getResetTime();
    const waitTime = Math.max(0, resetTime - Date.now());

    throw new APIError(
      `Rate limit exceeded. Try again in ${Math.ceil(waitTime / 1000)} seconds.`,
      429,
      'RATE_LIMIT'
    );
  }

  return operation();
};
```

## Examples & Code Snippets

### Complete Email Integration Example
```typescript
import { gmailAPI } from './utils/gmailAPI';
import { sanitizer, validators } from './security/securityUtils';

class EmailService {
  async sendEmail(to: string[], subject: string, body: string): Promise<void> {
    try {
      // Validate inputs
      if (!to.every(validators.email)) {
        throw new Error('Invalid email address');
      }

      if (subject.length > 255) {
        throw new Error('Subject too long');
      }

      // Sanitize content
      const sanitizedSubject = sanitizer.strict(subject);
      const sanitizedBody = sanitizer.permissive(body);

      // Create email data
      const emailData = {
        to: to.map(email => ({ email, name: '' })),
        subject: sanitizedSubject,
        body: sanitizedBody
      };

      // Send email
      await gmailAPI.sendMessage(emailData);

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async searchEmails(query: string, maxResults: number = 50): Promise<Email[]> {
    try {
      // Validate and sanitize query
      const sanitizedQuery = sanitizer.strict(query);

      // Search emails
      const emails = await gmailAPI.getMessages({
        query: sanitizedQuery,
        maxResults
      });

      return emails;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
  }
}
```

### Complete Calendar Integration Example
```typescript
import { googleCalendarAPI } from './utils/googleCalendarAPI';

class CalendarService {
  async createMeeting(title: string, startTime: Date, duration: number, attendees: string[]): Promise<void> {
    try {
      const endTime = new Date(startTime.getTime() + duration * 60000);

      const eventData = {
        title: sanitizer.strict(title),
        startTime,
        endTime,
        attendees: attendees
          .filter(validators.email)
          .map(email => ({ email, name: '' })),
        description: '',
        reminders: [
          { type: 'email' as const, minutesBefore: 15 },
          { type: 'popup' as const, minutesBefore: 5 }
        ]
      };

      await googleCalendarAPI.createEvent('primary', eventData);

    } catch (error) {
      console.error('Error creating meeting:', error);
      throw error;
    }
  }

  async getTodayEvents(): Promise<CalendarEvent[]> {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    return googleCalendarAPI.getEvents('primary', today, tomorrow);
  }
}
```

### Complete Task Management Example
```typescript
import { taskStorage } from './utils/storage';
import { validators, sanitizer } from './security/securityUtils';

class TaskService {
  async createTask(title: string, description: string, priority: Task['priority']): Promise<Task> {
    try {
      // Validate inputs
      if (!title || title.trim().length === 0) {
        throw new Error('Task title is required');
      }

      if (title.length > 255) {
        throw new Error('Task title too long');
      }

      // Sanitize inputs
      const sanitizedTitle = sanitizer.strict(title.trim());
      const sanitizedDescription = sanitizer.permissive(description);

      // Create task
      const task: Task = {
        id: this.generateTaskId(),
        title: sanitizedTitle,
        description: sanitizedDescription,
        completed: false,
        createdAt: new Date(),
        priority,
        category: 'general',
        tags: [],
        subtasks: [],
        attachments: []
      };

      // Save task
      const userEmail = getCurrentUserEmail(); // Implement this function
      await taskStorage.saveTask(task, userEmail);

      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  async getTasks(filter?: TaskFilter): Promise<Task[]> {
    try {
      const userEmail = getCurrentUserEmail();
      let tasks = taskStorage.getTasks(userEmail);

      // Apply filters
      if (filter) {
        if (filter.completed !== undefined) {
          tasks = tasks.filter(task => task.completed === filter.completed);
        }

        if (filter.priority) {
          tasks = tasks.filter(task => task.priority === filter.priority);
        }

        if (filter.category) {
          tasks = tasks.filter(task => task.category === filter.category);
        }
      }

      return tasks.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

This API documentation provides comprehensive details for integrating with Google Workspace APIs and using the local storage system. For additional examples or specific use cases, refer to the source code in the `/src/utils/` directory.