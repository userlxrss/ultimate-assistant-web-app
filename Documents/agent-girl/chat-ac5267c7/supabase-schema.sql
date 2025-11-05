-- =====================================================================
-- COMPREHENSIVE SUPABASE DATABASE SCHEMA FOR PRODUCTIVITY HUB
-- PostgreSQL 14+ with Supabase Extensions
-- =====================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- USER MANAGEMENT TABLES
-- =====================================================================

-- Enhanced user profiles table extending Supabase auth.users
CREATE TABLE public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    language VARCHAR(10) DEFAULT 'en',
    theme VARCHAR(20) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    bio TEXT,
    location VARCHAR(255),
    website VARCHAR(500),
    company VARCHAR(255),
    job_title VARCHAR(255)
);

-- User preferences and settings
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- User dashboard preferences
CREATE TABLE public.user_dashboard_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    layout JSONB NOT NULL DEFAULT '{}',
    widgets TEXT[] DEFAULT ARRAY['tasks', 'journal', 'calendar', 'email'],
    widget_order TEXT[] DEFAULT ARRAY['tasks', 'journal', 'calendar', 'email'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================================
-- TASK MANAGEMENT TABLES
-- =====================================================================

-- Main tasks table with comprehensive task structure
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    notes TEXT,
    completed BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in-progress', 'completed', 'cancelled', 'on-hold')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100) DEFAULT 'general',
    workspace VARCHAR(100),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    estimated_time INTEGER, -- in minutes
    actual_time INTEGER, -- in minutes
    recurrence VARCHAR(20) DEFAULT 'none' CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly', 'yearly')),
    reminder TIMESTAMP WITH TIME ZONE,
    color VARCHAR(7), -- hex color
    assignee VARCHAR(255), -- email or name
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    attachments TEXT[] DEFAULT ARRAY[]::TEXT[],
    dependencies UUID[] DEFAULT ARRAY[]::UUID[],
    metadata JSONB DEFAULT '{}'
);

-- Subtasks table for nested task structure
CREATE TABLE public.subtasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    completed BOOLEAN DEFAULT false,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Projects table for task organization
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- hex color
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Time tracking for tasks
CREATE TABLE public.time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- JOURNAL MANAGEMENT TABLES
-- =====================================================================

-- Enhanced journal entries table
CREATE TABLE public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(500),
    content TEXT,
    mood INTEGER CHECK (mood >= 1 AND mood <= 10),
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    reflections TEXT,
    gratitude TEXT,
    biggest_win TEXT,
    challenge TEXT,
    learning TEXT,
    tomorrow_focus TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    affirmations TEXT[] DEFAULT ARRAY[]::TEXT[],
    weather VARCHAR(50),
    location VARCHAR(255),
    themes TEXT[] DEFAULT ARRAY[]::TEXT[],
    insights TEXT[] DEFAULT ARRAY[]::TEXT[],
    template VARCHAR(100),
    is_draft BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_saved TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, date)
);

-- Journal templates table
CREATE TABLE public.journal_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(50) DEFAULT '📝',
    description TEXT,
    color VARCHAR(7) DEFAULT '#3B82F6',
    content TEXT NOT NULL,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0
);

-- Mood tracking for analytics
CREATE TABLE public.mood_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
    energy INTEGER CHECK (energy >= 1 AND energy <= 10),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- =====================================================================
-- CALENDAR MANAGEMENT TABLES
-- =====================================================================

