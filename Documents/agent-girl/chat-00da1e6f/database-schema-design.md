# Assistant Hub Database Schema Design

## Executive Summary

This document outlines a comprehensive database schema for an assistant hub application with 6 integrated modules: Dashboard, Journal, Tasks, Calendar, Email, and Contacts. The design prioritizes performance, scalability, and data integrity while supporting complex relationships and analytics.

## Database Architecture Recommendation

### Recommended Database: PostgreSQL 15+

**Rationale:**
- Superior JSON support for API response storage
- Advanced indexing (GIN, GiST, partial indexes)
- Full-text search capabilities
- Strong ACID compliance
- Mature replication and partitioning support
- Native support for time-series data with TimescaleDB extension
- Excellent for complex queries and analytics

### Secondary Considerations:
- **Redis** for caching and session management
- **Elasticsearch** for advanced search capabilities
- **TimescaleDB** extension for time-series analytics

---

## 1. Core Schema Design

### 1.1 User Management

```sql
-- Core user table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

-- User preferences and settings
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme VARCHAR(20) DEFAULT 'light',
    dashboard_layout JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}',
    api_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- External service connections
CREATE TABLE external_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL, -- 'google', 'motion', 'microsoft', etc.
    service_user_id VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_name)
);
```

### 1.2 Journal Module

```sql
-- Journal entries
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500),
    content TEXT NOT NULL,
    entry_date DATE NOT NULL,
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    mood_label VARCHAR(50),
    tags TEXT[],
    is_private BOOLEAN DEFAULT true,
    is_favorite BOOLEAN DEFAULT false,
    word_count INTEGER GENERATED ALWAYS AS (array_length(regexp_split_to_array(content, '\s+'), 1)) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal reflections
CREATE TABLE journal_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    reflection_type VARCHAR(50) NOT NULL, -- 'daily', 'weekly', 'monthly'
    content TEXT NOT NULL,
    insights JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily wins and achievements
CREATE TABLE daily_wins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    win_description TEXT NOT NULL,
    category VARCHAR(100),
    achievement_level INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, entry_date, win_description)
);

-- Learning insights
CREATE TABLE learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    insight_title VARCHAR(500),
    insight_content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    source_type VARCHAR(50), -- 'experience', 'reading', 'conversation', etc.
    source_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.3 Tasks Module

```sql
-- Tasks synchronized with Motion API
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motion_task_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'cancelled'
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER, -- in minutes
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    tags TEXT[],
    category VARCHAR(100),
    project_id UUID,
    parent_task_id UUID REFERENCES tasks(id),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT, -- RRULE format
    external_data JSONB DEFAULT '{}', -- Store Motion API response
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Task projects
CREATE TABLE task_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motion_project_id VARCHAR(255),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    is_active BOOLEAN DEFAULT true,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task time tracking
CREATE TABLE task_time_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);
```

### 1.4 Calendar Module

```sql
-- Calendar events from Google Calendar
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_event_id VARCHAR(255),
    calendar_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    location TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    is_all_day BOOLEAN DEFAULT false,
    timezone VARCHAR(50),
    visibility VARCHAR(20) DEFAULT 'default', -- 'default', 'public', 'private'
    status VARCHAR(20) DEFAULT 'confirmed', -- 'confirmed', 'tentative', 'cancelled'
    attendees JSONB DEFAULT '[]',
    recurrence_rule TEXT,
    original_event_id UUID REFERENCES calendar_events(id), -- For recurring event instances
    external_data JSONB DEFAULT '{}', -- Store Google Calendar API response
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Calendar sources
CREATE TABLE calendar_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_calendar_id VARCHAR(255) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    timezone VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, google_calendar_id)
);

-- Event reminders
CREATE TABLE event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'email', 'popup', 'sms'
    minutes_before INTEGER NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.5 Email Module

