-- Comprehensive OAuth Authentication System Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for storing user information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    google_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Service connections table for storing OAuth tokens and API keys
CREATE TABLE service_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('google', 'motion')),
    encrypted_tokens TEXT NOT NULL,
    scopes TEXT[],
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, service_type)
);

-- OAuth states table for CSRF protection
CREATE TABLE oauth_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    state_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('google', 'motion')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API usage tracking for monitoring and rate limiting
CREATE TABLE api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_type VARCHAR(50) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER DEFAULT 1,
    last_request_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    date_tracked DATE DEFAULT CURRENT_DATE,
    UNIQUE(user_id, service_type, endpoint, date_tracked)
);

-- Service health monitoring
CREATE TABLE service_health (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_type VARCHAR(50) NOT NULL UNIQUE,
    is_healthy BOOLEAN DEFAULT true,
    last_check_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_message TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    last_success_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_service_connections_user_id ON service_connections(user_id);
CREATE INDEX idx_service_connections_service_type ON service_connections(service_type);
CREATE INDEX idx_service_connections_active ON service_connections(is_active) WHERE is_active = true;
CREATE INDEX idx_oauth_states_state_token ON oauth_states(state_token);
CREATE INDEX idx_oauth_states_expires_at ON oauth_states(expires_at);
CREATE INDEX idx_api_usage_user_service ON api_usage(user_id, service_type);
CREATE INDEX idx_api_usage_date ON api_usage(date_tracked);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_connections_updated_at
    BEFORE UPDATE ON service_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired OAuth states
CREATE OR REPLACE FUNCTION cleanup_expired_oauth_states()
RETURNS void AS $$
BEGIN
    DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup of expired states (run this as a cron job)
-- DELETE FROM oauth_states WHERE expires_at < CURRENT_TIMESTAMP;

-- Sample data for testing (remove in production)
-- INSERT INTO users (email, name) VALUES ('test@example.com', 'Test User');
-- INSERT INTO service_health (service_type, is_healthy) VALUES
--     ('google', true),
--     ('motion', true);

-- Row Level Security (RLS) for additional security (optional)
-- ALTER TABLE service_connections ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own service connections
-- CREATE POLICY user_service_connections ON service_connections
--     FOR ALL TO authenticated_users
--     USING (user_id = current_setting('app.current_user_id')::uuid);

-- Views for common queries
CREATE VIEW active_service_connections AS
SELECT
    sc.id,
    sc.user_id,
    u.email,
    u.name,
    sc.service_type,
    sc.expires_at,
    sc.last_used_at,
    sc.created_at
FROM service_connections sc
JOIN users u ON sc.user_id = u.id
WHERE sc.is_active = true;

CREATE VIEW user_service_summary AS
SELECT
    u.id as user_id,
    u.email,
    u.name,
    COUNT(CASE WHEN sc.service_type = 'google' THEN 1 END) as google_connected,
    COUNT(CASE WHEN sc.service_type = 'motion' THEN 1 END) as motion_connected,
    MAX(sc.last_used_at) as last_service_activity
FROM users u
LEFT JOIN service_connections sc ON u.id = sc.user_id AND sc.is_active = true
GROUP BY u.id, u.email, u.name;

-- Stored procedure for secure token storage
CREATE OR REPLACE FUNCTION store_service_tokens(
    p_user_id UUID,
    p_service_type VARCHAR(50),
    p_encrypted_tokens TEXT,
    p_scopes TEXT[] DEFAULT NULL,
    p_expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    connection_id UUID;
BEGIN
    INSERT INTO service_connections (
        user_id,
        service_type,
        encrypted_tokens,
        scopes,
        expires_at,
        last_used_at
    ) VALUES (
        p_user_id,
        p_service_type,
        p_encrypted_tokens,
        p_scopes,
        p_expires_at,
        CURRENT_TIMESTAMP
    )
    ON CONFLICT (user_id, service_type)
    DO UPDATE SET
        encrypted_tokens = EXCLUDED.encrypted_tokens,
        scopes = EXCLUDED.scopes,
        expires_at = EXCLUDED.expires_at,
        last_used_at = CURRENT_TIMESTAMP,
        is_active = true
    RETURNING id INTO connection_id;

    RETURN connection_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Stored procedure for revoking service connections
CREATE OR REPLACE FUNCTION revoke_service_connection(
    p_user_id UUID,
    p_service_type VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE service_connections
    SET is_active = false
    WHERE user_id = p_user_id AND service_type = p_service_type;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;