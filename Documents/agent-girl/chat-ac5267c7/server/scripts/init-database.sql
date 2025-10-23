-- Productivity Hub OAuth Database Schema
-- PostgreSQL Database Initialization Script

-- Create database if it doesn't exist
-- CREATE DATABASE IF NOT EXISTS productivity_hub;

-- Use the database
-- \c productivity_hub;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    google_id VARCHAR(100) UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create service connections table for storing OAuth tokens
CREATE TABLE IF NOT EXISTS service_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL, -- 'google' or 'motion'
    encrypted_tokens JSONB NOT NULL, -- Encrypted OAuth tokens
    scopes TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_type)
);

-- Create OAuth states table for CSRF protection
CREATE TABLE IF NOT EXISTS oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create user sessions table for session storage
CREATE TABLE IF NOT EXISTS user_sessions (
    sid VARCHAR(255) PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    request_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, service_type, endpoint, request_date)
);

-- Create sync logs table for debugging
CREATE TABLE IF NOT EXISTS sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL, -- 'success', 'error', 'pending'
    details JSONB,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_service_connections_user_id ON service_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_service_connections_service_type ON service_connections(service_type);
CREATE INDEX IF NOT EXISTS idx_service_connections_active ON service_connections(is_active);
CREATE INDEX IF NOT EXISTS idx_oauth_states_token ON oauth_states(state_token);
CREATE INDEX IF NOT EXISTS idx_oauth_states_expires ON oauth_states(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expire ON user_sessions(expire);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_service ON api_usage(user_id, service_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_date ON api_usage(request_date);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_service_type ON sync_logs(service_type);
CREATE INDEX IF NOT EXISTS idx_sync_logs_status ON sync_logs(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_connections_updated_at BEFORE UPDATE ON service_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create cleanup function for expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
    DELETE FROM user_sessions WHERE expire < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create cleanup function for old sync logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_sync_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM sync_logs WHERE created_at < CURRENT_TIMESTAMP - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Insert default service configurations (optional)
INSERT INTO service_connections (user_id, service_type, encrypted_tokens, scopes, is_active)
VALUES
    (uuid_generate_v4(), 'google', '{}', ARRAY['gmail.readonly', 'calendar.readonly', 'contacts.readonly'], false),
    (uuid_generate_v4(), 'motion', '{}', ARRAY['tasks.read', 'tasks.write'], false)
ON CONFLICT DO NOTHING;

-- Create view for active service connections
CREATE OR REPLACE VIEW active_service_connections AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    sc.service_type,
    sc.scopes,
    sc.last_used_at,
    sc.expires_at,
    sc.created_at
FROM users u
JOIN service_connections sc ON u.id = sc.user_id
WHERE sc.is_active = true;

-- Create view for API usage statistics
CREATE OR REPLACE VIEW api_usage_stats AS
SELECT
    u.id as user_id,
    u.email,
    sc.service_type,
    COALESCE(SUM(au.request_count), 0) as total_requests,
    COUNT(DISTINCT au.endpoint) as unique_endpoints,
    MAX(au.last_request_at) as last_request
FROM users u
LEFT JOIN service_connections sc ON u.id = sc.user_id
LEFT JOIN api_usage au ON u.id = au.user_id AND sc.service_type = au.service_type
WHERE sc.is_active = true
GROUP BY u.id, u.email, sc.service_type;

-- Grant permissions (adjust as needed for your database user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

-- Sample data for testing (remove in production)
INSERT INTO users (email, name)
VALUES
    ('test@example.com', 'Test User'),
    ('demo@example.com', 'Demo User')
ON CONFLICT (email) DO NOTHING;

COMMIT;

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Tables created: users, service_connections, oauth_states, user_sessions, api_usage, sync_logs';
    RAISE NOTICE 'Indexes created for optimal performance';
    RAISE NOTICE 'Triggers and views created for data integrity';
    RAISE NOTICE 'Sample test users inserted (remove in production)';
END $$;