-- Calendar events table
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location VARCHAR(500),
    type VARCHAR(50) DEFAULT 'personal' CHECK (type IN ('meeting', 'personal', 'work', 'learning', 'health', 'other')),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule JSONB, -- iCal RRULE format
    buffer_time INTEGER DEFAULT 0, -- minutes
    timezone VARCHAR(50) DEFAULT 'UTC',
    visibility VARCHAR(20) DEFAULT 'private' CHECK (visibility IN ('public', 'private', 'confidential')),
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'tentative', 'cancelled')),
    creator_name VARCHAR(255),
    creator_email VARCHAR(255),
    organizer_name VARCHAR(255),
    organizer_email VARCHAR(255),
    notes TEXT,
    conference_data JSONB,
    extended_properties JSONB DEFAULT '{}',
    external_id VARCHAR(255), -- for sync with external calendars
    source VARCHAR(50) DEFAULT 'local' CHECK (source IN ('local', 'google', 'outlook', 'apple')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event attendees table
CREATE TABLE public.event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    response_status VARCHAR(20) DEFAULT 'needsAction' CHECK (response_status IN ('needsAction', 'declined', 'tentative', 'accepted')),
    is_optional BOOLEAN DEFAULT false,
    is_organizer BOOLEAN DEFAULT false,
    is_resource BOOLEAN DEFAULT false,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event reminders table
CREATE TABLE public.event_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    type VARCHAR(20) DEFAULT 'popup' CHECK (type IN ('email', 'popup', 'sms')),
    minutes_before INTEGER NOT NULL DEFAULT 15,
    method VARCHAR(20) DEFAULT 'override' CHECK (method IN ('override', 'absolute')),
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event attachments table
CREATE TABLE public.event_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.calendar_events(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    url TEXT NOT NULL,
    mime_type VARCHAR(100),
    size INTEGER,
    icon_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event types/categories
CREATE TABLE public.event_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50) DEFAULT '📅',
    default_duration INTEGER DEFAULT 60, -- minutes
    is_system BOOLEAN DEFAULT false, -- for default system types
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, name)
);

-- Calendar preferences
CREATE TABLE public.calendar_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    default_view VARCHAR(20) DEFAULT 'week' CHECK (default_view IN ('day', 'week', 'month', 'agenda')),
    working_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "days": [1,2,3,4,5]}',
    timezone VARCHAR(50) DEFAULT 'UTC',
    default_event_duration INTEGER DEFAULT 60,
    week_start_day INTEGER DEFAULT 1, -- 1=Monday
    show_week_numbers BOOLEAN DEFAULT false,
    time_format VARCHAR(5) DEFAULT '24h' CHECK (time_format IN ('12h', '24h')),
    date_format VARCHAR(20) DEFAULT 'YYYY-MM-DD',
    enable_buffer_time BOOLEAN DEFAULT false,
    default_buffer_time INTEGER DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- =====================================================================
-- EMAIL MANAGEMENT TABLES (For Gmail Integration)
-- =====================================================================

-- Email accounts for OAuth integration
CREATE TABLE public.email_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL CHECK (provider IN ('google', 'outlook', 'imap')),
    email VARCHAR(255) NOT NULL,
    encrypted_tokens TEXT NOT NULL, -- encrypted OAuth tokens
    scopes TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMP WITH TIME ZONE,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, provider, email)
);

-- Email messages (metadata only, full content stored in provider)
CREATE TABLE public.email_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
    provider_message_id VARCHAR(255) NOT NULL, -- Gmail message ID, etc.
    thread_id VARCHAR(255),
    subject TEXT,
    snippet TEXT,
    from_email VARCHAR(255),
    from_name VARCHAR(255),
    to_emails TEXT[], -- array of email addresses
    cc_emails TEXT[],
    bcc_emails TEXT[],
    date TIMESTAMP WITH TIME ZONE,
    sent BOOLEAN DEFAULT false,
    read BOOLEAN DEFAULT false,
    starred BOOLEAN DEFAULT false,
    important BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    deleted BOOLEAN DEFAULT false,
    draft BOOLEAN DEFAULT false,
    labels TEXT[],
    has_attachments BOOLEAN DEFAULT false,
    category VARCHAR(50) DEFAULT 'primary' CHECK (category IN ('primary', 'social', 'promotions', 'updates', 'forums', 'spam', 'trash')),
    folder VARCHAR(50) DEFAULT 'inbox',
    priority VARCHAR(10) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    size INTEGER, -- bytes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, provider_message_id)
);

