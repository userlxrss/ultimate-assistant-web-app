# Database Performance Optimization Strategy

## Overview

This document outlines comprehensive performance optimization strategies for the OAuth authentication database, covering indexing, query optimization, connection management, and scaling considerations.

## Index Strategy

### Primary Indexes (Already Implemented)

```sql
-- Users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Session management
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- Provider connections
CREATE INDEX idx_user_providers_user_id ON user_providers(user_id);
CREATE INDEX idx_user_providers_provider ON user_providers(provider);
CREATE INDEX idx_user_providers_is_active ON user_providers(is_active);
CREATE INDEX idx_user_providers_sync_status ON user_providers(sync_status);
CREATE INDEX idx_user_providers_last_sync ON user_providers(last_sync_at);

-- Token management
CREATE INDEX idx_oauth_tokens_user_provider_id ON oauth_tokens(user_provider_id);
CREATE INDEX idx_oauth_tokens_expires_at ON oauth_tokens(expires_at);
CREATE INDEX idx_oauth_tokens_is_active ON oauth_tokens(is_active);
CREATE INDEX idx_oauth_tokens_last_used ON oauth_tokens(last_used);
```

### Additional Performance Indexes

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_user_providers_user_active ON user_providers(user_id, is_active);
CREATE INDEX idx_user_providers_provider_active ON user_providers(provider, is_active, sync_status);

-- Token refresh optimization
CREATE INDEX idx_oauth_tokens_expires_active ON oauth_tokens(expires_at, is_active)
WHERE is_active = TRUE;

-- Audit log optimization
CREATE INDEX idx_auth_audit_log_user_timestamp ON auth_audit_log(user_id, timestamp DESC);
CREATE INDEX idx_auth_audit_log_action_timestamp ON auth_audit_log(action, timestamp DESC);

-- Sync log optimization
CREATE INDEX idx_sync_logs_provider_status ON sync_logs(user_provider_id, status, timestamp DESC);
CREATE INDEX idx_sync_logs_recent ON sync_logs(timestamp DESC) WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days';

-- Rate limiting optimization
CREATE INDEX idx_rate_limits_endpoint_window ON rate_limits(endpoint, window_start);
CREATE INDEX idx_rate_limits_reset_time ON rate_limits(reset_at) WHERE reset_at > CURRENT_TIMESTAMP;

-- Token refresh log optimization
CREATE INDEX idx_token_refresh_log_recent ON token_refresh_log(created_at DESC)
WHERE created_at > CURRENT_TIMESTAMP - INTERVAL '30 days';
```

### Partitioning Strategy (PostgreSQL)

```sql
-- Partition audit log by month for better performance
CREATE TABLE auth_audit_log_partitioned (
    LIKE auth_audit_log INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE auth_audit_log_2024_01 PARTITION OF auth_audit_log_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE auth_audit_log_2024_02 PARTITION OF auth_audit_log_partitioned
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automate partition creation with a function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;
```

## Query Optimization

### Common Query Patterns with Optimizations

#### 1. User Authentication Queries

```sql
-- Original query (slow)
SELECT u.*, up.provider, up.sync_status
FROM users u
LEFT JOIN user_providers up ON u.id = up.user_id
WHERE u.email = $1;

-- Optimized query with proper indexing
SELECT u.*, up.provider, up.sync_status, up.id as provider_id
FROM users u
LEFT JOIN LATERAL (
    SELECT id, provider, sync_status, is_active
    FROM user_providers
    WHERE user_id = u.id AND is_active = TRUE
    ORDER BY last_sync_at DESC NULLS LAST
    LIMIT 1
) up ON true
WHERE u.email = $1 AND u.is_active = TRUE;

-- Indexes needed:
CREATE INDEX idx_users_email_active ON users(email, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_providers_user_active_sync ON user_providers(user_id, is_active, last_sync_at DESC)
WHERE is_active = TRUE;
```

#### 2. Token Expiration Monitoring

```sql
-- Find expiring tokens (next 24 hours)
SELECT up.user_id, up.provider, ot.expires_at, u.email
FROM oauth_tokens ot
JOIN user_providers up ON ot.user_provider_id = up.id
JOIN users u ON up.user_id = u.id
WHERE ot.expires_at BETWEEN CURRENT_TIMESTAMP AND CURRENT_TIMESTAMP + INTERVAL '24 hours'
  AND ot.is_active = TRUE
  AND up.is_active = TRUE
  AND u.is_active = TRUE;

-- Optimized version with index
CREATE INDEX idx_oauth_tokens_expiring_soon ON oauth_tokens(expires_at, is_active, user_provider_id)
WHERE is_active = TRUE AND expires_at > CURRENT_TIMESTAMP;
```

#### 3. Sync Performance Analytics

```sql
-- Average sync duration by provider (last 7 days)
SELECT
    up.provider,
    AVG(sl.duration_ms) as avg_duration,
    COUNT(*) as total_syncs,
    COUNT(CASE WHEN sl.status = 'completed' THEN 1 END) as successful_syncs
FROM user_providers up
JOIN sync_logs sl ON up.id = sl.user_provider_id
WHERE sl.timestamp > CURRENT_TIMESTAMP - INTERVAL '7 days'
  AND sl.status IN ('completed', 'failed')
GROUP BY up.provider;

-- Optimized with proper indexes
CREATE INDEX idx_sync_logs_provider_status_duration ON sync_logs(user_provider_id, status, duration_ms, timestamp)
WHERE timestamp > CURRENT_TIMESTAMP - INTERVAL '30 days';
```

## Connection Pooling Configuration

### PostgreSQL Connection Pool

```sql
-- PostgreSQL configuration parameters
-- In postgresql.conf

# Connection settings
max_connections = 200
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 4MB
maintenance_work_mem = 64MB

# Connection pooling
pgbouncer_listen_port = 6432
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 5
max_db_connections = 50
max_user_connections = 50
```

### Application Connection Pool Configuration

```javascript
// Example: Node.js with pg-pool
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
  connectionTimeoutMillis: 2000, // How long to wait when connecting
});

