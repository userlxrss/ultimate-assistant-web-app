# API Implementation Guide

This document provides comprehensive implementation guidelines for the Assistant Hub API, including architecture patterns, security measures, and deployment strategies.

## Architecture Overview

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client Apps   │    │   Web Client    │    │  Mobile Apps    │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴─────────────┐
                    │    API Gateway/Load      │
                    │      Balancer             │
                    └─────────────┬─────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          │                      │                      │
    ┌─────┴─────┐        ┌───────┴───────┐      ┌──────┴──────┐
    │   Auth    │        │   API Server  │      │ WebSocket   │
    │  Service  │        │ (REST + GraphQL)│     │   Server    │
    └───────────┘        └───────┬───────┘      └─────────────┘
                                   │
          ┌────────────────────────┼────────────────────────┐
          │                        │                        │
    ┌─────┴─────┐          ┌───────┴───────┐        ┌───────┴───────┐
    │ Database  │          │   Cache       │        │  Queue        │
    │ (Postgres)│          │   (Redis)     │        │ (RabbitMQ)    │
    └───────────┘          └───────────────┘        └───────────────┘
```

### Microservices Architecture
```typescript
// Core services
interface ServiceArchitecture {
  auth: {
    responsibility: 'Authentication & Authorization';
    database: 'PostgreSQL';
    cache: 'Redis';
    ports: [3001];
  };
  api: {
    responsibility: 'REST API & GraphQL';
    database: 'PostgreSQL';
    cache: 'Redis';
    ports: [3000];
  };
  websocket: {
    responsibility: 'Real-time communication';
    cache: 'Redis (pub/sub)';
    ports: [3002];
  };
  sync: {
    responsibility: 'External service synchronization';
    queue: 'RabbitMQ';
    database: 'PostgreSQL';
    ports: [3003];
  };
  analytics: {
    responsibility: 'Usage analytics & metrics';
    database: 'TimescaleDB';
    cache: 'Redis';
    ports: [3004];
  };
  notification: {
    responsibility: 'Push notifications & emails';
    queue: 'RabbitMQ';
    database: 'PostgreSQL';
    ports: [3005];
  };
}
```

## Database Design

### PostgreSQL Schema
```sql
-- Core tables
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    locale VARCHAR(10) DEFAULT 'en',
    avatar_url TEXT,
    bio TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    last_login_at TIMESTAMP,
    last_login_ip INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_created_at ON users(created_at);

-- User preferences JSONB
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    preferences JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    categories TEXT[] DEFAULT '{}',
    mood VARCHAR(50),
    is_private BOOLEAN DEFAULT TRUE,
    is_public BOOLEAN DEFAULT FALSE,
    share_token VARCHAR(255) UNIQUE,
    word_count INTEGER DEFAULT 0,
    reading_time INTEGER DEFAULT 0,
    ai_summary TEXT,
    ai_insights TEXT,
    ai_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at DESC);
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);
CREATE INDEX idx_journal_entries_search ON journal_entries USING GIN(to_tsvector('english', title || ' ' || content));

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    due_date TIMESTAMP,
    start_date TIMESTAMP,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,
    project_id UUID REFERENCES projects(id),
    parent_task_id UUID REFERENCES tasks(id),
    tags TEXT[] DEFAULT '{}',
    labels TEXT[] DEFAULT '{}',
    assignee_id UUID REFERENCES users(id),
    source VARCHAR(50) NOT NULL DEFAULT 'internal',
    external_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'synced',
    last_sync_at TIMESTAMP,
    ai_suggestions TEXT[] DEFAULT '{}',
    estimated_complexity INTEGER CHECK (estimated_complexity >= 1 AND estimated_complexity <= 10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_external_id ON tasks(external_id);

-- Calendar events
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    is_all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) NOT NULL DEFAULT 'UTC',
    location TEXT,
    meeting_url TEXT,
    meeting_type VARCHAR(50),
    organizer_id UUID NOT NULL REFERENCES users(id),
    busy BOOLEAN DEFAULT TRUE,
    visibility VARCHAR(20) DEFAULT 'default',
    source VARCHAR(50) NOT NULL DEFAULT 'internal',
    external_id VARCHAR(255),
    calendar_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'synced',
    last_sync_at TIMESTAMP,
    categories TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    agenda TEXT,
    preparation_time INTEGER,
    follow_up_task_id UUID REFERENCES tasks(id),
    meeting_notes TEXT,
    ai_suggested_time BOOLEAN DEFAULT FALSE,
    ai_transcript TEXT,
    ai_summary TEXT,
    ai_action_items TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_calendar_events_user_id ON calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON calendar_events(end_time);