-- Email threads
CREATE TABLE public.email_threads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES public.email_accounts(id) ON DELETE CASCADE,
    provider_thread_id VARCHAR(255) NOT NULL,
    subject TEXT NOT NULL,
    participants TEXT[], -- array of email addresses
    last_message_date TIMESTAMP WITH TIME ZONE,
    message_count INTEGER DEFAULT 1,
    unread_count INTEGER DEFAULT 0,
    has_attachments BOOLEAN DEFAULT false,
    labels TEXT[],
    snippet TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, provider_thread_id)
);

-- =====================================================================
-- INTEGRATION & SYNC TABLES
-- =====================================================================

-- Service connections for OAuth providers
CREATE TABLE public.service_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('google', 'motion', 'microsoft', 'slack')),
    encrypted_tokens TEXT NOT NULL,
    scopes TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'synced', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, service_type)
);

-- Sync logs for tracking synchronization activities
CREATE TABLE public.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(50),
    entity_type VARCHAR(50), -- 'tasks', 'events', 'emails'
    entity_id UUID,
    action VARCHAR(50), -- 'create', 'update', 'delete', 'sync'
    status VARCHAR(20) CHECK (status IN ('pending', 'success', 'error')),
    data_size INTEGER,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking for rate limiting and analytics
CREATE TABLE public.api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(50),
    endpoint VARCHAR(255),
    request_count INTEGER DEFAULT 1,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_tracked DATE DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    UNIQUE(user_id, service_type, endpoint, date_tracked)
);

-- =====================================================================
-- ANALYTICS & INSIGHTS TABLES
-- =====================================================================

-- User activity tracking
CREATE TABLE public.user_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL, -- 'task', 'journal', 'event', 'email'
    entity_id UUID,
    action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'completed', 'deleted'
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard analytics
CREATE TABLE public.user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    tasks_completed INTEGER DEFAULT 0,
    tasks_created INTEGER DEFAULT 0,
    journal_entries INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_received INTEGER DEFAULT 0,
    focus_time_minutes INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2) DEFAULT 0.00,
    mood_average DECIMAL(3,1),
    energy_average DECIMAL(3,1),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- AI-generated insights
CREATE TABLE public.ai_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    insight_type VARCHAR(50) CHECK (insight_type IN ('pattern', 'recommendation', 'motivation', 'warning')),
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    is_read BOOLEAN DEFAULT false,
    is_actioned BOOLEAN DEFAULT false,
    valid_until TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================================
-- SYSTEM & ADMIN TABLES
-- =====================================================================

-- System health monitoring
CREATE TABLE public.service_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type VARCHAR(50) NOT NULL UNIQUE,
    is_healthy BOOLEAN DEFAULT true,
    last_check_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    last_success_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- OAuth state management for CSRF protection
CREATE TABLE public.oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

-- =====================================================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =====================================================================

-- User profile indexes
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_active ON public.user_profiles(is_active) WHERE is_active = true;

-- Task indexes
CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_priority ON public.tasks(priority);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_tasks_completed ON public.tasks(completed) WHERE completed = false;
CREATE INDEX idx_tasks_category ON public.tasks(category);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);
CREATE INDEX idx_tasks_tags ON public.tasks USING GIN(tags);
CREATE INDEX idx_tasks_dependencies ON public.tasks USING GIN(dependencies);

-- Subtask indexes
CREATE INDEX idx_subtasks_task_id ON public.subtasks(task_id);
CREATE INDEX idx_subtasks_completed ON public.subtasks(completed);

-- Journal indexes
CREATE INDEX idx_journal_entries_user_id ON public.journal_entries(user_id);
CREATE INDEX idx_journal_entries_date ON public.journal_entries(date DESC);
CREATE INDEX idx_journal_entries_mood ON public.journal_entries(mood) WHERE mood IS NOT NULL;
CREATE INDEX idx_journal_entries_tags ON public.journal_entries USING GIN(tags);
CREATE INDEX idx_journal_entries_themes ON public.journal_entries USING GIN(themes);