```sql
-- Email threads
CREATE TABLE email_threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gmail_thread_id VARCHAR(255),
    subject VARCHAR(1000),
    snippet TEXT,
    participant_emails TEXT[],
    last_message_at TIMESTAMPTZ,
    message_count INTEGER DEFAULT 0,
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN DEFAULT false,
    is_important BOOLEAN DEFAULT false,
    labels TEXT[],
    folder VARCHAR(100),
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual email messages
CREATE TABLE email_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES email_threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gmail_message_id VARCHAR(255),
    from_email VARCHAR(255),
    to_emails TEXT[],
    cc_emails TEXT[],
    bcc_emails TEXT[],
    subject VARCHAR(1000),
    body_text TEXT,
    body_html TEXT,
    attachments JSONB DEFAULT '[]',
    sent_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,
    is_read BOOLEAN DEFAULT false,
    is_draft BOOLEAN DEFAULT false,
    is_sent BOOLEAN DEFAULT false,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email attachments
CREATE TABLE email_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    gmail_attachment_id VARCHAR(255),
    filename VARCHAR(500),
    content_type VARCHAR(200),
    size_bytes INTEGER,
    file_url TEXT,
    is_downloaded BOOLEAN DEFAULT false,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email search index (for full-text search)
CREATE TABLE email_search_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES email_messages(id) ON DELETE CASCADE,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.6 Contacts Module

```sql
-- Contacts synchronized with Google Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    google_contact_id VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    display_name VARCHAR(200),
    company VARCHAR(200),
    job_title VARCHAR(200),
    notes TEXT,
    birthday DATE,
    is_favorite BOOLEAN DEFAULT false,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact email addresses
CREATE TABLE contact_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- 'home', 'work', 'other'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact phone numbers
CREATE TABLE contact_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    type VARCHAR(50), -- 'mobile', 'home', 'work', 'other'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact addresses
CREATE TABLE contact_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    type VARCHAR(50), -- 'home', 'work', 'other'
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 1.7 Dashboard Analytics

```sql
-- Dashboard widgets
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL, -- 'mood_chart', 'task_summary', 'upcoming_events', etc.
    title VARCHAR(200),
    position JSONB NOT NULL, -- {x, y, width, height}
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics data (time-series)
CREATE TABLE analytics_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- 'mood_average', 'tasks_completed', 'journal_entries', etc.
    metric_value NUMERIC,
    metric_unit VARCHAR(50),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    dimensions JSONB DEFAULT '{}', -- Additional dimensions for filtering
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User insights and recommendations
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL, -- 'productivity', 'wellness', 'pattern', 'recommendation'
    title VARCHAR(500) NOT NULL,
    description TEXT,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    action_items JSONB DEFAULT '[]',
    related_data JSONB DEFAULT '{}',
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50), -- 'task', 'journal_entry', 'email', etc.
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 2. Indexing Strategy

### 2.1 Performance Critical Indexes

```sql
-- User-related indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;

-- Journal entries indexes
CREATE INDEX idx_journal_entries_user_date ON journal_entries(user_id, entry_date DESC);
CREATE INDEX idx_journal_entries_mood ON journal_entries(user_id, mood_score) WHERE mood_score IS NOT NULL;
CREATE INDEX idx_journal_entries_tags ON journal_entries USING GIN(tags);
CREATE INDEX idx_journal_entries_search ON journal_entries USING GIN(to_tsvector('english', title || ' ' || content));

-- Tasks indexes
CREATE INDEX idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_tags ON tasks USING GIN(tags);
CREATE INDEX idx_tasks_priority ON tasks(user_id, priority DESC, due_date ASC);

-- Calendar events indexes
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_gmail_id ON calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;

-- Email indexes
CREATE INDEX idx_email_threads_user ON email_threads(user_id, last_message_at DESC);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id, sent_at DESC);
CREATE INDEX idx_email_search_vector ON email_search_index USING GIN(search_vector);
CREATE INDEX idx_email_threads_labels ON email_threads USING GIN(labels);

-- Contacts indexes
CREATE INDEX idx_contacts_user_name ON contacts(user_id, display_name);
CREATE INDEX idx_contact_emails_contact ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_address ON contact_emails(email);

