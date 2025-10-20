# Database Setup Guide - Ultimate Assistant Hub

## Overview

This guide walks you through setting up the PostgreSQL database and Prisma ORM for the Ultimate Assistant Hub project.

## Prerequisites

- PostgreSQL 15+ installed and running
- Node.js 18+ installed
- npm or yarn installed

## Environment Configuration

1. **Copy the environment file:**
   ```bash
   cp .env.local .env
   ```

2. **Update your database URL in `.env`:**
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/ultimate_assistant_hub?schema=public"
   ```

3. **Create the database:**
   ```bash
   createdb ultimate_assistant_hub
   ```

## Database Setup

### Option 1: Using Prisma Migrate (Recommended)

1. **Generate the Prisma client:**
   ```bash
   npm run db:generate
   ```

2. **Create and run migrations:**
   ```bash
   npm run db:migrate
   ```

3. **Seed the database with test data:**
   ```bash
   npm run db:seed
   ```

### Option 2: Using Prisma Push (Development)

1. **Push schema to database:**
   ```bash
   npm run db:push
   ```

2. **Seed the database:**
   ```bash
   npm run db:seed
   ```

## Available Scripts

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and run migrations
- `npm run db:reset` - Reset database and reseed
- `npm run db:seed` - Seed database with test data
- `npm run db:studio` - Open Prisma Studio
- `npm run db:format` - Format Prisma schema
- `npm run db:validate` - Validate Prisma schema

## Database Schema Overview

The database includes the following modules:

### Core Tables
- `users` - User management
- `user_preferences` - User settings and preferences
- `external_connections` - OAuth connections (Google, Motion, etc.)

### Journal Module
- `journal_entries` - Daily journal entries
- `journal_reflections` - AI-generated reflections
- `daily_wins` - Daily achievements
- `learning_insights` - Learning notes

### Tasks Module
- `tasks` - Task management with Motion sync
- `task_projects` - Project organization
- `task_time_entries` - Time tracking
- `task_dependencies` - Task dependencies

### Calendar Module
- `calendar_events` - Google Calendar sync
- `calendar_sources` - Calendar sources
- `event_reminders` - Event notifications

### Email Module
- `email_threads` - Gmail thread management
- `email_messages` - Individual email messages
- `email_attachments` - Email attachments

### Contacts Module
- `contacts` - Contact management
- `contact_emails` - Contact email addresses
- `contact_phones` - Contact phone numbers
- `contact_addresses` - Contact addresses

### Analytics & Insights
- `dashboard_widgets` - Dashboard configuration
- `analytics_data` - Metrics and analytics
- `user_insights` - AI-powered insights
- `activity_logs` - User activity tracking

### System Tables
- `sync_status` - Sync operation tracking
- `cache_entries` - Application caching
- `feature_flags` - Feature management
- `sync_conflicts` - Data sync conflicts
- `query_performance_log` - Performance monitoring
- `backup_metadata` - Backup tracking
- `schema_migrations` - Migration history

### Compliance & Security
- `data_subject_requests` - GDPR compliance
- `data_erasure_log` - Data deletion audit

## Test Users

After seeding, you'll have access to these test accounts:

- **Email:** `demo@ultimateassistant.com`
- **Password:** `password123`

- **Email:** `test@ultimateassistant.com`
- **Password:** `password123`

## Development Tools

### Prisma Studio
Browse your database visually:
```bash
npm run db:studio
```

### Database Management
- View schema: `prisma/schema.prisma`
- Migration files: `prisma/migrations/`
- Seed script: `prisma/seed.ts`

## Security Features

- **Row-Level Security (RLS):** Enabled on user-specific tables
- **Data Encryption:** Sensitive data is encrypted at rest
- **Audit Logging:** All user actions are logged
- **GDPR Compliance:** Data subject request handling
- **Password Security:** bcrypt hashing with 12 rounds

## Performance Optimizations

- **Strategic Indexing:** Optimized for common queries
- **Materialized Views:** Pre-computed analytics data
- **Connection Pooling:** Configurable database pool
- **Query Caching:** Application-level caching
- **Full-Text Search:** Optimized search capabilities

## Backup Strategy

The schema includes support for:
- Automated backup tracking
- Point-in-time recovery
- Backup metadata storage
- Retention policy management

## Next Steps

1. Configure your OAuth credentials (Google, Motion)
2. Set up environment variables for external services
3. Run the development server: `npm run dev`
4. Test the application with the seeded data

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `createdb ultimate_assistant_hub`

### Migration Issues
- Reset database: `npm run db:reset`
- Check migration files in `prisma/migrations/`
- Validate schema: `npm run db:validate`

### Seed Issues
- Check seed script for errors
- Verify database connection
- Run `npm run db:reset` then `npm run db:seed`

## Production Considerations

1. **Environment Variables:** Never commit `.env` files
2. **Database Security:** Use strong passwords
3. **SSL Connections:** Enable SSL for production
4. **Backups:** Set up regular automated backups
5. **Monitoring:** Monitor database performance
6. **Scaling:** Consider read replicas for scaling

## Support

For database-related issues:
1. Check the Prisma documentation: https://www.prisma.io/docs/
2. Review the PostgreSQL documentation: https://www.postgresql.org/docs/
3. Check the schema file: `prisma/schema.prisma`
4. Review migration files: `prisma/migrations/`