-- Calendar event indexes
CREATE INDEX idx_calendar_events_user_id ON public.calendar_events(user_id);
CREATE INDEX idx_calendar_events_start_time ON public.calendar_events(start_time);
CREATE INDEX idx_calendar_events_end_time ON public.calendar_events(end_time);
CREATE INDEX idx_calendar_events_type ON public.calendar_events(type);
CREATE INDEX idx_calendar_events_status ON public.calendar_events(status);

-- Email indexes
CREATE INDEX idx_email_accounts_user_id ON public.email_accounts(user_id);
CREATE INDEX idx_email_messages_account_id ON public.email_messages(account_id);
CREATE INDEX idx_email_messages_date ON public.email_messages(date DESC);
CREATE INDEX idx_email_messages_read ON public.email_messages(read) WHERE read = false;
CREATE INDEX idx_email_messages_starred ON public.email_messages(starred) WHERE starred = true;

-- Integration indexes
CREATE INDEX idx_service_connections_user_id ON public.service_connections(user_id);
CREATE INDEX idx_service_connections_type ON public.service_connections(service_type);
CREATE INDEX idx_service_connections_active ON public.service_connections(is_active) WHERE is_active = true;

-- Analytics indexes
CREATE INDEX idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX idx_user_analytics_user_date ON public.user_analytics(user_id, date DESC);

-- System indexes
CREATE INDEX idx_oauth_states_token ON public.oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires ON public.oauth_states(expires_at) WHERE expires_at < CURRENT_TIMESTAMP;

-- =====================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================================

-- Function to update updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtasks_updated_at
    BEFORE UPDATE ON public.subtasks
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
    BEFORE UPDATE ON public.journal_entries
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update task completion timestamp
CREATE OR REPLACE FUNCTION public.update_task_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.completed = true AND OLD.completed = false THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    ELSIF NEW.completed = false THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_task_completion_timestamp
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.update_task_completion();

-- Trigger to update time block duration
CREATE OR REPLACE FUNCTION public.update_time_block_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.end_time IS NOT NULL THEN
        NEW.duration = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_time_block_duration_calculation
    BEFORE INSERT OR UPDATE ON public.time_blocks
    FOR EACH ROW EXECUTE FUNCTION public.update_time_block_duration();

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

-- Enable RLS on all user-specific tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_dashboard_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subtasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mood_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- User profiles RLS policies
CREATE POLICY "Users can view own profile" ON public.user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
    FOR UPDATE USING (auth.uid() = id);

-- Tasks RLS policies
CREATE POLICY "Users can view own tasks" ON public.tasks
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tasks" ON public.tasks
    FOR ALL USING (user_id = auth.uid());

-- Journal entries RLS policies
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own journal entries" ON public.journal_entries
    FOR ALL USING (user_id = auth.uid());

-- Calendar events RLS policies
CREATE POLICY "Users can view own calendar events" ON public.calendar_events
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own calendar events" ON public.calendar_events
    FOR ALL USING (user_id = auth.uid());

-- Email accounts RLS policies
CREATE POLICY "Users can view own email accounts" ON public.email_accounts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own email accounts" ON public.email_accounts
    FOR ALL USING (user_id = auth.uid());

-- Service connections RLS policies
CREATE POLICY "Users can view own service connections" ON public.service_connections
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own service connections" ON public.service_connections
    FOR ALL USING (user_id = auth.uid());

-- Public journal templates policy
CREATE POLICY "Public templates are visible to all authenticated users" ON public.journal_templates
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can manage own templates" ON public.journal_templates
    FOR ALL USING (user_id = auth.uid() OR user_id IS NULL);

-- =====================================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================================