-- Analytics indexes
CREATE INDEX idx_analytics_data_user_metric ON analytics_data(user_id, metric_name, period_start DESC);
CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, created_at DESC);
```

### 2.2 Composite Indexes for Common Queries

```sql
-- Dashboard queries
CREATE INDEX idx_journal_entries_user_date_mood ON journal_entries(user_id, entry_date DESC, mood_score);
CREATE INDEX idx_tasks_user_priority_due ON tasks(user_id, priority DESC, due_date ASC) WHERE status != 'completed';
CREATE INDEX idx_calendar_events_upcoming ON calendar_events(user_id, start_time) WHERE start_time > NOW();

-- Cross-module queries
CREATE INDEX idx_tasks_created_date ON tasks(user_id, created_at DESC);
CREATE INDEX idx_email_threads_unread ON email_threads(user_id, is_read) WHERE is_read = false;
```

---

## 3. Views for Common Queries

```sql
-- Dashboard summary view
CREATE VIEW dashboard_summary AS
SELECT
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN je.entry_date = CURRENT_DATE THEN je.id END) as today_journal_entries,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN t.id END) as upcoming_tasks,
    COUNT(DISTINCT CASE WHEN ce.start_time >= NOW() AND ce.start_time <= NOW() + INTERVAL '24 hours' THEN ce.id END) as today_events,
    COUNT(DISTINCT CASE WHEN et.is_read = false THEN et.id END) as unread_emails,
    AVG(je.mood_score) as avg_mood_this_week
FROM users u
LEFT JOIN journal_entries je ON u.id = je.user_id AND je.entry_date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN tasks t ON u.id = t.user_id AND t.status != 'completed'
LEFT JOIN calendar_events ce ON u.id = ce.user_id AND ce.status = 'confirmed'
LEFT JOIN email_threads et ON u.id = et.user_id
GROUP BY u.id;

-- Task analytics view
CREATE VIEW task_analytics AS
SELECT
    user_id,
    DATE_TRUNC('week', created_at) as week,
    COUNT(*) as tasks_created,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as tasks_completed,
    AVG(CASE WHEN status = 'completed' THEN actual_duration END) as avg_completion_time,
    COUNT(CASE WHEN priority <= 2 AND status = 'completed' THEN 1 END) as high_priority_completed
FROM tasks
GROUP BY user_id, DATE_TRUNC('week', created_at);

-- Email statistics view
CREATE VIEW email_statistics AS
SELECT
    user_id,
    DATE_TRUNC('day', received_at) as day,
    COUNT(*) as emails_received,
    COUNT(CASE WHEN is_read = true THEN 1 END) as emails_read,
    COUNT(CASE WHEN is_important = true THEN 1 END) as important_emails
FROM email_messages
WHERE received_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', received_at);
```

---

## 4. Data Synchronization Patterns

### 4.1 External API Integration Strategy

```sql
-- Sync status tracking
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'delta'
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    error_message TEXT,
    next_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, service_name, sync_type)
);

-- Conflict resolution log
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    local_data JSONB,
    remote_data JSONB,
    conflict_type VARCHAR(100),
    resolution VARCHAR(50), -- 'local_wins', 'remote_wins', 'manual'
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Caching Strategy

```sql
-- Cache table for frequently accessed data
CREATE TABLE cache_entries (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cache invalidation rules
CREATE TABLE cache_invalidation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    cache_key_pattern VARCHAR(255) NOT NULL,
    invalidate_on_insert BOOLEAN DEFAULT true,
    invalidate_on_update BOOLEAN DEFAULT true,
    invalidate_on_delete BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Security Implementation

### 5.1 Row Level Security (RLS)

```sql
-- Enable RLS on all user-specific tables
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY journal_entries_user_policy ON journal_entries
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY tasks_user_policy ON tasks
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY calendar_events_user_policy ON calendar_events
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);
```

### 5.2 Data Encryption

```sql
-- Extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive data
CREATE TABLE encrypted_secrets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    secret_type VARCHAR(50) NOT NULL,
    encrypted_data BYTEA NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to encrypt data
CREATE OR REPLACE FUNCTION encrypt_sensitive_data(data TEXT, key TEXT)
RETURNS BYTEA AS $$
BEGIN
    RETURN pgp_sym_encrypt(data, key);
END;
$$ LANGUAGE plpgsql;