CREATE INDEX idx_calendar_events_external_id ON calendar_events(external_id);

-- Event attendees (join table)
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending',
    role VARCHAR(20) DEFAULT 'required',
    is_organizer BOOLEAN DEFAULT FALSE,
    response_at TIMESTAMP,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_event_attendees_event_id ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_email ON event_attendees(email);

-- Email messages
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    from_email JSONB NOT NULL, -- EmailAddress object
    to_emails JSONB NOT NULL,   // EmailAddress array
    cc_emails JSONB DEFAULT '[]',
    bcc_emails JSONB DEFAULT '[]',
    reply_to_email JSONB,
    body_text TEXT,
    body_html TEXT,
    snippet TEXT,
    folder VARCHAR(100) NOT NULL DEFAULT 'INBOX',
    is_read BOOLEAN DEFAULT FALSE,
    is_starred BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    is_spam BOOLEAN DEFAULT FALSE,
    is_draft BOOLEAN DEFAULT FALSE,
    is_sent BOOLEAN DEFAULT FALSE,
    source VARCHAR(50) NOT NULL DEFAULT 'internal',
    external_id VARCHAR(255),
    external_thread_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'synced',
    last_sync_at TIMESTAMP,
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    sentiment VARCHAR(20),
    ai_summary TEXT,
    ai_action_items TEXT[] DEFAULT '{}',
    ai_suggested_replies TEXT[] DEFAULT '{}',
    ai_category VARCHAR(100),
    thread_position INTEGER DEFAULT 0,
    total_in_thread INTEGER DEFAULT 1,
    message_size INTEGER DEFAULT 0,
    message_hash VARCHAR(255),
    sent_at TIMESTAMP,
    received_at TIMESTAMP,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_email_messages_user_id ON email_messages(user_id);
CREATE INDEX idx_email_messages_thread_id ON email_messages(thread_id);
CREATE INDEX idx_email_messages_folder ON email_messages(folder);
CREATE INDEX idx_email_messages_received_at ON email_messages(received_at DESC);
CREATE INDEX idx_email_messages_external_id ON email_messages(external_id);
CREATE INDEX idx_email_messages_search ON email_messages USING GIN(to_tsvector('english', subject || ' ' || COALESCE(body_text, '')));

-- Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    middle_name VARCHAR(100),
    prefix VARCHAR(50),
    suffix VARCHAR(50),
    nickname VARCHAR(100),
    phonetic_name VARCHAR(255),
    company VARCHAR(255),
    job_title VARCHAR(255),
    department VARCHAR(255),
    manager VARCHAR(255),
    assistant VARCHAR(255),
    birthday DATE,
    anniversary DATE,
    notes TEXT,
    relationship VARCHAR(100),
    last_contacted TIMESTAMP,
    contact_frequency VARCHAR(20),
    interaction_count INTEGER DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    external_id VARCHAR(255),
    sync_status VARCHAR(20) DEFAULT 'synced',
    last_sync_at TIMESTAMP,
    is_private BOOLEAN DEFAULT FALSE,
    is_shared BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    initials VARCHAR(10),
    search_vector tsvector,
    ai_tags TEXT[] DEFAULT '{}',
    ai_relationship_strength NUMERIC(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_contacts_name ON contacts(name);
CREATE INDEX idx_contacts_company ON contacts(company);
CREATE INDEX idx_contacts_search ON contacts USING GIN(search_vector);
CREATE INDEX idx_contacts_external_id ON contacts(external_id);

-- Contact emails (one-to-many)
CREATE TABLE contact_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'other',
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contact_emails_contact_id ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_email ON contact_emails(email);

-- Contact phones
CREATE TABLE contact_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    country_code VARCHAR(10) DEFAULT '+1',
    type VARCHAR(50) DEFAULT 'other',
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    carrier VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact addresses
CREATE TABLE contact_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    street TEXT,
    street2 TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    type VARCHAR(50) DEFAULT 'other',
    is_primary BOOLEAN DEFAULT FALSE,
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- External service configurations
CREATE TABLE external_service_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    configuration JSONB NOT NULL DEFAULT '{}',
    sync_settings JSONB NOT NULL DEFAULT '{}',
    last_sync_at TIMESTAMP,
    sync_status VARCHAR(20) DEFAULT 'synced',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service)
);