-- User dashboard summary view
CREATE VIEW public.user_dashboard_summary AS
SELECT
    u.id as user_id,
    u.name,
    u.email,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false) as active_tasks,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = true AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days') as completed_this_week,
    COUNT(DISTINCT je.id) FILTER (WHERE je.date >= CURRENT_DATE - INTERVAL '7 days') as journal_entries_this_week,
    COUNT(DISTINCT ce.id) FILTER (WHERE ce.start_time >= CURRENT_DATE AND ce.start_time < CURRENT_DATE + INTERVAL '1 day') as events_today,
    AVG(mt.mood) as avg_mood_this_week,
    AVG(mt.energy) as avg_energy_this_week
FROM public.user_profiles u
LEFT JOIN public.tasks t ON u.id = t.user_id
LEFT JOIN public.journal_entries je ON u.id = je.user_id
LEFT JOIN public.calendar_events ce ON u.id = ce.user_id
LEFT JOIN public.mood_tracking mt ON u.id = mt.user_id AND mt.date >= CURRENT_DATE - INTERVAL '7 days'
WHERE u.is_active = true
GROUP BY u.id, u.name, u.email;

-- Active tasks with subtasks view
CREATE VIEW public.active_tasks_with_subtasks AS
SELECT
    t.*,
    COUNT(st.id) as subtask_count,
    COUNT(st.id) FILTER (WHERE st.completed = true) as completed_subtasks,
    (COUNT(st.id) > 0 AND COUNT(st.id) = COUNT(st.id) FILTER (WHERE st.completed = true)) as all_subtasks_completed
FROM public.tasks t
LEFT JOIN public.subtasks st ON t.id = st.task_id
WHERE t.completed = false
GROUP BY t.id;

-- Today's calendar events view
CREATE VIEW public.today_events AS
SELECT
    ce.*,
    ARRAY_AGG(DISTINCT ea.email) as attendee_emails,
    COUNT(ea.id) as attendee_count
FROM public.calendar_events ce
LEFT JOIN public.event_attendees ea ON ce.id = ea.event_id
WHERE ce.start_time >= CURRENT_DATE
    AND ce.start_time < CURRENT_DATE + INTERVAL '1 day'
    AND ce.status != 'cancelled'
GROUP BY ce.id
ORDER BY ce.start_time;

-- User productivity analytics view
CREATE VIEW public.productivity_analytics AS
SELECT
    ua.user_id,
    ua.date,
    ua.tasks_completed,
    ua.journal_entries,
    ua.events_attended,
    ua.focus_time_minutes,
    ua.productivity_score,
    t.total_tasks_for_day,
    j.journal_streak_days
FROM public.user_analytics ua
LEFT JOIN (
    SELECT
        user_id,
        date,
        COUNT(*) as total_tasks_for_day
    FROM public.tasks
    WHERE date(created_at) = date
    GROUP BY user_id, date
) t ON ua.user_id = t.user_id AND ua.date = t.date
LEFT JOIN (
    SELECT
        user_id,
        COUNT(*) as journal_streak_days,
        MAX(date) as last_journal_date
    FROM public.journal_entries
    WHERE date >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY user_id
) j ON ua.user_id = j.user_id;

-- =====================================================================
-- STORED PROCEDURES & FUNCTIONS
-- =====================================================================

-- Function to get user's current mood and energy
CREATE OR REPLACE FUNCTION public.get_user_mood_energy(p_user_id UUID)
RETURNS TABLE (
    mood INTEGER,
    energy INTEGER,
    mood_trend VARCHAR(10),
    energy_trend VARCHAR(10)
) AS $$
DECLARE
    current_mood INTEGER;
    current_energy INTEGER;
    previous_mood INTEGER;
    previous_energy INTEGER;
BEGIN
    -- Get current mood and energy
    SELECT mood, energy INTO current_mood, current_energy
    FROM public.mood_tracking
    WHERE user_id = p_user_id AND date = CURRENT_DATE;

    -- Get previous day's mood and energy
    SELECT mood, energy INTO previous_mood, previous_energy
    FROM public.mood_tracking
    WHERE user_id = p_user_id AND date = CURRENT_DATE - INTERVAL '1 day';

    -- Calculate trends
    RETURN QUERY
    SELECT
        current_mood,
        current_energy,
        CASE
            WHEN current_mood > previous_mood THEN 'up'
            WHEN current_mood < previous_mood THEN 'down'
            ELSE 'stable'
        END as mood_trend,
        CASE
            WHEN current_energy > previous_energy THEN 'up'
            WHEN current_energy < previous_energy THEN 'down'
            ELSE 'stable'
        END as energy_trend;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get tasks due in time range