-- Function to decrypt data
CREATE OR REPLACE FUNCTION decrypt_sensitive_data(encrypted_data BYTEA, key TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN pgp_sym_decrypt(encrypted_data, key);
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Backup and Recovery Strategy

### 6.1 Backup Configuration

```sql
-- Backup metadata table
CREATE TABLE backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL, -- 'full', 'incremental', 'differential'
    backup_path TEXT NOT NULL,
    backup_size_bytes BIGINT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL, -- 'running', 'completed', 'failed'
    tables_included TEXT[],
    compressed BOOLEAN DEFAULT true,
    encrypted BOOLEAN DEFAULT true,
    checksum VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backup retention policy
CREATE TABLE backup_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL,
    backup_type VARCHAR(50) NOT NULL,
    retention_days INTEGER NOT NULL,
    keep_monthly INTEGER DEFAULT 12,
    keep_weekly INTEGER DEFAULT 4,
    keep_daily INTEGER DEFAULT 7,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.2 Point-in-Time Recovery

```sql
-- WAL archive configuration
-- (This would be configured in postgresql.conf)
-- wal_level = replica
-- archive_mode = on
-- archive_command = 'cp %p /backup/wal_archive/%f'

-- Recovery point tracking
CREATE TABLE recovery_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recovery_time TIMESTAMPTZ NOT NULL,
    wal_segment_name VARCHAR(255),
    recovery_target_lsn PG_LSN,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 7. Performance Optimization

### 7.1 Partitioning Strategy

```sql
-- Partition journal entries by date
CREATE TABLE journal_entries_partitioned (
    LIKE journal_entries INCLUDING ALL
) PARTITION BY RANGE (entry_date);

-- Create monthly partitions
CREATE TABLE journal_entries_2024_01 PARTITION OF journal_entries_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE journal_entries_2024_02 PARTITION OF journal_entries_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Partition analytics data by time
CREATE TABLE analytics_data_partitioned (
    LIKE analytics_data INCLUDING ALL
) PARTITION BY RANGE (period_start);

-- Create weekly partitions for analytics
CREATE TABLE analytics_data_2024_w01 PARTITION OF analytics_data_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-01-08');
```

### 7.2 Materialized Views for Analytics

```sql
-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
    user_id,
    DATE_TRUNC('week', created_at) as week,
    COUNT(CASE WHEN entity_type = 'journal_entry' THEN 1 END) as journal_entries_count,
    COUNT(CASE WHEN entity_type = 'task' AND details->>'status' = 'completed' THEN 1 END) as tasks_completed,
    AVG(CASE WHEN entity_type = 'journal_entry' THEN (details->>'mood_score')::NUMERIC END) as avg_mood_score,
    COUNT(DISTINCT CASE WHEN entity_type = 'email' THEN entity_id END) as emails_processed
FROM activity_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('week', created_at)
WITH DATA;

-- Create unique index for refresh
CREATE UNIQUE INDEX idx_dashboard_metrics_unique ON dashboard_metrics(user_id, week);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;
```

---

## 8. Monitoring and Maintenance

### 8.1 Performance Monitoring

```sql
-- Query performance tracking
CREATE TABLE query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT,
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Slow query alerts
CREATE TABLE slow_query_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    threshold_ms INTEGER NOT NULL,
    alert_count INTEGER DEFAULT 0,
    last_alert_at TIMESTAMPTZ,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 8.2 Maintenance Tasks

```sql
-- Maintenance schedule
CREATE TABLE maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL, -- 'vacuum', 'analyze', 'reindex', 'cleanup'
    schedule_expression VARCHAR(100), -- Cron expression
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Automated cleanup tasks
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete activity logs older than 1 year
    DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '1 year';

    -- Delete expired cache entries
    DELETE FROM cache_entries WHERE expires_at < NOW();

    -- Clean up old sync status records
    DELETE FROM sync_status WHERE created_at < NOW() - INTERVAL '30 days';

    -- Vacuum analyze updated tables
    ANALYZE journal_entries;
    ANALYZE tasks;
    ANALYZE calendar_events;
    ANALYZE email_messages;
END;
$$ LANGUAGE plpgsql;
```

---

## 9. Migration Strategy

### 9.1 Version Control

```sql
-- Migration tracking
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    rollback_available BOOLEAN DEFAULT false
);

