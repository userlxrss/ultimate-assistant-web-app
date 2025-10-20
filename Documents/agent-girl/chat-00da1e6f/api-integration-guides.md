# API Integration Guides - Ultimate Assistant Hub

## Overview

This document provides comprehensive implementation guides for integrating with external APIs in the Ultimate Assistant Hub. All integrations follow consistent patterns for authentication, error handling, and real-time synchronization.

## Google Services Integration

### 1. OAuth 2.0 Authentication Setup

#### Environment Configuration
```bash
# .env.local
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
GOOGLE_SCOPES=https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/contacts.readonly
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_32_byte_hex_key_here
```

#### Authentication Service
```typescript
// lib/google/auth.ts
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import { redis } from '@/lib/redis';
import { prisma } from '@/lib/prisma';

export class GoogleAuthService {
  private oauth2Client: any;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async getAuthUrl(userId: string): Promise<string> {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

    // Store PKCE data in Redis
    await redis.hset(`oauth:${state}`, {
      userId,
      codeVerifier,
      expiresAt: Date.now() + 600000 // 10 minutes
    });

    const url = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: process.env.GOOGLE_SCOPES?.split(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt: 'consent',
    });

    return url;
  }

  async exchangeCodeForTokens(code: string, state: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    // Retrieve PKCE data
    const oauthData = await redis.hgetall(`oauth:${state}`);

    if (!oauthData || Date.now() > parseInt(oauthData.expiresAt)) {
      throw new Error('Invalid or expired state parameter');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken({
        code,
        code_verifier: oauthData.codeVerifier,
      });

      // Clean up state data
      await redis.del(`oauth:${state}`);

      return {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiresIn: tokens.expiry_date! - Date.now(),
      };
    } catch (error) {
      throw new Error('Failed to exchange code for tokens');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      return credentials.access_token!;
    } catch (error) {
      throw new Error('Failed to refresh access token');
    }
  }

  async storeTokens(userId: string, tokens: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  }): Promise<void> {
    const encryptedToken = this.encrypt(tokens.accessToken);
    const encryptedRefresh = this.encrypt(tokens.refreshToken);

    await prisma.userIntegration.upsert({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
      update: {
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        expiresAt: new Date(tokens.expiresAt),
      },
      create: {
        userId,
        provider: 'google',
        accessToken: encryptedToken,
        refreshToken: encryptedRefresh,
        expiresAt: new Date(tokens.expiresAt),
      },
    });
  }

  private encrypt(text: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('google-token'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedData: string): string {
    const crypto = require('crypto');
    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('google-token'));
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 2. Google Calendar Integration

```typescript
// lib/google/calendar.ts
import { google } from 'googleapis';
import { GoogleAuthService } from './auth';

export class GoogleCalendarService {
  private auth: GoogleAuthService;
  private calendar: any;

  constructor() {
    this.auth = new GoogleAuthService();
  }

  async getCalendarService(userId: string): Promise<any> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    if (!integration) {
      throw new Error('Google integration not found');
    }

    let accessToken = this.auth.decrypt(integration.accessToken);

