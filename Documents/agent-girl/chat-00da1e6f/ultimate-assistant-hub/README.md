# Ultimate Assistant Hub API

A comprehensive productivity and personal management system built with Next.js 15, TypeScript, and Prisma.

## Features

### 🎯 Core Modules
- **Dashboard**: Real-time metrics and productivity insights
- **Journal**: Personal journaling with AI-powered reflections
- **Tasks**: Task management with Motion.so integration
- **Calendar**: Event scheduling with Google Calendar sync
- **Email**: Email management with Gmail integration
- **Contacts**: Contact management with Google Contacts sync
- **Analytics**: Advanced productivity insights and recommendations
- **Search**: Global search across all modules

### 🔐 Authentication & Security
- JWT-based authentication
- Rate limiting and request throttling
- Input validation with Zod schemas
- XSS protection and sanitization
- CORS configuration

### 🔗 External Integrations
- **Google Calendar**: Event synchronization
- **Google Contacts**: Contact management
- **Gmail**: Email processing and management
- **Motion.so**: Task scheduling and automation
- **OpenAI**: AI-powered journal reflections

### 📊 Analytics & Insights
- Productivity scoring
- Trend analysis
- Personalized recommendations
- Achievement tracking
- Mood tracking and insights

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt
- **Validation**: Zod schemas
- **Rate Limiting**: rate-limiter-flexible
- **External APIs**: Google APIs, Motion.so, OpenAI
- **Documentation**: OpenAPI 3.0 specification

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Platform account (for integrations)
- Motion.so API key (optional)
- OpenAI API key (for AI reflections)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ultimate-assistant-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/ultimate_assistant_hub"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Gmail API
GMAIL_API_KEY="your-gmail-api-key"
GMAIL_CLIENT_ID="your-gmail-client-id"
GMAIL_CLIENT_SECRET="your-gmail-client-secret"

# Google Calendar
GOOGLE_CALENDAR_CLIENT_ID="your-google-calendar-client-id"
GOOGLE_CALENDAR_CLIENT_SECRET="your-google-calendar-client-secret"

# Google Contacts
GOOGLE_CONTACTS_API_KEY="your-google-contacts-api-key"

# Motion.so API
MOTION_API_KEY="your-motion-api-key"

# OpenAI (for AI reflections)
OPENAI_API_KEY="your-openai-api-key"

# Email (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Security
JWT_SECRET="your-jwt-secret-key"
ENCRYPTION_KEY="your-encryption-key"

# Application
NODE_ENV="development"
PORT=3000
```

4. **Set up the database**
```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) View database in Prisma Studio
npm run db:studio
```

5. **Start the development server**
```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

## API Documentation

### Interactive Documentation
Visit `http://localhost:3000/api/docs` to view the full OpenAPI/Swagger specification.

### Authentication
All API endpoints (except auth routes) require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
- **Default**: 100 requests per 15 minutes per user/IP
- **Headers**: Rate limit information is included in response headers
- **Bypass**: Rate limits can be configured via environment variables

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Dashboard
- `GET /api/dashboard/metrics` - Get comprehensive dashboard metrics

### Journal
- `GET /api/journal` - Get journal entries with filtering
- `POST /api/journal` - Create new journal entry
- `GET /api/journal/[id]` - Get specific journal entry
- `PUT /api/journal/[id]` - Update journal entry
- `DELETE /api/journal/[id]` - Delete journal entry
- `POST /api/journal/[id]/reflect` - Generate AI reflection

### Tasks
- `GET /api/tasks` - Get tasks with filtering
- `POST /api/tasks` - Create new task
- `GET /api/tasks/[id]` - Get specific task
- `PUT /api/tasks/[id]` - Update task
- `DELETE /api/tasks/[id]` - Delete task

### Calendar
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create new event
- `GET /api/calendar/[id]` - Get specific event
- `PUT /api/calendar/[id]` - Update event
- `DELETE /api/calendar/[id]` - Delete event

### Email
- `GET /api/emails` - Get emails with filtering
- `POST /api/emails/send` - Send email
- `POST /api/emails/sync` - Sync emails from Gmail

### Contacts
- `GET /api/contacts` - Get contacts with filtering
- `POST /api/contacts` - Create new contact
- `GET /api/contacts/[id]` - Get specific contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact

### Analytics
- `GET /api/analytics/metrics` - Get detailed analytics
- `GET /api/analytics/insights` - Get productivity insights

### Search
- `GET /api/search` - Global search across all modules

## Usage Examples

### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Response
{
  "success": true,
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Creating a Journal Entry
```bash
curl -X POST http://localhost:3000/api/journal \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "title": "My Day",
    "content": "Today was productive...",
    "mood": "happy",
    "tags": ["work", "achievements"]
  }'
```

### Generating AI Reflection
```bash
curl -X POST http://localhost:3000/api/journal/[entry-id]/reflect \
  -H "Authorization: Bearer <your-token>"
```

### Global Search
```bash
curl "http://localhost:3000/api/search?query=meeting&types=calendar,tasks&limit=10" \
  -H "Authorization: Bearer <your-token>"
```

## Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    },
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

Error responses:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": { ... }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "requestId": "req_123456789"
  }
}
```

## Error Codes

- `UNAUTHORIZED` - Invalid or missing authentication
- `FORBIDDEN` - Insufficient permissions
- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `CONFLICT` - Resource conflict
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded
- `INTERNAL_ERROR` - Server error

## Development

### Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Type checking
- `npm run db:generate` - Generate Prisma client
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

### Project Structure
```
ultimate-assistant-hub/
├── app/
│   └── api/
│       ├── auth/
│       ├── dashboard/
│       ├── journal/
│       ├── tasks/
│       ├── calendar/
│       ├── emails/
│       ├── contacts/
│       ├── analytics/
│       ├── search/
│       └── docs/
├── lib/
│   └── db.ts
├── middleware/
│   └── auth.ts
├── types/
│   └── index.ts
├── utils/
│   ├── api-response.ts
│   ├── pagination.ts
│   └── validation.ts
├── validations/
│   └── index.ts
├── prisma/
│   └── schema.prisma
└── public/
```

## Deployment

### Environment Setup
1. Configure production environment variables
2. Set up production PostgreSQL database
3. Configure external API credentials

### Build & Deploy
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Monitoring & Logging

### Health Checks
- `/api/health` - Application health status
- `/api/docs` - API documentation

### Logging
- Development: Verbose console logging
- Production: Error logging with request tracking

## Security Considerations

1. **Input Validation**: All inputs are validated with Zod schemas
2. **Rate Limiting**: Prevents abuse and DDoS attacks
3. **Authentication**: JWT tokens with expiration
4. **XSS Protection**: Input sanitization
5. **CORS**: Configured for production domains
6. **Environment Variables**: Sensitive data in environment files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Email: support@ultimateassistant.com
- Documentation: `/api/docs`
- Issues: GitHub repository issues

---

**Built with ❤️ for productivity enthusiasts**