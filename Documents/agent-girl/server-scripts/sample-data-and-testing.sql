-- Sample Data and Testing Scripts for OAuth Authentication Database
-- This file contains test data and validation scripts for development and testing

-- Test Data Generation
-- ===================

-- Insert test users
INSERT INTO users (id, email, password_hash, email_verified, is_active, timezone, language) VALUES
('user-001', 'alice@example.com', '$2b$12$LQv3c1yqBwkvHiGJwdAZmeCBJhz8YUB6kKIUZELG4BbGZhzkq6cxS', TRUE, TRUE, 'America/New_York', 'en'),
('user-002', 'bob@example.com', '$2b$12$LQv3c1yqBwkvHiGJwdAZmeCBJhz8YUB6kKIUZELG4BbGZhzkq6cxS', TRUE, TRUE, 'Europe/London', 'en'),
('user-003', 'charlie@example.com', '$2b$12$LQv3c1yqBwkvHiGJwdAZmeCBJhz8YUB6kKIUZELG4BbGZhzkq6cxS', FALSE, TRUE, 'Asia/Tokyo', 'ja'),
('user-004', 'diana@example.com', '$2b$12$LQv3c1yqBwkvHiGJwdAZmeCBJhz8YUB6kKIUZELG4BbGZhzkq6cxS', TRUE, FALSE, 'America/Los_Angeles', 'en'); -- Inactive user

-- Insert user preferences
INSERT INTO user_preferences (id, user_id, settings, notifications_enabled, auto_sync_enabled, sync_interval_minutes, theme) VALUES
('pref-001', 'user-001', '{"email_notifications": true, "sync_calendar": true, "sync_contacts": false}', TRUE, TRUE, 15, 'light'),
('pref-002', 'user-002', '{"email_notifications": false, "sync_calendar": true, "sync_contacts": true}', FALSE, TRUE, 30, 'dark'),
('pref-003', 'user-003', '{"email_notifications": true, "sync_calendar": false, "sync_contacts": true}', TRUE, FALSE, 60, 'auto'),
('pref-004', 'user-004', '{"email_notifications": true, "sync_calendar": true, "sync_contacts": true}', TRUE, TRUE, 15, 'light');