    // Check if token needs refresh
    if (Date.now() > integration.expiresAt.getTime()) {
      accessToken = await this.auth.refreshAccessToken(
        this.auth.decrypt(integration.refreshToken)
      );

      // Store refreshed token
      await this.auth.storeTokens(userId, {
        accessToken,
        refreshToken: this.auth.decrypt(integration.refreshToken),
        expiresAt: Date.now() + 3600000, // 1 hour
      });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  async syncEvents(userId: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
  }> {
    const calendar = await this.getCalendarService(userId);
    const lastSync = await this.getLastSyncTime(userId);

    try {
      // Fetch events from Google Calendar
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: lastSync?.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
        maxResults: 250,
      });

      const googleEvents = response.data.items || [];
      let created = 0, updated = 0, deleted = 0;

      for (const googleEvent of googleEvents) {
        const existingEvent = await prisma.calendarEvent.findUnique({
          where: { googleEventId: googleEvent.id },
        });

        if (googleEvent.status === 'cancelled') {
          if (existingEvent) {
            await prisma.calendarEvent.delete({
              where: { id: existingEvent.id },
            });
            deleted++;
          }
          continue;
        }

        const eventData = {
          title: googleEvent.summary || 'No Title',
          description: googleEvent.description,
          startTime: new Date(googleEvent.start.dateTime || googleEvent.start.date),
          endTime: new Date(googleEvent.end.dateTime || googleEvent.end.date),
          location: googleEvent.location,
          attendees: googleEvent.attendees?.map((attendee: any) => ({
            email: attendee.email,
            displayName: attendee.displayName,
            responseStatus: attendee.responseStatus,
          })) || [],
          status: googleEvent.status,
          googleEventId: googleEvent.id,
        };

        if (existingEvent) {
          await prisma.calendarEvent.update({
            where: { id: existingEvent.id },
            data: eventData,
          });
          updated++;
        } else {
          await prisma.calendarEvent.create({
            data: {
              ...eventData,
              userId,
            },
          });
          created++;
        }
      }

      // Update last sync time
      await this.updateLastSyncTime(userId);

      return { created, updated, deleted };
    } catch (error) {
      console.error('Calendar sync failed:', error);
      throw new Error('Failed to sync calendar events');
    }
  }

  async createEvent(userId: string, eventData: {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    location?: string;
    attendees?: string[];
  }): Promise<CalendarEvent> {
    const calendar = await this.getCalendarService(userId);

    const googleEvent = {
      summary: eventData.title,
      description: eventData.description,
      start: {
        dateTime: eventData.startTime.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: eventData.endTime.toISOString(),
        timeZone: 'UTC',
      },
      location: eventData.location,
      attendees: eventData.attendees?.map(email => ({ email })),
    };

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: googleEvent,
      });

      const createdEvent = await prisma.calendarEvent.create({
        data: {
          userId,
          title: eventData.title,
          description: eventData.description,
          startTime: eventData.startTime,
          endTime: eventData.endTime,
          location: eventData.location,
          googleEventId: response.data.id,
          status: 'confirmed',
        },
      });

      return createdEvent;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      throw new Error('Failed to create event in Google Calendar');
    }
  }

  private async getLastSyncTime(userId: string): Promise<Date | null> {
    const sync = await prisma.syncStatus.findUnique({
      where: {
        userId_service: {
          userId,
          service: 'google-calendar',
        },
      },
    });

    return sync?.lastSyncAt || null;
  }

  private async updateLastSyncTime(userId: string): Promise<void> {
    await prisma.syncStatus.upsert({
      where: {
        userId_service: {
          userId,
          service: 'google-calendar',
        },
      },
      update: {
        lastSyncAt: new Date(),
      },
      create: {
        userId,
        service: 'google-calendar',
        lastSyncAt: new Date(),
      },
    });
  }
}
```

### 3. Gmail Integration

```typescript
// lib/google/gmail.ts
import { google } from 'googleapis';
import { GoogleAuthService } from './auth';

export class GmailService {
  private auth: GoogleAuthService;

  constructor() {
    this.auth = new GoogleAuthService();
  }

  async syncEmails(userId: string, maxResults: number = 50): Promise<{
    synced: number;
    errors: string[];
  }> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    if (!integration) {
      throw new Error('Google integration not found');
    }

    const accessToken = this.auth.decrypt(integration.accessToken);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      // Get message list
      const messagesResponse = await gmail.users.messages.list({
        userId: 'me',
        maxResults,
        q: 'in:inbox is:unread',
      });

      const messages = messagesResponse.data.messages || [];
      let synced = 0;
      const errors: string[] = [];

