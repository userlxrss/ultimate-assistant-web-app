-- Database Migration Scripts for Assistant Hub
-- Execute in order for clean database setup

-- Migration 001: Create core tables
-- File: 001_initial_schema.sql

BEGIN;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom UUID generation function
CREATE OR REPLACE FUNCTION gen_random_uuid()
RETURNS UUID AS $$
BEGIN
    RETURN uuid_generate_v4();
END;
$$ LANGUAGE plpgsql;

-- Create users table
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

-- Create user_preferences table
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

-- Create external_connections table
CREATE TABLE external_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
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

-- Create journal_entries table
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

-- Create journal_reflections table
CREATE TABLE journal_reflections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    reflection_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    insights JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_wins table
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

-- Create learning_insights table
CREATE TABLE learning_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    insight_title VARCHAR(500),
    insight_content TEXT NOT NULL,
    category VARCHAR(100),
    tags TEXT[],
    source_type VARCHAR(50),
    source_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tasks table
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motion_task_id VARCHAR(255),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    due_date TIMESTAMPTZ,
    estimated_duration INTEGER,
    actual_duration INTEGER,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    tags TEXT[],
    category VARCHAR(100),
    project_id UUID,
    parent_task_id UUID REFERENCES tasks(id),
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Create task_projects table
CREATE TABLE task_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    motion_project_id VARCHAR(255),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    color VARCHAR(7),
    is_active BOOLEAN DEFAULT true,
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_time_entries table
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

-- Create task_dependencies table
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'finish_to_start',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

-- Create calendar_events table
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
    visibility VARCHAR(20) DEFAULT 'default',
    status VARCHAR(20) DEFAULT 'confirmed',
    attendees JSONB DEFAULT '[]',
    recurrence_rule TEXT,
    original_event_id UUID REFERENCES calendar_events(id),
    external_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create calendar_sources table
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

-- Create event_reminders table
CREATE TABLE event_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL,
    minutes_before INTEGER NOT NULL,
    is_sent BOOLEAN DEFAULT false,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create email_threads table
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

-- Create email_messages table
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

-- Create email_attachments table
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

-- Create contacts table
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

-- Create contact_emails table
CREATE TABLE contact_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_phones table
CREATE TABLE contact_phones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    phone_number VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create contact_addresses table
CREATE TABLE contact_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
    street_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    type VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create dashboard_widgets table
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    title VARCHAR(200),
    position JSONB NOT NULL,
    config JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create analytics_data table
CREATE TABLE analytics_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    metric_unit VARCHAR(50),
    period_start TIMESTAMPTZ NOT NULL,
    period_end TIMESTAMPTZ NOT NULL,
    dimensions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_insights table
CREATE TABLE user_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    confidence_score NUMERIC CHECK (confidence_score >= 0 AND confidence_score <= 1),
    action_items JSONB DEFAULT '[]',
    related_data JSONB DEFAULT '{}',
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create activity_logs table
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_status table
CREATE TABLE sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    sync_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
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

-- Create cache_entries table
CREATE TABLE cache_entries (
    cache_key VARCHAR(255) PRIMARY KEY,
    cache_data JSONB NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create feature_flags table
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

-- Create schema_migrations table
CREATE TABLE schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT,
    rollback_available BOOLEAN DEFAULT false
);

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('001_initial_schema', 'Initial database schema with core tables', true);

COMMIT;

-- Migration 002: Create indexes
-- File: 002_create_indexes.sql

BEGIN;

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
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Calendar events indexes
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time, end_time);
CREATE INDEX idx_calendar_events_date_range ON calendar_events(start_time, end_time);
CREATE INDEX idx_calendar_events_gmail_id ON calendar_events(google_event_id) WHERE google_event_id IS NOT NULL;

-- Email indexes
CREATE INDEX idx_email_threads_user ON email_threads(user_id, last_message_at DESC);
CREATE INDEX idx_email_messages_thread ON email_messages(thread_id, sent_at DESC);
CREATE INDEX idx_email_threads_labels ON email_threads USING GIN(labels);
CREATE INDEX idx_email_messages_from ON email_messages(from_email);
CREATE INDEX idx_email_messages_to ON email_messages USING GIN(to_emails);

-- Contacts indexes
CREATE INDEX idx_contacts_user_name ON contacts(user_id, display_name);
CREATE INDEX idx_contact_emails_contact ON contact_emails(contact_id);
CREATE INDEX idx_contact_emails_address ON contact_emails(email);
CREATE INDEX idx_contacts_search ON contacts USING GIN(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(company, '') || ' ' || COALESCE(notes, '')));

-- Analytics indexes
CREATE INDEX idx_analytics_data_user_metric ON analytics_data(user_id, metric_name, period_start DESC);
CREATE INDEX idx_activity_logs_user_time ON activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Cache indexes
CREATE INDEX idx_cache_entries_expires ON cache_entries(expires_at);

-- External connections indexes
CREATE INDEX idx_external_connections_user_service ON external_connections(user_id, service_name);
CREATE INDEX idx_external_connections_sync ON external_connections(sync_enabled, last_sync_at);