-- Sync jobs
CREATE TABLE sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service VARCHAR(50) NOT NULL,
    data_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    direction VARCHAR(10) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    total_count INTEGER DEFAULT 0,
    processed_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    result JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}',
    channels TEXT[] DEFAULT '{in_app}',
    scheduled_at TIMESTAMP,
    expires_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending',
    read_at TIMESTAMP,
    delivered_at TIMESTAMP[],
    failed_at TIMESTAMP[],
    priority VARCHAR(20) DEFAULT 'normal',
    group_id VARCHAR(255),
    actions JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

## Security Implementation

### Authentication & Authorization
```typescript
// JWT token structure
interface JWTPayload {
  sub: string;                    // User ID
  email: string;
  role: string;
  permissions: string[];
  sessionId: string;
  iat: number;                    // Issued at
  exp: number;                    // Expires at
  jti: string;                    // JWT ID
}

// Authentication middleware
class AuthenticationMiddleware {
  async authenticate(req: Request, res: Response, next: NextFunction) {
    try {
      const token = this.extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const payload = await this.verifyToken(token);
      const user = await this.getUser(payload.sub);

      if (!user || user.deletedAt) {
        return res.status(401).json({ error: 'Invalid user' });
      }

      req.user = user;
      req.permissions = payload.permissions;
      req.sessionId = payload.sessionId;

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  private async verifyToken(token: string): Promise<JWTPayload> {
    // Check token blacklist
    const isBlacklisted = await this.redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new Error('Token is blacklisted');
    }

    // Verify JWT signature
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;

    // Verify session is still valid
    const session = await this.getSession(payload.sessionId);
    if (!session || session.expiresAt < new Date()) {
      throw new Error('Session expired');
    }

    return payload;
  }
}

// Role-based access control
class AuthorizationMiddleware {
  requirePermission(permission: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.permissions?.includes(permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }

  requireOwnership(resourceType: string) {
    return async (req: Request, res: Response, next: NextFunction) {
      const resourceId = req.params.id || req.params.taskId || req.params.entryId;
      const resource = await this.getResource(resourceType, resourceId, req.user.id);

      if (!resource || resource.userId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      req.resource = resource;
      next();
    };
  }
}
```

### Rate Limiting
```typescript
class RateLimitService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async checkRateLimit(
    identifier: string,
    limit: number,
    window: number, // in seconds
    identifierType: 'ip' | 'user' | 'global' = 'user'
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = this.getRateLimitKey(identifier, identifierType);
    const now = Math.floor(Date.now() / 1000);
    const windowStart = now - window;

    // Use Redis sorted set for sliding window
    const pipeline = this.redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(key, 0, windowStart);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Count requests in window
    pipeline.zcard(key);

    // Set expiry
    pipeline.expire(key, window);

    const results = await pipeline.exec();
    const requestCount = results?.[2]?.[1] as number || 0;

    const allowed = requestCount <= limit;
    const remaining = Math.max(0, limit - requestCount);
    const resetTime = now + window;

    return { allowed, remaining, resetTime };
  }

  private getRateLimitKey(identifier: string, type: string): string {
    return `rate_limit:${type}:${identifier}`;
  }
}

// Rate limiting middleware
class RateLimitMiddleware {
  constructor(private rateLimitService: RateLimitService) {}

  // API rate limits
  api = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per window
    message: 'Too many API requests'
  });

  // Authentication rate limits
  auth = this.createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 login attempts
    message: 'Too many authentication attempts'
  });

  // External sync rate limits
  sync = this.createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 sync requests
    message: 'Too many sync requests'
  });

  private createRateLimit(options: {
    windowMs: number;
    max: number;
    message: string;
  }) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const identifier = req.user?.id || req.ip;
      const window = Math.floor(options.windowMs / 1000);

      const result = await this.rateLimitService.checkRateLimit(
        identifier,
        options.max,
        window
      );

      res.set({
        'X-RateLimit-Limit': options.max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetTime.toString()
      });

      if (!result.allowed) {
        return res.status(429).json({
          error: options.message,
          retryAfter: window
        });
      }

      next();
    };
  }
}
```