      for (const messageRef of messages) {
        try {
          // Get full message details
          const messageResponse = await gmail.users.messages.get({
            userId: 'me',
            id: messageRef.id!,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Subject', 'Date'],
          });

          const message = messageResponse.data;
          const headers = message.payload?.headers || [];

          const getMessageHeader = (name: string) => {
            return headers.find((h: any) => h.name === name)?.value;
          };

          const emailData = {
            userId,
            gmailMessageId: message.id!,
            threadId: message.threadId!,
            subject: getMessageHeader('Subject') || '(No Subject)',
            fromAddress: getMessageHeader('From') || '',
            toAddresses: getMessageHeader('To')?.split(',').map(email => email.trim()) || [],
            bodyText: '', // Would need full format for body
            bodyHtml: '',
            isRead: !message.labelIds?.includes('UNREAD'),
            isStarred: message.labelIds?.includes('STARRED') || false,
            labels: message.labelIds || [],
            receivedAt: new Date(parseInt(message.internalDate || '0')),
          };

          // Check if message already exists
          const existingEmail = await prisma.emailMessage.findUnique({
            where: { gmailMessageId: message.id! },
          });

          if (existingEmail) {
            await prisma.emailMessage.update({
              where: { id: existingEmail.id },
              data: emailData,
            });
          } else {
            await prisma.emailMessage.create({
              data: emailData,
            });
          }

          synced++;
        } catch (error) {
          console.error(`Failed to sync message ${messageRef.id}:`, error);
          errors.push(`Failed to sync message ${messageRef.id}`);
        }
      }