-- Sync status indexes
CREATE INDEX idx_sync_status_user_service ON sync_status(user_id, service_name, status);
CREATE INDEX idx_sync_status_next_sync ON sync_status(next_sync_at) WHERE next_sync_at IS NOT NULL;

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('002_create_indexes', 'Create performance indexes for all tables', true);

COMMIT;

-- Migration 003: Create views and materialized views
-- File: 003_create_views.sql

BEGIN;

-- Dashboard summary view
CREATE VIEW dashboard_summary AS
SELECT
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN je.entry_date = CURRENT_DATE THEN je.id END) as today_journal_entries,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN t.id END) as upcoming_tasks,
    COUNT(DISTINCT CASE WHEN ce.start_time >= NOW() AND ce.start_time <= NOW() + INTERVAL '24 hours' THEN ce.id END) as today_events,
    COUNT(DISTINCT CASE WHEN et.is_read = false THEN et.id END) as unread_emails,
    COUNT(DISTINCT c.id) as total_contacts,
    COALESCE(AVG(je.mood_score), 0) as avg_mood_this_week
FROM users u
LEFT JOIN journal_entries je ON u.id = je.user_id AND je.entry_date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN tasks t ON u.id = t.user_id AND t.status != 'completed'
LEFT JOIN calendar_events ce ON u.id = ce.user_id AND ce.status = 'confirmed' AND ce.start_time >= NOW()
LEFT JOIN email_threads et ON u.id = et.user_id
LEFT JOIN contacts c ON u.id = c.user_id
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

-- Journal mood trends view
CREATE VIEW journal_mood_trends AS
SELECT
    user_id,
    DATE_TRUNC('week', entry_date) as week,
    COUNT(*) as entry_count,
    AVG(mood_score) as avg_mood,
    MIN(mood_score) as min_mood,
    MAX(mood_score) as max_mood,
    STDDEV(mood_score) as mood_stddev
FROM journal_entries
WHERE mood_score IS NOT NULL
GROUP BY user_id, DATE_TRUNC('week', entry_date)
ORDER BY week DESC;

-- Email statistics view
CREATE VIEW email_statistics AS
SELECT
    user_id,
    DATE_TRUNC('day', received_at) as day,
    COUNT(*) as emails_received,
    COUNT(CASE WHEN is_read = true THEN 1 END) as emails_read,
    COUNT(CASE WHEN is_important = true THEN 1 END) as important_emails,
    COUNT(CASE WHEN is_starred = true THEN 1 END) as starred_emails
FROM email_messages
WHERE received_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY user_id, DATE_TRUNC('day', received_at);

-- Upcoming events view
CREATE VIEW upcoming_events AS
SELECT
    ce.*,
    cs.name as calendar_name,
    cs.color as calendar_color
FROM calendar_events ce
JOIN calendar_sources cs ON ce.calendar_id = cs.google_calendar_id
WHERE ce.start_time >= NOW()
  AND ce.start_time <= NOW() + INTERVAL '7 days'
  AND ce.status = 'confirmed'
ORDER BY ce.start_time ASC;

-- Recent activity view
CREATE VIEW recent_activity AS
SELECT
    al.*,
    CASE
        WHEN al.entity_type = 'journal_entry' THEN je.title
        WHEN al.entity_type = 'task' THEN t.title
        WHEN al.entity_type = 'email_thread' THEN et.subject
        WHEN al.entity_type = 'calendar_event' THEN ce.title
        ELSE al.entity_type
    END as entity_title
FROM activity_logs al
LEFT JOIN journal_entries je ON al.entity_type = 'journal_entry' AND al.entity_id = je.id
LEFT JOIN tasks t ON al.entity_type = 'task' AND al.entity_id = t.id
LEFT JOIN email_threads et ON al.entity_type = 'email_thread' AND al.entity_id = et.id
LEFT JOIN calendar_events ce ON al.entity_type = 'calendar_event' AND al.entity_id = ce.id
ORDER BY al.created_at DESC;

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('003_create_views', 'Create analytical views for dashboard and reporting', true);

COMMIT;

-- Migration 004: Create materialized views
-- File: 004_create_materialized_views.sql

BEGIN;

-- Materialized view for dashboard metrics
CREATE MATERIALIZED VIEW dashboard_metrics AS
SELECT
    user_id,
    DATE_TRUNC('week', created_at) as week,
    COUNT(CASE WHEN entity_type = 'journal_entry' THEN 1 END) as journal_entries_count,
    COUNT(CASE WHEN entity_type = 'task' AND details->>'status' = 'completed' THEN 1 END) as tasks_completed,
    AVG(CASE WHEN entity_type = 'journal_entry' THEN (details->>'mood_score')::NUMERIC END) as avg_mood_score,
    COUNT(DISTINCT CASE WHEN entity_type = 'email' THEN entity_id END) as emails_processed,
    COUNT(CASE WHEN entity_type = 'calendar_event' THEN 1 END) as events_created,
    COUNT(CASE WHEN entity_type = 'contact' THEN 1 END) as contacts_added