-- Example migration structure
-- Migration: 001_initial_schema.sql
INSERT INTO schema_migrations (version, description) VALUES
('001_initial_schema', 'Initial database schema with core tables');

-- Migration: 002_add_journal_analytics.sql
INSERT INTO schema_migrations (version, description) VALUES
('002_add_journal_analytics', 'Add analytics tables and materialized views');
```

### 9.2 Backward Compatibility

```sql
-- Feature flags for gradual rollout
CREATE TABLE feature_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_name VARCHAR(100) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT false,
    enabled_for_users UUID[] DEFAULT '{}',
    rollout_percentage INTEGER DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Check function for feature flags
CREATE OR REPLACE FUNCTION is_feature_enabled(flag_name TEXT, user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    flag_record feature_flags%ROWTYPE;
BEGIN
    SELECT * INTO flag_record FROM feature_flags WHERE feature_flags.flag_name = is_feature_enabled.flag_name;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- If feature is globally enabled
    IF flag_record.is_enabled THEN
        RETURN true;
    END IF;

    -- If specific user is enabled
    IF user_id IS NOT NULL AND user_id = ANY(flag_record.enabled_for_users) THEN
        RETURN true;
    END IF;

    -- Random rollout based on percentage
    IF flag_record.rollout_percentage > 0 THEN
        -- Use user_id hash for consistent rollout
        IF (hash_text(user_id::TEXT) % 100) < flag_record.rollout_percentage THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql;
```

---

## 10. GDPR Compliance

### 10.1 Data Subject Rights

```sql
-- Data subject requests tracking
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL, -- 'access', 'portability', 'rectification', 'erasure', 'restriction'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'rejected'
    request_data JSONB DEFAULT '{}',
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data erasure audit log
CREATE TABLE data_erasure_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    records_affected INTEGER,
    erasure_type VARCHAR(50), -- 'soft_delete', 'hard_delete', 'anonymize'
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);
```

### 10.2 Data Anonymization

```sql
-- Function to anonymize user data
CREATE OR REPLACE FUNCTION anonymize_user_data(user_id_to_anonymize UUID)
RETURNS void AS $$
DECLARE
    anonymous_email TEXT;
BEGIN
    -- Generate anonymous email
    anonymous_email := 'deleted_user_' || gen_random_uuid()::TEXT || '@example.com';

    -- Anonymize user profile
    UPDATE users
    SET
        email = anonymous_email,
        username = NULL,
        first_name = 'Deleted',
        last_name = 'User',
        avatar_url = NULL,
        is_active = false
    WHERE id = user_id_to_anonymize;

    -- Anonymize journal entries
    UPDATE journal_entries
    SET
        title = 'Deleted Entry',
        content = 'Content removed due to data deletion request',
        mood_score = NULL,
        mood_label = NULL
    WHERE user_id = user_id_to_anonymize;

    -- Anonymize tasks
    UPDATE tasks
    SET
        title = 'Deleted Task',
        description = 'Task description removed due to data deletion request'
    WHERE user_id = user_id_to_anonymize;

    -- Log the erasure
    INSERT INTO data_erasure_log (user_id, table_name, records_affected, erasure_type, performed_at, reason)
    VALUES
        (user_id_to_anonymize, 'users', 1, 'anonymize', NOW(), 'GDPR deletion request');
END;
$$ LANGUAGE plpgsql;
```

---

## Conclusion

This comprehensive database schema design provides:

1. **Scalable Architecture**: PostgreSQL with proper indexing, partitioning, and materialized views
2. **Data Integrity**: Foreign keys, constraints, and proper normalization
3. **Performance Optimization**: Strategic indexing, caching, and query optimization
4. **Security**: Row-level security, encryption, and audit logging
5. **Compliance**: GDPR-compliant data handling and anonymization
6. **Maintainability**: Migration tracking, feature flags, and monitoring

The schema supports complex relationships between modules while maintaining high performance for analytics and reporting. The design is future-proof and can scale to handle millions of records across all modules.

**Next Steps:**
1. Implement the schema in a staging environment
2. Create migration scripts for deployment
3. Set up monitoring and alerting
4. Implement backup and disaster recovery procedures
5. Conduct performance testing and optimization