### Data Validation
```typescript
import Joi from 'joi';

// Schemas for validation
const schemas = {
  // User schemas
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    rememberMe: Joi.boolean().default(false)
  }),

  register: Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).required(),
    name: Joi.string().min(1).max(100).required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required()
  }),

  // Journal schemas
  createJournalEntry: Joi.object({
    title: Joi.string().min(1).max(500).required(),
    content: Joi.string().min(1).required(),
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    mood: Joi.string().valid('happy', 'sad', 'neutral', 'excited', 'anxious', 'grateful'),
    isPrivate: Joi.boolean().default(true)
  }),

  updateJournalEntry: Joi.object({
    title: Joi.string().min(1).max(500),
    content: Joi.string().min(1),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
    mood: Joi.string().valid('happy', 'sad', 'neutral', 'excited', 'anxious', 'grateful'),
    isPrivate: Joi.boolean()
  }).min(1),

  // Task schemas
  createTask: Joi.object({
    title: Joi.string().min(1).max(500).required(),
    description: Joi.string().max(2000),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    dueDate: Joi.date().iso().greater('now'),
    startDate: Joi.date().iso(),
    estimatedDuration: Joi.number().integer().min(1).max(8 * 60), // Max 8 hours
    tags: Joi.array().items(Joi.string().max(50)).max(10).default([]),
    assigneeId: Joi.string().uuid()
  }),

  updateTask: Joi.object({
    title: Joi.string().min(1).max(500),
    description: Joi.string().max(2000),
    status: Joi.string().valid('todo', 'in_progress', 'review', 'completed', 'cancelled'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    dueDate: Joi.date().iso(),
    startDate: Joi.date().iso(),
    estimatedDuration: Joi.number().integer().min(1).max(8 * 60),
    tags: Joi.array().items(Joi.string().max(50)).max(10),
    assigneeId: Joi.string().uuid()
  }).min(1),

  // Calendar event schemas
  createCalendarEvent: Joi.object({
    title: Joi.string().min(1).max(500).required(),
    description: Joi.string().max(2000),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().greater(Joi.ref('startTime')).required(),
    isAllDay: Joi.boolean().default(false),
    location: Joi.string().max(500),
    attendeeEmails: Joi.array().items(Joi.string().email()).max(50).default([]),
    reminderMinutesBefore: Joi.array().items(Joi.number().integer().min(0)).max(5).default([15])
  }),

  // Email schemas
  sendEmail: Joi.object({
    to: Joi.array().items(Joi.string().email()).min(1).max(50).required(),
    cc: Joi.array().items(Joi.string().email()).max(50).default([]),
    bcc: Joi.array().items(Joi.string().email()).max(50).default([]),
    subject: Joi.string().min(1).max(500).required(),
    body: Joi.string().min(1).required(),
    bodyHtml: Joi.string()
  }),

  // Contact schemas
  createContact: Joi.object({
    name: Joi.string().min(1).max(255).required(),
    firstName: Joi.string().max(100),
    lastName: Joi.string().max(100),
    emails: Joi.array().items(Joi.object({
      email: Joi.string().email().required(),
      type: Joi.string().valid('personal', 'work', 'other', 'home', 'mobile').default('other'),
      isPrimary: Joi.boolean().default(false)
    })).max(5).default([]),
    phones: Joi.array().items(Joi.object({
      number: Joi.string().required(),
      type: Joi.string().valid('mobile', 'home', 'work', 'main', 'fax', 'pager', 'other').default('other'),
      isPrimary: Joi.boolean().default(false)
    })).max(5).default([]),
    company: Joi.string().max(255),
    jobTitle: Joi.string().max(255),
    notes: Joi.string().max(2000)
  })
};

// Validation middleware
class ValidationMiddleware {
  validate(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true
      });

      if (error) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        return res.status(400).json({
          error: 'Validation failed',
          errors
        });
      }

      req.body = value;
      next();
    };
  }

  validateParams(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.params);

      if (error) {
        return res.status(400).json({
          error: 'Invalid parameters',
          details: error.details.map(d => d.message)
        });
      }

      req.params = value;
      next();
    };
  }

  validateQuery(schema: Joi.ObjectSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
      const { error, value } = schema.validate(req.query);

      if (error) {
        return res.status(400).json({
          error: 'Invalid query parameters',
          details: error.details.map(d => d.message)
        });
      }

      req.query = value;
      next();
    };
  }
}
```

## Caching Strategy