CREATE OR REPLACE FUNCTION public.get_tasks_due_in_range(
    p_user_id UUID,
    p_start_date DATE,
    p_end_date DATE
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(10),
    status VARCHAR(20),
    days_until_due INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.id,
        t.title,
        t.due_date,
        t.priority,
        t.status,
        EXTRACT(DAYS FROM (t.due_date::date - CURRENT_DATE))::INTEGER as days_until_due
    FROM public.tasks t
    WHERE t.user_id = p_user_id
        AND t.due_date::date >= p_start_date
        AND t.due_date::date <= p_end_date
        AND t.completed = false
    ORDER BY t.due_date, t.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update user analytics
CREATE OR REPLACE FUNCTION public.update_user_analytics(p_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
DECLARE
    tasks_completed INTEGER;
    tasks_created INTEGER;
    journal_entries INTEGER;
    events_attended INTEGER;
    focus_time_minutes INTEGER;
    avg_mood DECIMAL(3,1);
    avg_energy DECIMAL(3,1);
    productivity_score DECIMAL(5,2);
BEGIN
    -- Calculate metrics for the day
    SELECT COUNT(*) INTO tasks_completed
    FROM public.tasks
    WHERE user_id = p_user_id
        AND completed = true
        AND date(completed_at) = p_date;

    SELECT COUNT(*) INTO tasks_created
    FROM public.tasks
    WHERE user_id = p_user_id
        AND date(created_at) = p_date;

    SELECT COUNT(*) INTO journal_entries
    FROM public.journal_entries
    WHERE user_id = p_user_id
        AND date = p_date;

    SELECT COUNT(*) INTO events_attended
    FROM public.calendar_events
    WHERE user_id = p_user_id
        AND date(start_time) = p_date
        AND status = 'confirmed';

    SELECT COALESCE(SUM(duration), 0) INTO focus_time_minutes
    FROM public.time_blocks
    WHERE user_id = p_user_id
        AND date(start_time) = p_date;

    SELECT AVG(mood), AVG(energy) INTO avg_mood, avg_energy
    FROM public.mood_tracking
    WHERE user_id = p_user_id
        AND date = p_date;

    -- Calculate productivity score (simple formula based on completed tasks and focus time)
    productivity_score := (tasks_completed * 10 + focus_time_minutes / 60.0 * 5)::DECIMAL(5,2);

    -- Upsert analytics record
    INSERT INTO public.user_analytics (
        user_id, date, tasks_completed, tasks_created, journal_entries,
        events_attended, focus_time_minutes, productivity_score,
        mood_average, energy_average
    ) VALUES (
        p_user_id, p_date, tasks_completed, tasks_created, journal_entries,
        events_attended, focus_time_minutes, productivity_score,
        avg_mood, avg_energy
    )
    ON CONFLICT (user_id, date)
    DO UPDATE SET
        tasks_completed = EXCLUDED.tasks_completed,
        tasks_created = EXCLUDED.tasks_created,
        journal_entries = EXCLUDED.journal_entries,
        events_attended = EXCLUDED.events_attended,
        focus_time_minutes = EXCLUDED.focus_time_minutes,
        productivity_score = EXCLUDED.productivity_score,
        mood_average = EXCLUDED.mood_average,
        energy_average = EXCLUDED.energy_average,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION public.cleanup_expired_oauth_states()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.oauth_states
    WHERE expires_at < CURRENT_TIMESTAMP;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================================
-- INITIAL DATA SEEDING
-- =====================================================================

-- Insert default event types
INSERT INTO public.event_types (name, color, icon, default_duration, is_system) VALUES
('Meeting', '#3B82F6', '🤝', 60, true),
('Personal', '#10B981', '👤', 30, true),
('Work', '#8B5CF6', '💼', 45, true),
('Learning', '#F59E0B', '📚', 90, true),
('Health', '#EF4444', '💪', 60, true),
('Break', '#6B7280', '☕', 15, true),
('Focus Time', '#14B8A6', '🎯', 120, true);

-- Insert default journal templates
INSERT INTO public.journal_templates (name, icon, description, color, content, is_public) VALUES
('Daily Reflection', '🌅', 'Complete daily journaling template with mood tracking', '#3B82F6',
'## Morning Reflection

### Gratitude
- What am I grateful for today?

### Intention
- What is my main focus today?

## Evening Reflection

### Wins
- What went well today?

### Challenges
- What was difficult?

### Learning
- What did I learn?

### Tomorrow
- What am I looking forward to?', true),

('Productivity Check-in', '📊', 'Quick daily productivity assessment', '#8B5CF6',
'## Today''s Focus

### Top 3 Priorities
1.
2.
3.

### Energy & Mood
- Energy (1-10):
- Mood (1-10):

### Progress Check
- Completed tasks:
- Obstacles faced:

### Tomorrow''s Prep
- Key priorities:', true),

('Mindfulness Entry', '🧘', 'Mindfulness and meditation journal', '#10B981',
'## Mindfulness Practice

### Breathing
- Duration:
- Observations:

### Grounding
- 5 things I can see:
- 4 things I can touch:
- 3 things I can hear:
- 2 things I can smell:
- 1 thing I can taste:

### Thoughts
- What thoughts are present?
- What emotions am I feeling?

### Gratitude
- I am grateful for:', true);

-- =====================================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================================

-- Materialized view for fast dashboard loading (will need manual refresh)
CREATE MATERIALIZED VIEW public.user_dashboard_metrics AS
SELECT
    u.id as user_id,
    COUNT(DISTINCT t.id) FILTER (WHERE t.completed = false) as active_task_count,
    COUNT(DISTINCT t.id) FILTER (WHERE t.due_date::date = CURRENT_DATE AND t.completed = false) as tasks_due_today,
    COUNT(DISTINCT je.id) FILTER (WHERE je.date = CURRENT_DATE) as journal_today,
    COUNT(DISTINCT ce.id) FILTER (WHERE ce.start_time >= CURRENT_TIMESTAMP AND ce.start_time < CURRENT_TIMESTAMP + INTERVAL '24 hours') as events_today,
    COALESCE(AVG(mt.mood), 0) as recent_mood,
    COALESCE(SUM(tb.duration), 0) as focus_time_today
FROM public.user_profiles u
LEFT JOIN public.tasks t ON u.id = t.user_id AND t.completed = false
LEFT JOIN public.journal_entries je ON u.id = je.user_id AND je.date = CURRENT_DATE
LEFT JOIN public.calendar_events ce ON u.id = ce.user_id AND ce.status = 'confirmed'
LEFT JOIN public.mood_tracking mt ON u.id = mt.user_id AND mt.date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN public.time_blocks tb ON u.id = tb.user_id AND date(tb.start_time) = CURRENT_DATE
WHERE u.is_active = true
GROUP BY u.id;

-- Create unique index for materialized view
CREATE UNIQUE INDEX idx_user_dashboard_metrics_user_id ON public.user_dashboard_metrics(user_id);

-- =====================================================================
-- COMPLETION MESSAGE
-- =====================================================================

-- Schema creation complete
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Set up authentication policies
-- 3. Configure environment variables for OAuth providers
-- 4. Set up storage buckets for file uploads
-- 5. Configure realtime subscriptions
-- 6. Set up database functions and triggers as needed
-- 7. Test all RLS policies with different user roles
-- 8. Set up monitoring and logging

COMMENT ON DATABASE IS 'Productivity Hub - Complete Personal Assistant Database Schema';
COMMENT ON SCHEMA public IS 'Production schema for productivity application with comprehensive user data management';