// Connection pool monitoring
pool.on('connect', (client) => {
  console.log('New connection established');
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});
```

## Caching Strategy

### Redis Caching Layer

```javascript
// Cache key patterns
const CACHE_KEYS = {
  USER_SESSION: (token) => `session:${token}`,
  OAUTH_TOKEN: (userId, provider) => `token:${userId}:${provider}`,
  USER_PREFERENCES: (userId) => `prefs:${userId}`,
  RATE_LIMIT: (userId, endpoint) => `rate:${userId}:${endpoint}`,
  SYNC_STATUS: (userId, provider) => `sync:${userId}:${provider}`
};

// Cache TTL settings
const CACHE_TTL = {
  USER_SESSION: 3600, // 1 hour
  OAUTH_TOKEN: 1800, // 30 minutes
  USER_PREFERENCES: 86400, // 24 hours
  RATE_LIMIT: 3600, // 1 hour
  SYNC_STATUS: 300 // 5 minutes
};
```

### Database Query Result Caching

```sql
-- Materialized view for active connections
CREATE MATERIALIZED VIEW active_connections AS
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

-- Refresh materialized view
CREATE OR REPLACE FUNCTION refresh_active_connections()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY active_connections;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 5 minutes
-- Using pg_cron extension
SELECT cron.schedule('refresh-active-connections', '*/5 * * * *', 'SELECT refresh_active_connections();');
```

## Performance Monitoring

### Database Performance Metrics

```sql
-- Query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Top slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage statistics
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Table size monitoring
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY size_bytes DESC;
```

### Application Performance Monitoring

```javascript
// Query timing middleware
const queryTiming = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;

    // Log slow queries (>100ms)
    if (duration > 100) {
      console.warn(`Slow query detected: ${req.method} ${req.path} - ${duration}ms`);
    }

    // Send to monitoring service
    monitoring.trackQuery({
      path: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode
    });
  });

  next();
};
```

## Scaling Strategy

### Read Replicas

```sql
-- Configure read replicas for scaling
-- Primary database handles writes
-- Read replicas handle authentication and read queries

-- Connection routing logic
const getReadPool = () => {
  return readReplicaPool; // Pool of read replicas
};

const getWritePool = () => {
  return primaryPool; // Primary database for writes
};
```

### Database Sharding (Future Consideration)

```sql
-- Shard by user_id for horizontal scaling
-- Shard 0: user_id hash 0-49
-- Shard 1: user_id hash 50-99

CREATE TABLE users_shard_0 (LIKE users INCLUDING ALL);
CREATE TABLE users_shard_1 (LIKE users INCLUDING ALL);

-- Route queries based on user_id hash
const getShard = (userId) => {
  const hash = crypto.createHash('md5').update(userId).digest('hex');
  const shardIndex = parseInt(hash.substr(0, 2), 16) % 2;
  return shardIndex === 0 ? 'users_shard_0' : 'users_shard_1';
};
```

## Optimization Checklist

### Daily Monitoring
- [ ] Check slow query log
- [ ] Monitor connection pool usage
- [ ] Review cache hit rates
- [ ] Check database size growth
- [ ] Monitor rate limit violations

### Weekly Maintenance
- [ ] Update table statistics (ANALYZE)
- [ ] Reindex fragmented indexes
- [ ] Clean up old audit logs
- [ ] Refresh materialized views
- [ ] Review performance trends

### Monthly Optimization
- [ ] Review and optimize indexes
- [ ] Update connection pool settings
- [ ] Optimize caching strategy
- [ ] Plan capacity upgrades
- [ ] Review backup performance

## Performance Benchmarks

### Expected Performance Metrics

| Operation | Target Response Time | Acceptable Range |
|-----------|---------------------|------------------|
| User Authentication | <50ms | <100ms |
| Token Refresh | <200ms | <500ms |
| Session Validation | <30ms | <50ms |
| Sync Status Check | <100ms | <200ms |
| Audit Log Query | <200ms | <500ms |

### Monitoring Alerts

```javascript
// Performance alert thresholds
const PERFORMANCE_THRESHOLDS = {
  SLOW_QUERY: 1000, // ms
  HIGH_CONNECTION_USAGE: 0.8, // 80% of pool
  LOW_CACHE_HIT_RATE: 0.7, // 70%
  HIGH_RATE_LIMIT_VIOLATIONS: 100, // per hour
  DATABASE_SIZE_WARNING: 0.8 // 80% of allocated storage
};
```

This comprehensive optimization strategy ensures the OAuth authentication database performs efficiently under load while maintaining security and reliability.