      return { synced, errors };
    } catch (error) {
      console.error('Gmail sync failed:', error);
      throw new Error('Failed to sync emails from Gmail');
    }
  }

  async sendEmail(userId: string, emailData: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }): Promise<string> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    if (!integration) {
      throw new Error('Google integration not found');
    }

    const accessToken = this.auth.decrypt(integration.accessToken);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
      const emailContent = this.createEmailMessage(emailData);
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: emailContent,
        },
      });

      return response.data.id!;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw new Error('Failed to send email via Gmail');
    }
  }

  private createEmailMessage(emailData: {
    to: string[];
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
  }): string {
    const { to, subject, body, cc, bcc } = emailData;

    let email = [
      `To: ${to.join(', ')}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ];

    if (cc && cc.length > 0) {
      email.splice(1, 0, `Cc: ${cc.join(', ')}`);
    }

    if (bcc && bcc.length > 0) {
      email.splice(1, 0, `Bcc: ${bcc.join(', ')}`);
    }

    return Buffer.from(email.join('\r\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  }
}
```

### 4. Google Contacts Integration

```typescript
// lib/google/contacts.ts
import { google } from 'googleapis';
import { GoogleAuthService } from './auth';

export class GoogleContactsService {
  private auth: GoogleAuthService;

  constructor() {
    this.auth = new GoogleAuthService();
  }

  async syncContacts(userId: string): Promise<{
    synced: number;
    updated: number;
    errors: string[];
  }> {
    const integration = await prisma.userIntegration.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: 'google',
        },
      },
    });

    if (!integration) {
      throw new Error('Google integration not found');
    }

    const accessToken = this.auth.decrypt(integration.accessToken);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const people = google.people({ version: 'v1', auth: oauth2Client });

    try {
      const response = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos,addresses',
        pageSize: 1000,
      });

      const googleContacts = response.data.connections || [];
      let synced = 0, updated = 0;
      const errors: string[] = [];

      for (const googleContact of googleContacts) {
        try {
          const contactData = {
            userId,
            googleContactId: googleContact.resourceName?.replace('people/', '') || '',
            name: this.getPrimaryName(googleContact.names) || '',
            emailAddresses: googleContact.emailAddresses?.map((email: any) => email.value) || [],
            phoneNumbers: googleContact.phoneNumbers?.map((phone: any) => phone.value) || [],
            company: this.getPrimaryOrganization(googleContact.organizations),
            notes: '', // Would need biographies field
            avatarUrl: this.getPrimaryPhoto(googleContact.photos),
          };

          const existingContact = await prisma.contact.findUnique({
            where: { googleContactId: contactData.googleContactId },
          });

          if (existingContact) {
            await prisma.contact.update({
              where: { id: existingContact.id },
              data: contactData,
            });
            updated++;
          } else {
            await prisma.contact.create({
              data: contactData,
            });
            synced++;
          }
        } catch (error) {
          console.error(`Failed to sync contact:`, error);
          errors.push('Failed to sync contact');
        }
      }

      return { synced, updated, errors };
    } catch (error) {
      console.error('Contacts sync failed:', error);
      throw new Error('Failed to sync contacts from Google');
    }
  }

  private getPrimaryName(names: any[]): string {
    if (!names || names.length === 0) return '';

    const primaryName = names.find((name: any) => name.metadata.primary) || names[0];
    return `${primaryName.givenName || ''} ${primaryName.familyName || ''}`.trim();
  }

  private getPrimaryOrganization(organizations: any[]): string {
    if (!organizations || organizations.length === 0) return '';

    const primaryOrg = organizations.find((org: any) => org.metadata.primary) || organizations[0];
    return primaryOrg.name || '';
  }

  private getPrimaryPhoto(photos: any[]): string {
    if (!photos || photos.length === 0) return '';

    const primaryPhoto = photos.find((photo: any) => photo.metadata.primary) || photos[0];
    return primaryPhoto.url || '';
  }
}
```

## Motion API Integration

### 1. Motion Service Implementation

```typescript
// lib/motion/client.ts
export class MotionClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.usemotion.com/v1';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Motion API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// lib/motion/tasks.ts
interface MotionTask {
  id: string;
  name: string;
  description?: string;
  dueDate?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  projectId?: string;
  assigneeId?: string;
  labels: string[];
  estimatedDuration?: number;
  actualDuration?: number;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export class MotionTasksService {
  private client: MotionClient;

  constructor(apiKey: string) {
    this.client = new MotionClient(apiKey);
  }

  async getTasks(filters?: {
    status?: string;
    priority?: string;
    projectId?: string;
    assigneeId?: string;
    dueBefore?: string;
    dueAfter?: string;
  }): Promise<MotionTask[]> {
    const params = new URLSearchParams();

    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);
    if (filters?.projectId) params.append('projectId', filters.projectId);
    if (filters?.assigneeId) params.append('assigneeId', filters.assigneeId);
    if (filters?.dueBefore) params.append('dueBefore', filters.dueBefore);
    if (filters?.dueAfter) params.append('dueAfter', filters.dueAfter);

    const endpoint = `/tasks${params.toString() ? `?${params.toString()}` : ''}`;
    return this.client.get<MotionTask[]>(endpoint);
  }

  async createTask(taskData: {
    name: string;
    description?: string;
    dueDate?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    projectId?: string;
    assigneeId?: string;
    labels?: string[];
    estimatedDuration?: number;
  }): Promise<MotionTask> {
    return this.client.post<MotionTask>('/tasks', taskData);
  }

  async updateTask(
    taskId: string,
    updates: Partial<{
      name: string;
      description: string;
      dueDate: string;
      priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      assigneeId: string;
      labels: string[];
      estimatedDuration: number;
    }>
  ): Promise<MotionTask> {
    return this.client.put<MotionTask>(`/tasks/${taskId}`, updates);
  }

  async deleteTask(taskId: string): Promise<void> {
    await this.client.delete(`/tasks/${taskId}`);
  }

  async syncWithLocalTasks(userId: string): Promise<{
    created: number;
    updated: number;
    deleted: number;
  }> {
    const motionTasks = await this.getTasks();
    const localTasks = await prisma.task.findMany({
      where: {
        userId,
        motionTaskId: { not: null }
      },
    });

    const motionTaskMap = new Map(
      motionTasks.map(task => [task.id, task])
    );

    let created = 0, updated = 0, deleted = 0;

    // Sync or create tasks from Motion
    for (const motionTask of motionTasks) {
      const localTask = localTasks.find(
        task => task.motionTaskId === motionTask.id
      );

      const taskData = {
        title: motionTask.name,
        description: motionTask.description,
        status: this.mapMotionStatus(motionTask.status),
        priority: this.mapMotionPriority(motionTask.priority),
        dueDate: motionTask.dueDate ? new Date(motionTask.dueDate) : null,
        completedAt: motionTask.completedAt ? new Date(motionTask.completedAt) : null,
      };

      if (localTask) {
        await prisma.task.update({
          where: { id: localTask.id },
          data: taskData,
        });
        updated++;
      } else {
        await prisma.task.create({
          data: {
            ...taskData,
            userId,
            motionTaskId: motionTask.id,
          },
        });
        created++;
      }
    }

    // Handle tasks that exist locally but not in Motion
    for (const localTask of localTasks) {
      if (!motionTaskMap.has(localTask.motionTaskId!)) {
        await prisma.task.delete({
          where: { id: localTask.id },
        });
        deleted++;
      }
    }

    return { created, updated, deleted };
  }

  private mapMotionStatus(motionStatus: string): string {
    const statusMap: Record<string, string> = {
      'TODO': 'todo',
      'IN_PROGRESS': 'in_progress',
      'COMPLETED': 'completed',
      'CANCELLED': 'cancelled',
    };
    return statusMap[motionStatus] || 'todo';
  }

  private mapMotionPriority(motionPriority: string): string {
    const priorityMap: Record<string, string> = {
      'LOW': 'low',
      'MEDIUM': 'medium',
      'HIGH': 'high',
      'URGENT': 'urgent',
    };
    return priorityMap[motionPriority] || 'medium';
  }
}
```

## AI Services Integration

### 1. OpenAI API Integration

```typescript
// lib/ai/openai.ts
import OpenAI from 'openai';

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateJournalInsights(entries: Array<{
    content: string;
    moodScore: number;
    createdAt: Date;
  }>): Promise<{
    moodTrend: string;
    keyThemes: string[];
    recommendations: string[];
    productivityScore: number;
  }> {
    const prompt = `
      Analyze the following journal entries and provide insights:

      ${entries.map(entry => `
        Date: ${entry.createdAt.toISOString().split('T')[0]}
        Mood: ${entry.moodScore}/10
        Content: ${entry.content}
      `).join('\n')}

      Provide a JSON response with:
      - moodTrend: Overall mood trend analysis
      - keyThemes: Array of recurring themes or topics
      - recommendations: Array of personalized recommendations
      - productivityScore: Score from 1-100 based on content analysis
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at analyzing journal entries and providing personalized insights. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const insights = JSON.parse(response.choices[0].message.content || '{}');
      return insights;
    } catch (error) {
      console.error('Failed to generate journal insights:', error);
      throw new Error('Failed to generate AI insights');
    }
  }

  async categorizeEmails(emails: Array<{
    subject: string;
    fromAddress: string;
    body: string;
  }>): Promise<Array<{
    categoryId: string;
    categoryName: string;
    confidence: number;
  }>> {
    const prompt = `
      Categorize the following emails and provide categories with confidence scores:

      ${emails.map(email => `
        Subject: ${email.subject}
        From: ${email.fromAddress}
        Body: ${email.body.substring(0, 500)}...
      `).join('\n\n')}

      Respond with a JSON array of categories with:
      - categoryId: Unique identifier
      - categoryName: Human-readable category name
      - confidence: Confidence score from 0-1
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at email categorization. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Failed to categorize emails:', error);
      throw new Error('Failed to categorize emails with AI');
    }
  }

  async generateTaskPrioritization(tasks: Array<{
    title: string;
    description: string;
    dueDate?: Date;
    priority: string;
  }>): Promise<Array<{
    taskId: string;
    recommendedPriority: string;
    reasoning: string;
    estimatedDuration: number;
  }>> {
    const prompt = `
      Analyze and prioritize the following tasks:

      ${tasks.map((task, index) => `
        Task ${index + 1}:
        Title: ${task.title}
        Description: ${task.description}
        Due Date: ${task.dueDate?.toISOString() || 'No due date'}
        Current Priority: ${task.priority}
      `).join('\n\n')}

      Respond with a JSON array containing:
      - taskId: Task index (starting from 0)
      - recommendedPriority: One of: low, medium, high, urgent
      - reasoning: Explanation for the priority recommendation
      - estimatedDuration: Estimated time in minutes
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at task prioritization and time management. Always respond with valid JSON.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      return JSON.parse(response.choices[0].message.content || '[]');
    } catch (error) {
      console.error('Failed to generate task prioritization:', error);
      throw new Error('Failed to prioritize tasks with AI');
    }
  }
}
```

## Real-time Synchronization

### 1. WebSocket Integration

```typescript
// lib/sync/websocket.ts
import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    console.log('Initializing Socket.IO server...');

    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production'
          ? 'https://your-domain.com'
          : ['http://localhost:3000'],
        methods: ['GET', 'POST'],
      },
    });

    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join user-specific room
      socket.on('join-user-room', (userId) => {
        socket.join(`user-${userId}`);
        console.log(`User ${userId} joined room`);
      });

      // Handle real-time sync events
      socket.on('sync-request', async (data) => {
        const { userId, service } = data;

        try {
          // Trigger sync based on service
          if (service === 'google-calendar') {
            const calendarService = new GoogleCalendarService();
            await calendarService.syncEvents(userId);
          } else if (service === 'gmail') {
            const gmailService = new GmailService();
            await gmailService.syncEmails(userId);
          }

          // Emit success response
          socket.emit('sync-complete', {
            service,
            status: 'success',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          socket.emit('sync-error', {
            service,
            error: error.message,
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Handle real-time data changes
      socket.on('data-changed', (data) => {
        const { userId, type, payload } = data;

        // Broadcast to user's other devices
        socket.to(`user-${userId}`).emit('data-updated', {
          type,
          payload,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  res.end();
}

// hooks/use-realtime-sync.ts
export const useRealtimeSync = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const newSocket = io({
      path: '/api/socket',
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join-user-room', userId);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('data-updated', (data) => {
      const { type, payload } = data;

      // Update local cache based on data type
      switch (type) {
        case 'tasks':
          queryClient.setQueryData(['tasks'], payload);
          break;
        case 'calendar-events':
          queryClient.setQueryData(['calendar-events'], payload);
          break;
        case 'emails':
          queryClient.setQueryData(['emails'], payload);
          break;
        case 'contacts':
          queryClient.setQueryData(['contacts'], payload);
          break;
      }
    });

    newSocket.on('sync-complete', (data) => {
      console.log('Sync completed:', data);
      // Refresh relevant queries
      queryClient.invalidateQueries([data.service]);
    });

    newSocket.on('sync-error', (error) => {
      console.error('Sync error:', error);
      // Show error notification
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId, queryClient]);

  const triggerSync = useCallback((service: string) => {
    if (socket && isConnected) {
      socket.emit('sync-request', { userId, service });
    }
  }, [socket, isConnected, userId]);

  const broadcastChange = useCallback((type: string, payload: any) => {
    if (socket && isConnected) {
      socket.emit('data-changed', { userId, type, payload });
    }
  }, [socket, isConnected, userId]);

  return {
    isConnected,
    triggerSync,
    broadcastChange,
  };
};
```

## Error Handling Patterns

### 1. Centralized Error Handler

```typescript
// lib/error-handler.ts
export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export const handleAPIError = (error: unknown): APIError => {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof Error) {
    // Handle specific error types
    if (error.message.includes('JWT')) {
      return new APIError('Authentication failed', 401, 'AUTH_ERROR');
    }

    if (error.message.includes('ECONNREFUSED')) {
      return new APIError('Service unavailable', 503, 'SERVICE_UNAVAILABLE');
    }

    if (error.message.includes('ENOENT')) {
      return new APIError('Resource not found', 404, 'NOT_FOUND');
    }

    return new APIError(error.message, 500, 'INTERNAL_ERROR');
  }

  return new APIError('An unexpected error occurred', 500, 'UNKNOWN_ERROR');
};

// API route wrapper
export const withErrorHandler = (
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      const apiError = handleAPIError(error);

      console.error('API Error:', {
        error: apiError.message,
        statusCode: apiError.statusCode,
        code: apiError.code,
        details: apiError.details,
        stack: error instanceof Error ? error.stack : undefined,
      });

      res.status(apiError.statusCode).json({
        error: {
          message: apiError.message,
          code: apiError.code,
          ...(process.env.NODE_ENV === 'development' && {
            details: apiError.details,
          }),
        },
      });
    }
  };
};
```

These comprehensive API integration guides provide production-ready implementations for all major external services required by the Ultimate Assistant Hub. The patterns ensure security, reliability, and maintainability while following modern best practices for API integration.