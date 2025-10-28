-- Database Migration Scripts for OAuth Authentication System
-- Compatible with both SQLite (development) and PostgreSQL (production)

-- Create Database (SQLite specific)
-- CREATE TABLE IF NOT EXISTS migration_versions (
--     id INTEGER PRIMARY KEY AUTOINCREMENT,
--     version VARCHAR(50) NOT NULL UNIQUE,
--     description TEXT,
--     executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

-- PostgreSQL Version
-- CREATE TABLE IF NOT EXISTS migration_versions (
--     id SERIAL PRIMARY KEY,
--     version VARCHAR(50) NOT NULL UNIQUE,
--     description TEXT,
--     executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
-- );

-- Migration: 001_initial_schema
-- Description: Create initial OAuth authentication schema
-- Version: 1.0.0

-- Users table - Core user account information
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- UUID
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    phone_number TEXT,
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'en'
);

-- User preferences table - User-specific settings
CREATE TABLE user_preferences (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT NOT NULL,
    settings TEXT NOT NULL DEFAULT '{}', -- JSON
    notifications_enabled BOOLEAN DEFAULT TRUE,
    auto_sync_enabled BOOLEAN DEFAULT TRUE,
    sync_interval_minutes INTEGER DEFAULT 15,
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id)
);