### Redis Implementation
```typescript
class CacheService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  // Basic cache operations
  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await this.redis.setex(key, ttl, serialized);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) === 1;
  }

  // Cache-aside pattern
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = 3600 // 1 hour default
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }

  // Write-through cache
  async writeThrough<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    await writer(value);
    await this.set(key, value, ttl);
  }

  // Write-behind cache
  async writeBehind<T>(
    key: string,
    value: T,
    writer: (value: T) => Promise<void>,
    ttl?: number
  ): Promise<void> {
    await this.set(key, value, ttl);

    // Queue write operation for async processing
    this.queueWrite(key, value, writer);
  }

  // Cache invalidation
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  // Multi-get for performance
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    const values = await this.redis.mget(...keys);
    return values.map(value => value ? JSON.parse(value) : null);
  }

  // Multi-set for performance
  async mset(entries: Array<{key: string, value: any, ttl?: number}>): Promise<void> {
    const pipeline = this.redis.pipeline();

    for (const entry of entries) {
      const serialized = JSON.stringify(entry.value);
      if (entry.ttl) {
        pipeline.setex(entry.key, entry.ttl, serialized);
      } else {
        pipeline.set(entry.key, serialized);
      }
    }

    await pipeline.exec();
  }

  private async queueWrite<T>(key: string, value: T, writer: (value: T) => Promise<void>) {
    // Implementation would depend on your queue system
    // This is a placeholder for the write-behind queue
    await this.redis.lpush('write_behind_queue', JSON.stringify({
      key,
      value,
      timestamp: Date.now()
    }));
  }
}

// Cache keys patterns
const CacheKeys = {
  user: (userId: string) => `user:${userId}`,
  userPreferences: (userId: string) => `user:${userId}:preferences`,
  journalEntry: (entryId: string) => `journal:entry:${entryId}`,
  journalEntries: (userId: string, page: number, limit: number) =>
    `journal:entries:${userId}:${page}:${limit}`,
  task: (taskId: string) => `task:${taskId}`,
  tasks: (userId: string, filters: string) => `tasks:${userId}:${filters}`,
  calendarEvent: (eventId: string) => `calendar:event:${eventId}`,
  calendarEvents: (userId: string, dateRange: string) =>
    `calendar:events:${userId}:${dateRange}`,
  emailMessage: (messageId: string) => `email:message:${messageId}`,
  emailMessages: (userId: string, folder: string, page: number) =>
    `email:messages:${userId}:${folder}:${page}`,
  contact: (contactId: string) => `contact:${contactId}`,
  contacts: (userId: string, search: string) => `contacts:${userId}:${search}`,
  syncStatus: (userId: string, service: string) => `sync:status:${userId}:${service}`,
  rateLimit: (identifier: string, type: string) => `rate_limit:${type}:${identifier}`,
  session: (sessionId: string) => `session:${sessionId}`,
  blacklist: (tokenId: string) => `blacklist:${tokenId}`
};

// Cache TTL values (in seconds)
const CacheTTL = {
  user: 3600,                    // 1 hour
  userPreferences: 1800,         // 30 minutes
  journalEntry: 1800,            // 30 minutes
  journalEntries: 300,           // 5 minutes
  task: 1800,                    // 30 minutes
  tasks: 300,                    // 5 minutes
  calendarEvent: 1800,           // 30 minutes
  calendarEvents: 300,           // 5 minutes
  emailMessage: 1800,            // 30 minutes
  emailMessages: 300,            // 5 minutes
  contact: 1800,                 // 30 minutes
  contacts: 300,                 // 5 minutes
  syncStatus: 60,                // 1 minute
  rateLimit: 900,                // 15 minutes
  session: 86400,                // 24 hours
  blacklist: 604800              // 7 days
};
```

## Error Handling

### Error Types and Handling
```typescript
// Base error class
abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error types
class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT', true, { retryAfter });
  }
}

class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: any) {
    super(`${service} error: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, details);
  }
}

class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'DATABASE_ERROR', true, details);
  }
}

// Error handler middleware
class ErrorHandler {
  handle(error: Error, req: Request, res: Response, next: NextFunction): void {
    if (error instanceof AppError) {
      this.handleAppError(error, res);
    } else {
      this.handleUnexpectedError(error, res, req);
    }
  }

  private handleAppError(error: AppError, res: Response): void {
    const response = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details })
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    };

    res.status(error.statusCode).json(response);
  }

  private handleUnexpectedError(error: Error, res: Response, req: Request): void {
    console.error('Unexpected error:', {
      error: error.message,
      stack: error.stack,
      requestId: req.headers['x-request-id'],
      userId: req.user?.id,
      path: req.path,
      method: req.method
    });

    const response = {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred'
      },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id']
    };

    res.status(500).json(response);
  }
}

// Async error wrapper
function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
```

This comprehensive implementation guide provides the foundation for building a robust, scalable, and secure Assistant Hub API with proper error handling, caching, and security measures.