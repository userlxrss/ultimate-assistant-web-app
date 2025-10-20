# Assistant Hub API Specifications

This repository contains comprehensive API specifications for the Assistant Hub application - a multi-module productivity platform that integrates with external services like Motion, Google Calendar, Google Contacts, and Gmail.

## 📋 Table of Contents

- [Overview](#overview)
- [API Documentation](#api-documentation)
- [External Integrations](#external-integrations)
- [Data Models](#data-models)
- [Real-time Communication](#real-time-communication)
- [Implementation Guide](#implementation-guide)
- [Getting Started](#getting-started)
- [Architecture](#architecture)
- [Security](#security)
- [Performance](#performance)

## 🎯 Overview

The Assistant Hub API provides a comprehensive backend solution for a productivity platform with six core modules:

1. **Dashboard** - Analytics and overview of all modules
2. **Journal** - Personal journaling with AI assistance
3. **Tasks** - Task management with Motion integration
4. **Calendar** - Event management with Google Calendar sync
5. **Email** - Email operations with Gmail integration
6. **Contacts** - Contact management with Google Contacts sync

### Key Features

- **RESTful API** with OpenAPI 3.0 specification
- **Real-time WebSocket** communication for live updates
- **External Service Integration** with major productivity platforms
- **Multi-level Caching** for optimal performance
- **Advanced Security** with JWT authentication and RBAC
- **Comprehensive Error Handling** with detailed logging
- **Rate Limiting** and request throttling
- **Data Validation** with comprehensive schema validation
- **Conflict Resolution** for multi-service synchronization

## 📚 API Documentation

### Core API Specification
- **File**: `assistant-hub-api.yaml`
- **Format**: OpenAPI 3.0.3
- **Base URL**: `https://api.assistant-hub.com/v1`

#### API Modules

#### Authentication
- `POST /auth/login` - User authentication
- `POST /auth/refresh` - Token refresh
- `POST /auth/logout` - User logout

#### Dashboard
- `GET /dashboard/overview` - Dashboard overview data
- `GET /dashboard/metrics` - Detailed metrics

#### Journal
- `GET /journal/entries` - List journal entries
- `POST /journal/entries` - Create journal entry
- `GET /journal/entries/{entryId}` - Get specific entry
- `PUT /journal/entries/{entryId}` - Update entry
- `DELETE /journal/entries/{entryId}` - Delete entry

#### Tasks
- `GET /tasks` - List tasks with filtering
- `POST /tasks` - Create new task
- `GET /tasks/{taskId}` - Get specific task
- `PUT /tasks/{taskId}` - Update task
- `DELETE /tasks/{taskId}` - Delete task
- `POST /tasks/sync` - Sync with Motion API

#### Calendar
- `GET /calendar/events` - List calendar events
- `POST /calendar/events` - Create event
- `GET /calendar/events/{eventId}` - Get specific event
- `PUT /calendar/events/{eventId}` - Update event
- `DELETE /calendar/events/{eventId}` - Delete event
- `POST /calendar/sync` - Sync with Google Calendar

#### Email
- `GET /email/messages` - List email messages
- `GET /email/messages/{messageId}` - Get specific message
- `POST /email/messages/{messageId}` - Send email
- `POST /email/sync` - Sync with Gmail

#### Contacts
- `GET /contacts` - List contacts
- `POST /contacts` - Create contact
- `GET /contacts/{contactId}` - Get specific contact
- `PUT /contacts/{contactId}` - Update contact
- `DELETE /contacts/{contactId}` - Delete contact
- `POST /contacts/sync` - Sync with Google Contacts

#### Integrations
- `GET /integrations/motion` - Motion integration status
- `POST /integrations/motion` - Configure Motion integration
- `GET /integrations/google` - Google integration status
- `POST /integrations/google` - Configure Google integration

### Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Operation completed successfully"
}
```

Error responses include detailed error information:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "title",
      "reason": "Title is required"
    }
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

## 🔗 External Integrations

### Motion API Integration
- **Authentication**: API Key-based
- **Sync Direction**: Bidirectional
- **Features**: Task synchronization, project management, AI scheduling
- **Rate Limit**: 10 requests/second, 600/minute

### Google Services Integration
- **Authentication**: OAuth 2.0
- **Services**: Calendar, Contacts, Gmail
- **Sync Features**: Real-time synchronization, conflict resolution
- **Rate Limit**: 100 queries/second, 1M/day

### Integration Patterns
- **Webhook Support**: Real-time updates from external services
- **Conflict Resolution**: Automatic and manual conflict handling
- **Rate Limiting**: Per-service rate limiting with backoff
- **Error Recovery**: Automatic retry with exponential backoff

## 📊 Data Models

### Core Entities
- **User**: Authentication, preferences, profile
- **JournalEntry**: Personal journal entries with AI assistance
- **Task**: Tasks with Motion integration
- **CalendarEvent**: Events with Google Calendar sync
- **EmailMessage**: Email with Gmail integration
- **Contact**: Contacts with Google Contacts sync

### Key Features
- **UUID Primary Keys**: All entities use UUID v4
- **Soft Deletes**: Non-destructive deletion with `deleted_at` timestamps
- **Audit Trails**: Created/updated timestamps for all entities
- **Full-text Search**: PostgreSQL search indexes for content
- **JSONB Support**: Flexible schema for preferences and metadata

### Relationships
- **User-centric**: All data belongs to a user
- **Cross-references**: Entities can reference each other (tasks → events, etc.)
- **External IDs**: Maintain references to external service IDs

## 🔄 Real-time Communication

### WebSocket Implementation
- **Endpoint**: `wss://api.assistant-hub.com/v1/ws/realtime`
- **Authentication**: JWT token subprotocol
- **Message Format**: JSON with type, payload, and timestamp

### Real-time Features
- **Live Updates**: Dashboard metrics, task changes, event updates
- **Notifications**: Real-time notification delivery
- **Sync Status**: Live synchronization progress
- **Collaboration**: Multi-user updates for shared resources

### Message Types
```typescript
// Dashboard updates
{ type: 'dashboard:update', payload: {...} }

// Task changes
{ type: 'task:update', payload: {...} }

// Calendar events
{ type: 'calendar:update', payload: {...} }

// New emails
{ type: 'email:new', payload: {...} }

// Contact changes
{ type: 'contact:update', payload: {...} }

// Sync progress
{ type: 'sync:progress', payload: {...} }
```

## 🛠 Implementation Guide

### Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with middleware
- **Database**: PostgreSQL with Redis caching
- **Queue**: RabbitMQ for async processing
- **WebSocket**: Socket.IO or ws library
- **Authentication**: JWT with refresh tokens
- **Validation**: Joi schema validation
- **Documentation**: OpenAPI/Swagger

### Architecture Patterns
- **Microservices**: Service-oriented architecture
- **CQRS**: Command Query Responsibility Segregation
- **Event Sourcing**: For audit trails and analytics
- **CQRS**: Separate read/write models
- **API Gateway**: Central routing and rate limiting

### Security Implementation
- **JWT Authentication**: Access and refresh tokens
- **RBAC**: Role-based access control
- **Rate Limiting**: Multiple tiers (global, user, IP)
- **Input Validation**: Comprehensive schema validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization and CSP headers

### Performance Optimization
- **Multi-level Caching**: Memory, Redis, database
- **Connection Pooling**: Database and Redis connections
- **Query Optimization**: Proper indexing and query planning
- **Pagination**: Cursor-based for large datasets
- **Compression**: Gzip/Brotli for API responses
- **CDN**: Static asset delivery

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 7+
- RabbitMQ 3.9+
- Docker and Docker Compose (optional)

### Development Setup

1. **Clone and Install**
```bash
git clone <repository-url>
cd assistant-hub-api
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**
```bash
# Run migrations
npm run migrate

# Seed development data
npm run seed
```

4. **Start Development Server**
```bash
npm run dev
```

### Docker Development
```bash
# Start all services
docker-compose up -d

# Run migrations
docker-compose exec api npm run migrate

# View logs
docker-compose logs -f api
```

### API Documentation
- **Local**: http://localhost:3000/docs
- **Swagger UI**: Interactive API testing
- **OpenAPI Spec**: `/api-specifications/assistant-hub-api.yaml`

## 🏗 Architecture

### System Components
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

### Microservices
- **Auth Service**: Authentication and authorization
- **API Service**: REST API and GraphQL endpoints
- **WebSocket Service**: Real-time communication
- **Sync Service**: External service synchronization
- **Analytics Service**: Usage analytics and metrics
- **Notification Service**: Push notifications and emails

### Data Flow
1. **Client Request** → API Gateway → Auth Service → API Service
2. **Database Operations** → PostgreSQL → Redis Cache → Response
3. **External Sync** → Queue Worker → External API → Database
4. **Real-time Updates** → WebSocket → Connected Clients

## 🔒 Security

### Authentication Flow
1. **Login** → Credentials verification → JWT tokens
2. **API Request** → JWT validation → Authorization check
3. **Token Refresh** → Refresh token validation → New access token
4. **Logout** → Token invalidation → Cache cleanup

### Security Features
- **JWT Tokens**: Short-lived access tokens with refresh tokens
- **Password Security**: Bcrypt hashing with salt
- **Rate Limiting**: Multiple tiers to prevent abuse
- **Input Validation**: Comprehensive schema validation
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing
- **Security Headers**: HSTS, CSP, X-Frame-Options

### Data Protection
- **Encryption**: Data encryption at rest and in transit
- **Backup Strategy**: Regular automated backups
- **Audit Logging**: Comprehensive audit trails
- **Privacy Controls**: User data privacy settings
- **GDPR Compliance**: Right to be forgotten implementation

## ⚡ Performance

### Caching Strategy
- **L1 Cache**: In-memory application cache (5 min TTL)
- **L2 Cache**: Redis distributed cache (1 hour TTL)
- **L3 Cache**: Database query cache (24 hour TTL)
- **Cache Invalidation**: Intelligent cache warming and invalidation

### Database Optimization
- **Indexing**: Strategic indexes for common queries
- **Query Optimization**: EXPLAIN ANALYZE for query tuning
- **Connection Pooling**: PgBouncer for connection management
- **Read Replicas**: Read scaling for analytics queries
- **Partitioning**: Time-based partitioning for large tables

### API Performance
- **Response Time**: < 200ms for 95th percentile
- **Throughput**: 1000+ requests/second
- **Compression**: Gzip/Brotli for API responses
- **Pagination**: Efficient cursor-based pagination
- **Batch Operations**: Bulk endpoints for efficiency

### Monitoring and Metrics
- **Application Metrics**: Custom business metrics
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Database Metrics**: Query performance, connection usage
- **External Service Metrics**: API call latency and success rates
- **User Metrics**: Active users, feature usage patterns

## 📝 API Usage Examples

### Authentication
```bash
# Login
curl -X POST https://api.assistant-hub.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "email": "user@example.com", "name": "John Doe" },
    "tokens": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

### Create Task
```bash
curl -X POST https://api.assistant-hub.com/v1/tasks \
  -H "Authorization: Bearer jwt_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project proposal",
    "description": "Finish the Q4 project proposal",
    "priority": "high",
    "dueDate": "2024-01-20T17:00:00Z",
    "tags": ["work", "q4"]
  }'
```

### Create Calendar Event
```bash
curl -X POST https://api.assistant-hub.com/v1/calendar/events \
  -H "Authorization: Bearer jwt_token_here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Team Meeting",
    "startTime": "2024-01-15T14:00:00Z",
    "endTime": "2024-01-15T15:00:00Z",
    "attendeeEmails": ["team@example.com"],
    "reminderMinutesBefore": [15]
  }'
```

### WebSocket Connection
```javascript
const ws = new WebSocket('wss://api.assistant-hub.com/v1/ws/realtime', ['jwt']);

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'jwt_token_here'
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- **Code Style**: ESLint + Prettier configuration
- **Testing**: Jest for unit tests, Supertest for integration tests
- **Documentation**: Update API specs for any changes
- **Security**: Follow security best practices
- **Performance**: Monitor impact of changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

- **Documentation**: This repository and API docs
- **Issues**: GitHub Issues for bug reports and feature requests
- **Email**: api-support@assistant-hub.com
- **Status**: https://status.assistant-hub.com

---

**Note**: This API specification is designed for production use with comprehensive error handling, security measures, and performance optimizations. All endpoints are thoroughly documented with examples and include proper validation and error handling.