-- Insert active user sessions
INSERT INTO user_sessions (id, user_id, session_token, ip_address, user_agent, expires_at, is_active, device_info) VALUES
('session-001', 'user-001', 'sess_token_abc123', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', CURRENT_TIMESTAMP + INTERVAL '1 hour', TRUE, '{"device": "MacBook Pro", "browser": "Chrome"}'),
('session-002', 'user-002', 'sess_token_def456', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_TIMESTAMP + INTERVAL '2 hours', TRUE, '{"device": "Windows PC", "browser": "Firefox"}'),
('session-003', 'user-001', 'sess_token_ghi789', '192.168.1.100', 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)', CURRENT_TIMESTAMP - INTERVAL '30 minutes', FALSE, '{"device": "iPhone", "browser": "Safari"}'),
('session-004', 'user-003', 'sess_token_jkl012', '172.16.0.10', 'Mozilla/5.0 (Android 11; Mobile)', CURRENT_TIMESTAMP + INTERVAL '45 minutes', TRUE, '{"device": "Android Phone", "browser": "Chrome"}');

-- Insert user provider connections
INSERT INTO user_providers (id, user_id, provider, provider_id, display_name, avatar_url, email, is_active, sync_status, last_sync_at, access_level) VALUES
('up-001', 'user-001', 'google', 'google-12345', 'Alice Johnson', 'https://lh3.googleusercontent.com/photo.jpg', 'alice.johnson@gmail.com', TRUE, 'active', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'write'),
('up-002', 'user-001', 'motion', 'motion-abc123', 'Alice Johnson', null, 'alice@example.com', TRUE, 'active', CURRENT_TIMESTAMP - INTERVAL '1 hour', 'write'),
('up-003', 'user-002', 'google', 'google-67890', 'Bob Smith', 'https://lh3.googleusercontent.com/photo.jpg', 'bob.smith@gmail.com', TRUE, 'error', CURRENT_TIMESTAMP - INTERVAL '2 hours', 'read'),
('up-004', 'user-002', 'motion', 'motion-def456', 'Bob Smith', null, 'bob@example.com', FALSE, 'disabled', CURRENT_TIMESTAMP - INTERVAL '1 day', 'read'),
('up-005', 'user-003', 'google', 'google-11111', 'Charlie Tanaka', 'https://lh3.googleusercontent.com/photo.jpg', 'charlie.tanaka@gmail.com', TRUE, 'pending', null, 'read');

-- Insert OAuth tokens (using placeholder encryption for testing)
INSERT INTO oauth_tokens (id, user_provider_id, access_token_encrypted, refresh_token_encrypted, token_type, expires_at, scope, is_active, last_used, usage_count) VALUES
('token-001', 'up-001', 'enc_access_google_12345', 'enc_refresh_google_12345', 'Bearer', CURRENT_TIMESTAMP + INTERVAL '1 hour', 'gmail calendar contacts', TRUE, CURRENT_TIMESTAMP - INTERVAL '30 minutes', 25),
('token-002', 'up-002', 'enc_access_motion_abc123', 'enc_refresh_motion_abc123', 'Bearer', CURRENT_TIMESTAMP + INTERVAL '2 hours', 'tasks calendar', TRUE, CURRENT_TIMESTAMP - INTERVAL '1 hour', 15),
('token-003', 'up-003', 'enc_access_google_67890', 'enc_refresh_google_67890', 'Bearer', CURRENT_TIMESTAMP - INTERVAL '30 minutes', 'gmail calendar', FALSE, CURRENT_TIMESTAMP - INTERVAL '2 hours', 50),
('token-004', 'up-005', 'enc_access_google_11111', null, 'Bearer', CURRENT_TIMESTAMP + INTERVAL '3 hours', 'gmail calendar contacts', TRUE, null, 0);

-- Insert token refresh log entries
INSERT INTO token_refresh_log (id, token_id, old_access_token_encrypted, new_access_token_encrypted, refresh_token_encrypted, refresh_used, success, error_message, duration_ms, ip_address) VALUES
('refresh-001', 'token-001', 'old_token_enc_001', 'new_token_enc_001', 'refresh_token_001', TRUE, TRUE, null, 150, '192.168.1.100'),
('refresh-002', 'token-001', 'old_token_enc_002', 'new_token_enc_002', 'refresh_token_002', TRUE, TRUE, null, 200, '192.168.1.100'),
('refresh-003', 'token-003', 'old_token_enc_003', null, 'refresh_token_003', TRUE, FALSE, 'Invalid refresh token', 100, '10.0.0.50');

-- Insert authentication audit log entries
INSERT INTO auth_audit_log (id, user_id, provider, action, ip_address, user_agent, timestamp, success, error_message, session_id, additional_data) VALUES
('audit-001', 'user-001', 'google', 'login', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', CURRENT_TIMESTAMP - INTERVAL '2 hours', TRUE, null, 'session-001', '{"auth_method": "oauth2"}'),
('audit-002', 'user-001', 'motion', 'login', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', CURRENT_TIMESTAMP - INTERVAL '1 hour', TRUE, null, 'session-001', '{"auth_method": "api_key"}'),
('audit-003', 'user-002', 'google', 'login', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_TIMESTAMP - INTERVAL '3 hours', TRUE, null, 'session-002', '{"auth_method": "oauth2"}'),
('audit-004', 'user-002', 'google', 'token_refresh', '10.0.0.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', CURRENT_TIMESTAMP - INTERVAL '2 hours', FALSE, 'Token refresh failed', 'session-002', '{"error_code": "invalid_grant"}'),
('audit-005', 'user-003', 'google', 'connect', '172.16.0.10', 'Mozilla/5.0 (Android 11; Mobile)', CURRENT_TIMESTAMP - INTERVAL '30 minutes', TRUE, null, 'session-004', '{"auth_method": "oauth2"}'),
('audit-006', null, 'google', 'login_failed', '203.0.113.1', 'curl/7.68.0', CURRENT_TIMESTAMP - INTERVAL '15 minutes', FALSE, 'Invalid credentials', null, '{"attempted_email": "fake@example.com"}');

-- Insert sync log entries
INSERT INTO sync_logs (id, user_provider_id, action_type, status, data_size, items_processed, items_total, duration_ms, timestamp, started_at, completed_at, metadata) VALUES
('sync-001', 'up-001', 'full_sync', 'completed', 1024000, 150, 150, 5000, CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '30 minutes', CURRENT_TIMESTAMP - INTERVAL '25 minutes', '{"endpoint": "/gmail/messages", "sync_type": "initial"}'),
('sync-002', 'up-002', 'incremental_sync', 'completed', 51200, 5, 5, 800, CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '1 hour', CURRENT_TIMESTAMP - INTERVAL '59 minutes', '{"endpoint": "/motion/tasks", "sync_type": "incremental"}'),
('sync-003', 'up-003', 'full_sync', 'failed', 0, 0, 0, 200, CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', CURRENT_TIMESTAMP - INTERVAL '2 hours', '{"endpoint": "/gmail/contacts", "error": "API rate limit exceeded"}'),
('sync-004', 'up-001', 'incremental_sync', 'in_progress', 0, 0, 10, null, CURRENT_TIMESTAMP - INTERVAL '5 minutes', CURRENT_TIMESTAMP - INTERVAL '5 minutes', null, '{"endpoint": "/calendar/events", "sync_type": "incremental"}');

-- Insert rate limiting entries
INSERT INTO rate_limits (id, user_provider_id, endpoint, window_start, request_count, limit, reset_at) VALUES
('rate-001', 'up-001', '/gmail/v1/users/me/messages', CURRENT_TIMESTAMP - INTERVAL '10 minutes', 850, 1000, CURRENT_TIMESTAMP + INTERVAL '50 minutes'),
('rate-002', 'up-002', '/motion/v1/tasks', CURRENT_TIMESTAMP - INTERVAL '5 minutes', 450, 1000, CURRENT_TIMESTAMP + INTERVAL '55 minutes'),
('rate-003', 'up-003', '/gmail/v1/users/me/contacts', CURRENT_TIMESTAMP - INTERVAL '1 minute', 1000, 1000, CURRENT_TIMESTAMP + INTERVAL '59 minutes');

-- Test Queries and Validation
-- ===========================

-- Test Query 1: Find all active users with their provider connections
SELECT
    u.email,
    u.is_active as user_active,
    up.provider,
    up.display_name as provider_name,
    up.sync_status,
    up.last_sync_at,
    CASE
        WHEN ot.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 'expiring_soon'
        ELSE 'active'
    END as token_status
FROM users u
LEFT JOIN user_providers up ON u.id = up.user_id AND up.is_active = TRUE
LEFT JOIN oauth_tokens ot ON up.id = ot.user_provider_id AND ot.is_active = TRUE
WHERE u.is_active = TRUE
ORDER BY u.email, up.provider;

-- Test Query 2: Find expired or expiring tokens
SELECT
    u.email,
    up.provider,
    ot.expires_at,
    CASE
        WHEN ot.expires_at < CURRENT_TIMESTAMP THEN 'expired'
        WHEN ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 'expiring_soon'
        WHEN ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '24 hours' THEN 'expiring_today'
        ELSE 'active'
    END as urgency,
    up.last_sync_at
FROM users u
JOIN user_providers up ON u.id = up.user_id AND up.is_active = TRUE
JOIN oauth_tokens ot ON up.id = ot.user_provider_id AND ot.is_active = TRUE
WHERE ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '24 hours'
ORDER BY ot.expires_at;

-- Test Query 3: Sync performance analytics
SELECT
    up.provider,
    COUNT(*) as total_syncs,
    COUNT(CASE WHEN sl.status = 'completed' THEN 1 END) as successful_syncs,
    COUNT(CASE WHEN sl.status = 'failed' THEN 1 END) as failed_syncs,
    AVG(CASE WHEN sl.status = 'completed' THEN sl.duration_ms END) as avg_duration_ms,
    MAX(CASE WHEN sl.status = 'completed' THEN sl.duration_ms END) as max_duration_ms,
    SUM(CASE WHEN sl.status = 'completed' THEN sl.items_processed END) as total_items_synced
FROM user_providers up
JOIN sync_logs sl ON up.id = sl.user_provider_id
WHERE sl.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
GROUP BY up.provider;

-- Test Query 4: User activity summary
SELECT
    u.email,
    COUNT(DISTINCT us.id) as active_sessions,
    COUNT(DISTINCT up.id) as connected_providers,
    COUNT(DISTINCT CASE WHEN up.sync_status = 'active' THEN up.id END) as active_syncs,
    COUNT(DISTINCT CASE WHEN up.sync_status = 'error' THEN up.id END) as error_syncs,
    MAX(al.timestamp) as last_activity,
    COUNT(DISTINCT CASE WHEN al.success = FALSE THEN al.id END) as failed_attempts
FROM users u
LEFT JOIN user_sessions us ON u.id = us.user_id AND us.is_active = TRUE
LEFT JOIN user_providers up ON u.id = up.user_id AND up.is_active = TRUE
LEFT JOIN auth_audit_log al ON u.id = al.user_id AND al.timestamp > CURRENT_TIMESTAMP - INTERVAL '24 hours'
WHERE u.is_active = TRUE
GROUP BY u.id, u.email
ORDER BY last_activity DESC NULLS LAST;

-- Test Query 5: Rate limiting status
SELECT
    u.email,
    up.provider,
    rl.endpoint,
    rl.request_count,
    rl.limit,
    ROUND((rl.request_count::float / rl.limit::float) * 100, 2) as usage_percentage,
    rl.reset_at - CURRENT_TIMESTAMP as time_until_reset,
    CASE
        WHEN rl.request_count >= rl.limit THEN 'blocked'
        WHEN rl.request_count >= (rl.limit * 0.8) THEN 'warning'
        ELSE 'ok'
    END as status
FROM users u
JOIN user_providers up ON u.id = up.user_id
JOIN rate_limits rl ON up.id = rl.user_provider_id
WHERE u.is_active = TRUE
  AND rl.reset_at > CURRENT_TIMESTAMP
ORDER BY usage_percentage DESC;

-- Test Stored Procedures
-- =====================

-- Procedure to get user authentication status
CREATE OR REPLACE FUNCTION get_user_auth_status(p_user_email TEXT)
RETURNS TABLE(
    user_email TEXT,
    provider TEXT,
    connection_status TEXT,
    sync_status TEXT,
    token_status TEXT,
    last_sync TIMESTAMP,
    sessions_active INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.email,
        up.provider,
        CASE WHEN up.is_active THEN 'connected' ELSE 'disconnected' END,
        up.sync_status,
        CASE
            WHEN ot.expires_at < CURRENT_TIMESTAMP THEN 'expired'
            WHEN ot.expires_at < CURRENT_TIMESTAMP + INTERVAL '1 hour' THEN 'expiring_soon'
            ELSE 'active'
        END,
        up.last_sync_at,
        (SELECT COUNT(*) FROM user_sessions us WHERE us.user_id = u.id AND us.is_active = TRUE)
    FROM users u
    LEFT JOIN user_providers up ON u.id = up.user_id
    LEFT JOIN oauth_tokens ot ON up.id = ot.user_provider_id AND ot.is_active = TRUE
    WHERE u.email = p_user_email AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM get_user_auth_status('alice@example.com');

-- Procedure to mark expiring tokens
CREATE OR REPLACE FUNCTION find_expiring_tokens(p_hours_ahead INTEGER DEFAULT 24)
RETURNS TABLE(
    user_email TEXT,
    provider TEXT,
    expires_at TIMESTAMP,
    hours_until_expiry NUMERIC,
    last_used TIMESTAMP,
    usage_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.email,
        up.provider,
        ot.expires_at,
        EXTRACT(EPOCH FROM (ot.expires_at - CURRENT_TIMESTAMP)) / 3600 as hours_until_expiry,
        ot.last_used,
        ot.usage_count
    FROM users u
    JOIN user_providers up ON u.id = up.user_id AND up.is_active = TRUE
    JOIN oauth_tokens ot ON up.id = ot.user_provider_id AND ot.is_active = TRUE
    WHERE ot.expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '1 hour' * p_hours_ahead
    ORDER BY ot.expires_at;
END;
$$ LANGUAGE plpgsql;

-- Test the function
SELECT * FROM find_expiring_tokens(24);

-- Performance Testing
-- ==================

-- Generate test data for performance testing
CREATE OR REPLACE FUNCTION generate_test_data(p_num_users INTEGER DEFAULT 1000)
RETURNS void AS $$
DECLARE
    i INTEGER;
    user_id TEXT;
    email TEXT;
BEGIN
    FOR i IN 1..p_num_users LOOP
        user_id := 'test-user-' || LPAD(i::TEXT, 6, '0');
        email := 'user' || i || '@test.example.com';

        INSERT INTO users (id, email, password_hash, email_verified, is_active)
        VALUES (user_id, email, '$2b$12$LQv3c1yqBwkvHiGJwdAZmeCBJhz8YUB6kKIUZELG4BbGZhzkq6cxS', TRUE, TRUE);

        -- Insert preferences
        INSERT INTO user_preferences (id, user_id)
        VALUES ('pref-test-' || user_id, user_id);

        -- Randomly add Google connections for 70% of users
        IF RANDOM() < 0.7 THEN
            INSERT INTO user_providers (id, user_id, provider, provider_id, display_name, is_active, sync_status)
            VALUES ('up-google-' || user_id, user_id, 'google', 'google-test-' || user_id, 'Test User ' || i, TRUE, 'active');

            INSERT INTO oauth_tokens (id, user_provider_id, access_token_encrypted, expires_at, is_active)
            VALUES ('token-google-' || user_id, 'up-google-' || user_id, 'test_token_' || user_id, CURRENT_TIMESTAMP + INTERVAL '1 hour', TRUE);
        END IF;

        -- Randomly add Motion connections for 30% of users
        IF RANDOM() < 0.3 THEN
            INSERT INTO user_providers (id, user_id, provider, provider_id, display_name, is_active, sync_status)
            VALUES ('up-motion-' || user_id, user_id, 'motion', 'motion-test-' || user_id, 'Test User ' || i, TRUE, 'active');

            INSERT INTO oauth_tokens (id, user_provider_id, access_token_encrypted, expires_at, is_active)
            VALUES ('token-motion-' || user_id, 'up-motion-' || user_id, 'test_token_' || user_id, CURRENT_TIMESTAMP + INTERVAL '2 hours', TRUE);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Data Integrity Checks
-- ====================

-- Check for orphaned records
SELECT 'user_providers without users' as check_name, COUNT(*) as count
FROM user_providers up
LEFT JOIN users u ON up.user_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'oauth_tokens without user_providers' as check_name, COUNT(*) as count
FROM oauth_tokens ot
LEFT JOIN user_providers up ON ot.user_provider_id = up.id
WHERE up.id IS NULL

UNION ALL

SELECT 'sync_logs without user_providers' as check_name, COUNT(*) as count
FROM sync_logs sl
LEFT JOIN user_providers up ON sl.user_provider_id = up.id
WHERE up.id IS NULL;

-- Check for data consistency
SELECT
    'Tokens expiring in the past' as issue,
    COUNT(*) as count
FROM oauth_tokens
WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE

UNION ALL

SELECT
    'Active sessions past expiry' as issue,
    COUNT(*) as count
FROM user_sessions
WHERE expires_at < CURRENT_TIMESTAMP AND is_active = TRUE

UNION ALL

SELECT
    'Users without preferences' as issue,
    COUNT(*) as count
FROM users u
LEFT JOIN user_preferences up ON u.id = up.user_id
WHERE up.id IS NULL AND u.is_active = TRUE;

-- Cleanup Test Data
-- ================

-- Function to clean up test data
CREATE OR REPLACE FUNCTION cleanup_test_data()
RETURNS void AS $$
BEGIN
    DELETE FROM auth_audit_log WHERE user_id LIKE 'test-user-%';
    DELETE FROM rate_limits WHERE user_provider_id IN (
        SELECT id FROM user_providers WHERE user_id LIKE 'test-user-%'
    );
    DELETE FROM sync_logs WHERE user_provider_id IN (
        SELECT id FROM user_providers WHERE user_id LIKE 'test-user-%'
    );
    DELETE FROM token_refresh_log WHERE token_id IN (
        SELECT id FROM oauth_tokens WHERE user_provider_id IN (
            SELECT id FROM user_providers WHERE user_id LIKE 'test-user-%'
        )
    );
    DELETE FROM oauth_tokens WHERE user_provider_id IN (
        SELECT id FROM user_providers WHERE user_id LIKE 'test-user-%'
    );
    DELETE FROM user_providers WHERE user_id LIKE 'test-user-%';
    DELETE FROM user_sessions WHERE user_id LIKE 'test-user-%';
    DELETE FROM user_preferences WHERE user_id LIKE 'test-user-%';
    DELETE FROM users WHERE id LIKE 'test-user-%';
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- SELECT generate_test_data(1000); -- Generate 1000 test users
-- Run performance tests...
-- SELECT cleanup_test_data(); -- Clean up test data

-- Test Results Validation
-- ======================

-- Expected test results validation
DO $$
DECLARE
    total_users INTEGER;
    google_connections INTEGER;
    motion_connections INTEGER;
BEGIN
    -- Check expected test data counts
    SELECT COUNT(*) INTO total_users FROM users WHERE email LIKE '%@example.com';
    SELECT COUNT(*) INTO google_connections FROM user_providers WHERE provider = 'google' AND user_id IN ('user-001', 'user-002', 'user-003');
    SELECT COUNT(*) INTO motion_connections FROM user_providers WHERE provider = 'motion' AND user_id IN ('user-001', 'user-002');

    RAISE NOTICE 'Test Data Validation:';
    RAISE NOTICE 'Total test users: %', total_users;
    RAISE NOTICE 'Google connections: %', google_connections;
    RAISE NOTICE 'Motion connections: %', motion_connections;

    -- Validate expected counts
    IF total_users = 4 THEN
        RAISE NOTICE '✓ Test users count is correct';
    ELSE
        RAISE NOTICE '✗ Test users count is incorrect';
    END IF;

    IF google_connections = 3 THEN
        RAISE NOTICE '✓ Google connections count is correct';
    ELSE
        RAISE NOTICE '✗ Google connections count is incorrect';
    END IF;

    IF motion_connections = 2 THEN
        RAISE NOTICE '✓ Motion connections count is correct';
    ELSE
        RAISE NOTICE '✗ Motion connections count is incorrect';
    END IF;
END $$;