FROM activity_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY user_id, DATE_TRUNC('week', created_at)
WITH DATA;

-- Create unique index for concurrent refresh
CREATE UNIQUE INDEX idx_dashboard_metrics_unique ON dashboard_metrics(user_id, week);

-- Materialized view for task completion trends
CREATE MATERIALIZED VIEW task_completion_trends AS
SELECT
    user_id,
    DATE_TRUNC('month', completed_at) as month,
    COUNT(*) as tasks_completed,
    AVG(actual_duration) as avg_completion_time,
    COUNT(CASE WHEN priority <= 2 THEN 1 END) as high_priority_completed,
    COUNT(CASE WHEN due_date <= completed_at THEN 1 END) as on_time_completed
FROM tasks
WHERE status = 'completed' AND completed_at IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', completed_at)
WITH DATA;

CREATE UNIQUE INDEX idx_task_completion_trends_unique ON task_completion_trends(user_id, month);

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('004_create_materialized_views', 'Create materialized views for performance optimization', true);

COMMIT;

-- Migration 005: Add RLS and security functions
-- File: 005_add_security.sql

BEGIN;

-- Enable Row Level Security on user-specific tables
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create authenticated_users role (this would be created by your auth system)
-- DO $$
-- BEGIN
--     IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'authenticated_users') THEN
--         CREATE ROLE authenticated_users;
--     END IF;
-- END
-- $$;

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

CREATE POLICY email_threads_user_policy ON email_threads
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);

CREATE POLICY contacts_user_policy ON contacts
    FOR ALL TO authenticated_users
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Create function to check feature flags
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
    IF flag_record.rollout_percentage > 0 AND user_id IS NOT NULL THEN
        -- Use user_id hash for consistent rollout
        IF (hashtext(user_id::TEXT) % 100) < flag_record.rollout_percentage THEN
            RETURN true;
        END IF;
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to refresh dashboard metrics
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics;
END;
$$ LANGUAGE plpgsql;

-- Create function to refresh task completion trends
CREATE OR REPLACE FUNCTION refresh_task_completion_trends()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY task_completion_trends;
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_connections_updated_at BEFORE UPDATE ON external_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_projects_updated_at BEFORE UPDATE ON task_projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_threads_updated_at BEFORE UPDATE ON email_threads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cache_entries_updated_at BEFORE UPDATE ON cache_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('005_add_security', 'Add Row Level Security, triggers, and utility functions', true);

COMMIT;

-- Migration 006: Add audit and compliance tables
-- File: 006_add_compliance.sql

BEGIN;

-- Create data_subject_requests table
CREATE TABLE data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    request_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    request_data JSONB DEFAULT '{}',
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data_erasure_log table
CREATE TABLE data_erasure_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    table_name VARCHAR(100) NOT NULL,
    records_affected INTEGER,
    erasure_type VARCHAR(50),
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT
);

-- Create backup_metadata table
CREATE TABLE backup_metadata (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(50) NOT NULL,
    backup_path TEXT NOT NULL,
    backup_size_bytes BIGINT,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) NOT NULL,
    tables_included TEXT[],
    compressed BOOLEAN DEFAULT true,
    encrypted BOOLEAN DEFAULT true,
    checksum VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create sync_conflicts table
CREATE TABLE sync_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_name VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    local_data JSONB,
    remote_data JSONB,
    conflict_type VARCHAR(100),
    resolution VARCHAR(50),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create query_performance_log table
CREATE TABLE query_performance_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_hash VARCHAR(64) NOT NULL,
    query_text TEXT,
    execution_time_ms INTEGER,
    rows_returned INTEGER,
    user_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Record this migration
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('006_add_compliance', 'Add audit, compliance, and performance monitoring tables', true);

COMMIT;

-- Create helper function for anonymization
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

-- Create function for cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS void AS $$
BEGIN
    -- Delete activity logs older than 1 year
    DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '1 year';

    -- Delete expired cache entries
    DELETE FROM cache_entries WHERE expires_at < NOW();

    -- Clean up old sync status records
    DELETE FROM sync_status WHERE created_at < NOW() - INTERVAL '30 days';

    -- Clean up old performance logs
    DELETE FROM query_performance_log WHERE created_at < NOW() - INTERVAL '90 days';

    -- Vacuum analyze updated tables
    ANALYZE journal_entries;
    ANALYZE tasks;
    ANALYZE calendar_events;
    ANALYZE email_messages;
    ANALYZE activity_logs;
END;
$$ LANGUAGE plpgsql;

-- Create scheduled job for materialized view refresh
CREATE OR REPLACE FUNCTION schedule_maintenance()
RETURNS void AS $$
BEGIN
    -- Refresh materialized views
    PERFORM refresh_dashboard_metrics();
    PERFORM refresh_task_completion_trends();

    -- Cleanup old data
    PERFORM cleanup_old_data();
END;
$$ LANGUAGE plpgsql;

-- Final record
INSERT INTO schema_migrations (version, description, rollback_available) VALUES
('006_compliance_functions', 'Add anonymization and maintenance functions', true);

COMMIT;