-- User sessions table - Session management
CREATE TABLE user_sessions (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    refresh_token TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    device_info TEXT, -- JSON
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service configurations table - OAuth provider configurations
CREATE TABLE service_configs (
    id TEXT PRIMARY KEY, -- UUID
    service_name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    client_id TEXT NOT NULL,
    client_secret_encrypted TEXT NOT NULL,
    scopes TEXT NOT NULL, -- JSON array
    redirect_uri TEXT NOT NULL,
    auth_url TEXT NOT NULL,
    token_url TEXT NOT NULL,
    refresh_url TEXT,
    revoke_url TEXT,
    userinfo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    settings TEXT DEFAULT '{}', -- JSON for service-specific settings
    rate_limit_per_hour INTEGER DEFAULT 1000
);

-- User providers table - Links users to OAuth providers
CREATE TABLE user_providers (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL, -- 'google', 'motion'
    provider_id TEXT NOT NULL, -- Provider's unique user ID
    display_name TEXT,
    avatar_url TEXT,
    email TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'active', 'error', 'disabled'
    last_sync_at TIMESTAMP,
    sync_error TEXT,
    access_level TEXT DEFAULT 'read', -- 'read', 'write', 'admin'
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (provider) REFERENCES service_configs(service_name),
    UNIQUE(user_id, provider, provider_id)
);

-- OAuth tokens table - Stores encrypted OAuth tokens
CREATE TABLE oauth_tokens (
    id TEXT PRIMARY KEY, -- UUID
    user_provider_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    token_type TEXT DEFAULT 'Bearer',
    expires_at TIMESTAMP,
    scope TEXT, -- Space-separated string or JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0,
    metadata TEXT DEFAULT '{}', -- JSON for additional token data
    FOREIGN KEY (user_provider_id) REFERENCES user_providers(id) ON DELETE CASCADE,
    UNIQUE(user_provider_id)
);

-- Token refresh log table - Tracks token refresh history
CREATE TABLE token_refresh_log (
    id TEXT PRIMARY KEY, -- UUID
    token_id TEXT NOT NULL,
    old_access_token_encrypted TEXT,
    new_access_token_encrypted TEXT,
    refresh_token_encrypted TEXT,
    refresh_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_code TEXT,
    duration_ms INTEGER,
    ip_address TEXT,
    FOREIGN KEY (token_id) REFERENCES oauth_tokens(id) ON DELETE CASCADE
);

-- Authentication audit log table - Comprehensive audit trail
CREATE TABLE auth_audit_log (
    id TEXT PRIMARY KEY, -- UUID
    user_id TEXT,
    provider TEXT,
    action TEXT NOT NULL, -- 'login', 'logout', 'token_refresh', 'disconnect', 'connect'
    ip_address TEXT,
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    error_code TEXT,
    session_id TEXT,
    additional_data TEXT, -- JSON
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Sync logs table - Tracks synchronization activities
CREATE TABLE sync_logs (
    id TEXT PRIMARY KEY, -- UUID
    user_provider_id TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'full_sync', 'incremental_sync', 'single_item_sync'
    status TEXT NOT NULL, -- 'started', 'in_progress', 'completed', 'failed', 'cancelled'
    data_size INTEGER DEFAULT 0, -- bytes
    items_processed INTEGER DEFAULT 0,
    items_total INTEGER DEFAULT 0,
    duration_ms INTEGER,
    error_message TEXT,
    error_code TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    metadata TEXT DEFAULT '{}', -- JSON for sync-specific data
    FOREIGN KEY (user_provider_id) REFERENCES user_providers(id) ON DELETE CASCADE
);

-- Rate limiting table - API rate limit tracking
CREATE TABLE rate_limits (
    id TEXT PRIMARY KEY, -- UUID
    user_provider_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    window_start TIMESTAMP NOT NULL,
    request_count INTEGER DEFAULT 0,
    limit INTEGER NOT NULL,
    reset_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_provider_id) REFERENCES user_providers(id) ON DELETE CASCADE,
    UNIQUE(user_provider_id, endpoint, window_start)
);

-- Create indexes for performance

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_is_active ON users(is_active);

-- User sessions indexes
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- User providers indexes
CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX idx_user_providers_provider ON user_providers(provider);
CREATE INDEX idx_user_providers_is_active ON user_providers(is_active);
CREATE INDEX idx_user_providers_sync_status ON user_providers(sync_status);
CREATE INDEX idx_user_providers_last_sync ON user_providers(last_sync_at);

-- OAuth tokens indexes
CREATE INDEX idx_oauth_tokens_user_provider_id ON oauth_tokens(user_provider_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);
CREATE INDEX idx_oauth_tokens_last_used ON oauth_tokens(last_used);

-- Token refresh log indexes
CREATE INDEX idx_token_refresh_log_token_id ON token_refresh_log(token_id);
CREATE INDEX idx_token_refresh_log_created_at ON token_refresh_log(created_at);
CREATE INDEX idx_token_refresh_log_success ON token_refresh_log(success);

-- Auth audit log indexes
CREATE INDEX idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_log_timestamp ON auth_audit_log(timestamp);
CREATE INDEX idx_auth_audit_log_action ON auth_audit_log(action);
CREATE INDEX idx_auth_audit_log_provider ON auth_audit_log(provider);
CREATE INDEX idx_auth_audit_log_success ON auth_audit_log(success);

-- Sync logs indexes
CREATE INDEX idx_sync_logs_user_provider_id ON sync_logs(user_provider_id);
CREATE INDEX idx_sync_logs_timestamp ON sync_logs(timestamp);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_action_type ON sync_logs(action_type);

-- Rate limits indexes
CREATE INDEX idx_rate_limits_user_provider_id ON rate_limits(user_provider_id);
CREATE INDEX idx_rate_limits_window_start ON rate_limits(window_start);
CREATE INDEX idx_rate_limits_reset_at ON rate_limits(reset_at);

-- Create triggers for automatic timestamp updates (PostgreSQL)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_providers_updated_at BEFORE UPDATE ON user_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_oauth_tokens_updated_at BEFORE UPDATE ON oauth_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_configs_updated_at BEFORE UPDATE ON service_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service configurations
INSERT INTO service_configs (id, service_name, display_name, client_id, client_secret_encrypted, scopes, redirect_uri, auth_url, token_url, refresh_url, revoke_url, userinfo_url) VALUES
('google-config-001', 'google', 'Google', 'google-client-id-placeholder', 'encrypted-placeholder',
 '["https://www.googleapis.com/auth/gmail.readonly","https://www.googleapis.com/auth/calendar","https://www.googleapis.com/auth/contacts.readonly"]',
 'http://localhost:3000/auth/google/callback',
 'https://accounts.google.com/o/oauth2/v2/auth',
 'https://oauth2.googleapis.com/token',
 'https://oauth2.googleapis.com/token',
 'https://oauth2.googleapis.com/revoke',
 'https://www.googleapis.com/oauth2/v2/userinfo'
),
('motion-config-001', 'motion', 'Motion', 'motion-client-id-placeholder', 'encrypted-placeholder',
 '["tasks:read","tasks:write","calendar:read","calendar:write"]',
 'http://localhost:3000/auth/motion/callback',
 'https://api.usemotion.com/oauth/authorize',
 'https://api.usemotion.com/oauth/token',
 'https://api.usemotion.com/oauth/token',
 'https://api.usemotion.com/oauth/revoke',
 'https://api.usemotion.com/v1/users/me'
);

-- Create views for common queries

CREATE VIEW active_user_connections AS
SELECT
    u.id as user_id,
    u.email,
    up.provider,
    up.display_name as provider_display_name,
    up.sync_status,
    up.last_sync_at,
    ot.expires_at as token_expires_at,
    CASE
        WHEN ot.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 'expiring_soon'
        ELSE 'active'
    END as token_status
FROM users u
JOIN user_providers up ON u.id = up.user_id
JOIN oauth_tokens ot ON up.id = ot.user_provider_id
WHERE u.is_active = TRUE
  AND up.is_active = TRUE
  AND ot.is_active = TRUE;

CREATE VIEW recent_auth_activity AS
SELECT
    u.email,
    al.action,
    al.provider,
    al.success,
    al.timestamp,
    al.ip_address,
    al.user_agent
FROM auth_audit_log al
JOIN users u ON al.user_id = u.id
WHERE al.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
ORDER BY al.timestamp DESC;

CREATE VIEW sync_summary AS
SELECT
    up.provider,
    COUNT(*) as total_connections,
    COUNT(CASE WHEN up.sync_status = 'active' THEN 1 END) as active_syncs,
    COUNT(CASE WHEN up.sync_status = 'error' THEN 1 END) as error_syncs,
    MAX(up.last_sync_at) as last_sync_time,
    AVG(CASE WHEN sl.status = 'completed' THEN sl.duration_ms END) as avg_sync_duration_ms
FROM user_providers up
LEFT JOIN sync_logs sl ON up.id = sl.user_provider_id
    AND sl.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
WHERE up.is_active = TRUE
GROUP BY up.provider;