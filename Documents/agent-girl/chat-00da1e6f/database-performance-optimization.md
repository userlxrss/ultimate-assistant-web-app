# Database Performance Optimization Strategy

## Executive Summary

This document outlines comprehensive performance optimization strategies for the Assistant Hub database, focusing on query performance, indexing strategies, caching mechanisms, and scaling approaches.

## 1. Query Optimization

### 1.1 Common Query Patterns and Optimization

```sql
-- Dashboard Summary Query (Optimized)
EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
SELECT
    u.id as user_id,
    COUNT(DISTINCT CASE WHEN je.entry_date = CURRENT_DATE THEN je.id END) as today_journal_entries,
    COUNT(DISTINCT CASE WHEN t.status = 'pending' AND t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN t.id END) as upcoming_tasks,
    COUNT(DISTINCT CASE WHEN ce.start_time >= NOW() AND ce.start_time <= NOW() + INTERVAL '24 hours' THEN ce.id END) as today_events,
    COUNT(DISTINCT CASE WHEN et.is_read = false THEN et.id END) as unread_emails
FROM users u
LEFT JOIN LATERAL (
    SELECT id FROM journal_entries
    WHERE user_id = u.id AND entry_date = CURRENT_DATE
    LIMIT 1
) je ON true
LEFT JOIN LATERAL (
    SELECT id FROM tasks
    WHERE user_id = u.id AND status = 'pending'
    AND due_date <= CURRENT_DATE + INTERVAL '7 days'
    LIMIT 10
) t ON true
LEFT JOIN LATERAL (
    SELECT id FROM calendar_events
    WHERE user_id = u.id AND status = 'confirmed'
    AND start_time >= NOW() AND start_time <= NOW() + INTERVAL '24 hours'
    LIMIT 10
) ce ON true
LEFT JOIN LATERAL (
    SELECT id FROM email_threads
    WHERE user_id = u.id AND is_read = false
    LIMIT 10
) et ON true
WHERE u.id = $1
GROUP BY u.id;
```

### 1.2 Optimized Journal Analytics Query

```sql
-- Mood trend analysis with window functions (Optimized)
WITH daily_mood AS (
    SELECT
        user_id,
        entry_date,
        mood_score,
        COUNT(*) OVER (PARTITION BY user_id) as total_entries
    FROM journal_entries
    WHERE user_id = $1
    AND entry_date >= $2
    AND entry_date <= $3
    AND mood_score IS NOT NULL
),
mood_rolling AS (
    SELECT
        user_id,
        entry_date,
        mood_score,
        AVG(mood_score) OVER (
            PARTITION BY user_id
            ORDER BY entry_date
            RANGE BETWEEN INTERVAL '7 days' PRECEDING AND CURRENT ROW
        ) as rolling_avg_7d,
        AVG(mood_score) OVER (
            PARTITION BY user_id
            ORDER BY entry_date
            RANGE BETWEEN INTERVAL '30 days' PRECEDING AND CURRENT ROW
        ) as rolling_avg_30d
    FROM daily_mood
)
SELECT
    entry_date,
    mood_score,
    rolling_avg_7d,
    rolling_avg_30d,
    CASE
        WHEN mood_score > rolling_avg_7d THEN 'above_average'
        WHEN mood_score < rolling_avg_7d THEN 'below_average'
        ELSE 'average'
    END as mood_trend
FROM mood_rolling
ORDER BY entry_date DESC;
```

### 1.3 Task Performance Analytics

```sql
-- Task completion rate with CTE optimization
WITH task_periods AS (
    SELECT
        user_id,
        DATE_TRUNC('week', created_at) as week_start,
        DATE_TRUNC('week', created_at) + INTERVAL '6 days' as week_end,
        COUNT(*) as tasks_created,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as tasks_completed,
        AVG(CASE WHEN status = 'completed' AND actual_duration IS NOT NULL THEN actual_duration END) as avg_completion_time,
        COUNT(CASE WHEN priority <= 2 AND status = 'completed' THEN 1 END) as high_priority_completed
    FROM tasks
    WHERE user_id = $1
    AND created_at >= $2
    GROUP BY DATE_TRUNC('week', created_at)
),
completion_rates AS (
    SELECT
        week_start,
        week_end,
        tasks_created,
        tasks_completed,
        CASE
            WHEN tasks_created > 0
            THEN ROUND((tasks_completed::NUMERIC / tasks_created::NUMERIC) * 100, 2)
            ELSE 0
        END as completion_rate,
        avg_completion_time,
        high_priority_completed
    FROM task_periods
)
SELECT
    week_start,
    week_end,
    tasks_created,
    tasks_completed,
    completion_rate,
    avg_completion_time,
    high_priority_completed,
    LAG(completion_rate) OVER (ORDER BY week_start) as previous_week_rate,
    CASE
        WHEN LAG(completion_rate) OVER (ORDER BY week_start) IS NOT NULL
        THEN completion_rate - LAG(completion_rate) OVER (ORDER BY week_start)
        ELSE 0
    END as rate_change
FROM completion_rates
ORDER BY week_start DESC
LIMIT 12;
```

## 2. Advanced Indexing Strategies

### 2.1 Composite Indexes for Dashboard Performance

```sql
-- Multi-column indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_journal_entries_dashboard
ON journal_entries(user_id, entry_date DESC, mood_score)
WHERE mood_score IS NOT NULL;

CREATE INDEX CONCURRENTLY idx_tasks_dashboard
ON tasks(user_id, status, due_date, priority)
WHERE status != 'completed';

CREATE INDEX CONCURRENTLY idx_calendar_events_dashboard
ON calendar_events(user_id, start_time, status)
WHERE status = 'confirmed' AND start_time >= NOW();

CREATE INDEX CONCURRENTLY idx_email_threads_unread_count
ON email_threads(user_id, is_read, last_message_at DESC)
WHERE is_read = false;
```

### 2.2 Partial Indexes for Performance

```sql
-- Partial indexes for frequently accessed subsets
CREATE INDEX CONCURRENTLY idx_tasks_high_priority
ON tasks(user_id, due_date ASC, created_at DESC)
WHERE priority <= 2 AND status = 'pending';

CREATE INDEX CONCURRENTLY idx_journal_entries_favorites
ON journal_entries(user_id, entry_date DESC)
WHERE is_favorite = true;

CREATE INDEX CONCURRENTLY idx_contacts_favorites
ON contacts(user_id, display_name)
WHERE is_favorite = true;

CREATE INDEX CONCURRENTLY idx_events_today
ON calendar_events(user_id, start_time)
WHERE start_time >= CURRENT_DATE AND start_time < CURRENT_DATE + INTERVAL '1 day';
```

### 2.3 Functional Indexes for Search Optimization

```sql
-- Functional indexes for text search
CREATE INDEX CONCURRENTLY idx_journal_fulltext_search
ON journal_entries USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || content)
);

CREATE INDEX CONCURRENTLY idx_contacts_fulltext_search
ON contacts USING GIN(
    to_tsvector('english', COALESCE(first_name, '') || ' ' || COALESCE(last_name, '') || ' ' || COALESCE(company, '') || ' ' || COALESCE(notes, ''))
);

CREATE INDEX CONCURRENTLY idx_tasks_fulltext_search
ON tasks USING GIN(
    to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(description, ''))
);
```

## 3. Partitioning Strategy

### 3.1 Time-Based Partitioning for High-Volume Tables

```sql
-- Partition journal_entries by month
CREATE TABLE journal_entries_partitioned (
    LIKE journal_entries INCLUDING ALL
) PARTITION BY RANGE (entry_date);

-- Create monthly partitions automatically
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name TEXT, start_date DATE)
RETURNS void AS $$
DECLARE
    partition_name TEXT;
    end_date DATE;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + INTERVAL '1 month';

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I
                    FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I(user_id, entry_date DESC)',
                   'idx_' || partition_name || '_user_date', partition_name);
END;
$$ LANGUAGE plpgsql;

-- Automatically create partitions for the next 12 months
SELECT create_monthly_partition('journal_entries_partitioned',
                               date_trunc('month', CURRENT_DATE + n * INTERVAL '1 month'))
FROM generate_series(0, 11) n;
```

### 3.2 Hash Partitioning for User Data

```sql
-- Partition activity_logs by user hash for better distribution
CREATE TABLE activity_logs_partitioned (
    LIKE activity_logs INCLUDING ALL
) PARTITION BY HASH (user_id);

-- Create 8 partitions for even distribution
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 0..7 LOOP
        EXECUTE format('CREATE TABLE activity_logs_part_%s PARTITION OF activity_logs_partitioned
                        FOR VALUES WITH (MODULUS 8, REMAINDER %s)', i, i);
    END LOOP;
END $$;
```

## 4. Materialized Views and Caching

### 4.1 Dashboard Materialized Views with Refresh Strategy

```sql
-- Enhanced dashboard metrics materialized view
CREATE MATERIALIZED VIEW dashboard_metrics_enhanced AS
WITH daily_stats AS (
    -- Journal entries per day
    SELECT
        user_id,
        DATE(created_at) as stat_date,
        'journal_entries' as metric_type,
        COUNT(*) as metric_value,
        'count' as metric_unit
    FROM journal_entries
    WHERE created_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY user_id, DATE(created_at)

    UNION ALL

    -- Tasks completed per day
    SELECT
        user_id,
        DATE(completed_at) as stat_date,
        'tasks_completed' as metric_type,
        COUNT(*) as metric_value,
        'count' as metric_unit
    FROM tasks
    WHERE completed_at >= CURRENT_DATE - INTERVAL '90 days'
    AND status = 'completed'
    GROUP BY user_id, DATE(completed_at)

    UNION ALL

    -- Emails received per day
    SELECT
        user_id,
        DATE(received_at) as stat_date,
        'emails_received' as metric_type,
        COUNT(*) as metric_value,
        'count' as metric_unit
    FROM email_messages
    WHERE received_at >= CURRENT_DATE - INTERVAL '90 days'
    GROUP BY user_id, DATE(received_at)
),
weekly_aggregates AS (
    SELECT
        user_id,
        DATE_TRUNC('week', stat_date) as week_start,
        metric_type,
        SUM(metric_value) as weekly_total,
        AVG(metric_value) as daily_average,
        MAX(metric_value) as daily_maximum,
        MIN(metric_value) as daily_minimum
    FROM daily_stats
    GROUP BY user_id, DATE_TRUNC('week', stat_date), metric_type
)
SELECT
    user_id,
    week_start,
    metric_type,
    weekly_total,
    daily_average,
    daily_maximum,
    daily_minimum,
    LAG(weekly_total) OVER (PARTITION BY user_id, metric_type ORDER BY week_start) as previous_week_total,
    CASE
        WHEN LAG(weekly_total) OVER (PARTITION BY user_id, metric_type ORDER BY week_start) > 0
        THEN ROUND(((weekly_total - LAG(weekly_total) OVER (PARTITION BY user_id, metric_type ORDER BY week_start))::NUMERIC /
                   LAG(weekly_total) OVER (PARTITION BY user_id, metric_type ORDER BY week_start)) * 100, 2)
        ELSE 0
    END as week_over_week_change
FROM weekly_aggregates;

CREATE UNIQUE INDEX idx_dashboard_metrics_enhanced_unique
ON dashboard_metrics_enhanced(user_id, week_start, metric_type);
```

### 4.2 Intelligent Refresh Strategy

```sql
-- Function to refresh only changed data
CREATE OR REPLACE FUNCTION refresh_dashboard_metrics_incremental()
RETURNS void AS $$
DECLARE
    last_refresh TIMESTAMPTZ;
    refresh_needed BOOLEAN := false;
BEGIN
    -- Check if any source tables have been modified since last refresh
    SELECT COALESCE(MAX(created_at), '1970-01-01'::TIMESTAMPTZ)
    INTO last_refresh
    FROM activity_logs
    WHERE activity_type = 'materialized_view_refresh';

    -- Check for new journal entries
    IF EXISTS (SELECT 1 FROM journal_entries WHERE created_at > last_refresh) THEN
        refresh_needed := true;
    END IF;

    -- Check for completed tasks
    IF EXISTS (SELECT 1 FROM tasks WHERE completed_at > last_refresh) WHERE status = 'completed' THEN
        refresh_needed := true;
    END IF;

    -- Check for new emails
    IF EXISTS (SELECT 1 FROM email_messages WHERE received_at > last_refresh) THEN
        refresh_needed := true;
    END IF;

    -- Refresh if needed
    IF refresh_needed THEN
        REFRESH MATERIALIZED VIEW CONCURRENTLY dashboard_metrics_enhanced;

        -- Log the refresh
        INSERT INTO activity_logs (user_id, activity_type, entity_type, details)
        SELECT
            id,
            'materialized_view_refresh',
            'dashboard_metrics',
            json_build_object('view_name', 'dashboard_metrics_enhanced', 'trigger', 'incremental_check')
        FROM users;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every 15 minutes
CREATE OR REPLACE FUNCTION schedule_dashboard_refresh()
RETURNS void AS $$
BEGIN
    PERFORM refresh_dashboard_metrics_incremental();
END;
$$ LANGUAGE plpgsql;
```

## 5. Connection Pooling and Scaling

### 5.1 PgBouncer Configuration

```ini
# pgbouncer.ini configuration for Assistant Hub
[databases]
assistant_hub = host=localhost port=5432 dbname=assistant_hub

[pgbouncer]
listen_port = 6432
listen_addr = 127.0.0.1
auth_type = md5
auth_file = /etc/pgbouncer/userlist.txt
logfile = /var/log/pgbouncer/pgbouncer.log
pidfile = /var/run/pgbouncer/pgbouncer.pid
admin_users = postgres
stats_users = stats, postgres

# Connection pool settings
pool_mode = transaction
max_client_conn = 200
default_pool_size = 25
min_pool_size = 5
reserve_pool_size = 10
reserve_pool_timeout = 5
max_db_connections = 100
max_user_connections = 50

# Timeout settings
server_reset_query = DISCARD ALL
server_check_delay = 30
server_check_query = select 1
server_lifetime = 3600
server_idle_timeout = 600

# Advanced settings
ignore_startup_parameters = extra_float_digits
track_extra_parameters = application_name
```

### 5.2 Read Replica Configuration

```sql
-- Set up read replica for analytics queries
-- In primary database postgresql.conf:
wal_level = replica
max_wal_senders = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'cp %p /var/lib/postgresql/archive/%f'

-- Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE assistant_hub TO replicator;

-- In replica database recovery.conf:
standby_mode = 'on'
primary_conninfo = 'host=primary_ip port=5432 user=replicator password=secure_password'
restore_command = 'cp /var/lib/postgresql/archive/%f %p'
```

### 5.3 Application-Level Connection Management

```python
# Python example with connection pooling
import psycopg2
from psycopg2 import pool
from psycopg2.extras import execute_values
import json

class DatabaseManager:
    def __init__(self):
        # Connection pool for transactions
        self.transaction_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=5,
            maxconn=20,
            host="localhost",
            port=6432,  # PgBouncer
            database="assistant_hub",
            user="app_user",
            password="secure_password"
        )

        # Separate pool for read operations
        self.read_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=10,
            maxconn=30,
            host="replica_host",
            port=5432,
            database="assistant_hub",
            user="readonly_user",
            password="secure_password"
        )

    def execute_query(self, query, params=None, use_read_replica=False):
        """Execute query with automatic connection management"""
        pool = self.read_pool if use_read_replica else self.transaction_pool

        conn = pool.getconn()
        try:
            with conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor) as cur:
                cur.execute(query, params or ())
                if query.strip().upper().startswith(('SELECT', 'WITH')):
                    return cur.fetchall()
                else:
                    conn.commit()
                    return cur.rowcount
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            pool.putconn(conn)

    def batch_insert(self, table, data, conflict_action='NOTHING'):
        """Optimized batch insert with conflict handling"""
        if not data:
            return 0

        columns = data[0].keys()
        query = f"""
            INSERT INTO {table} ({', '.join(columns)})
            VALUES %s
            ON CONFLICT DO {conflict_action}
        """

        conn = self.transaction_pool.getconn()
        try:
            with conn.cursor() as cur:
                values = [tuple(row.values()) for row in data]
                execute_values(cur, query, values, page_size=1000)
                conn.commit()
                return len(data)
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            self.transaction_pool.putconn(conn)
```

## 6. Query Performance Monitoring

### 6.1 Slow Query Detection

```sql
-- Create function to log slow queries
CREATE OR REPLACE FUNCTION log_slow_queries()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.execution_time_ms > 1000 THEN  -- Log queries taking more than 1 second
        INSERT INTO query_performance_log (
            query_hash,
            query_text,
            execution_time_ms,
            rows_returned,
            user_id
        ) VALUES (
            md5(NEW.query),
            NEW.query,
            NEW.execution_time_ms,
            NEW.rows,
            NEW.user_id
        );

        -- Create alert if query is consistently slow
        INSERT INTO slow_query_alerts (query_hash, threshold_ms, alert_count)
        VALUES (
            md5(NEW.query),
            1000,
            1
        )
        ON CONFLICT (query_hash, threshold_ms)
        DO UPDATE SET
            alert_count = slow_query_alerts.alert_count + 1,
            last_alert_at = NOW();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- pg_stat_statements configuration
-- Add to postgresql.conf:
shared_preload_libraries = 'pg_stat_statements'
track_activity_query_size = 2048
pg_stat_statements.max = 10000
pg_stat_statements.track = all
pg_stat_statements.save = true

-- Enable extension
CREATE EXTENSION pg_stat_statements;

-- Query to find top slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 6.2 Performance Dashboard Queries

```sql
-- Database performance metrics
WITH performance_metrics AS (
    SELECT
        'connection_count' as metric,
        COUNT(*) as value,
        'current' as type
    FROM pg_stat_activity

    UNION ALL

    SELECT
        'transaction_rate' as metric,
        COUNT(*) as value,
        'per_minute' as type
    FROM pg_stat_activity
    WHERE state = 'active'
    AND query_start >= NOW() - INTERVAL '1 minute'

    UNION ALL

    SELECT
        'cache_hit_ratio' as metric,
        ROUND((sum(blks_hit)::NUMERIC / NULLIF(sum(blks_hit) + sum(blks_read), 0)) * 100, 2) as value,
        'percentage' as type
    FROM pg_stat_database
    WHERE datname = current_database()

    UNION ALL

    SELECT
        'lock_wait_time' as metric,
        EXTRACT(EPOCH FROM (MAX(wait_event_start_time) - MIN(wait_event_start_time))) as value,
        'seconds' as type
    FROM pg_stat_activity
    WHERE wait_event_type = 'Lock'
    AND wait_event_start_time IS NOT NULL
)
SELECT metric, value, type
FROM performance_metrics;

-- Table size analysis
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_tuples,
    n_dead_tup as dead_tuples,
    ROUND((n_dead_tup::NUMERIC / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_tuple_percentage
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 7. Automatic Maintenance

### 7.1 Scheduled Maintenance Tasks

```sql
-- Comprehensive maintenance function
CREATE OR REPLACE FUNCTION perform_maintenance()
RETURNS void AS $$
DECLARE
    maintenance_log JSONB;
BEGIN
    maintenance_log := jsonb_build_object('started_at', NOW());

    -- Update table statistics
    PERFORM ANALYZE journal_entries;
    PERFORM ANALYZE tasks;
    PERFORM ANALYZE calendar_events;
    PERFORM ANALYZE email_messages;
    PERFORM ANALYZE contacts;
    maintenance_log := maintenance_log || jsonb_build_object('analyze_completed', NOW());

    -- Refresh materialized views
    PERFORM refresh_dashboard_metrics_incremental();
    maintenance_log := maintenance_log || jsonb_build_object('materialized_views_refreshed', NOW());

    -- Cleanup old data
    DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '1 year';
    DELETE FROM cache_entries WHERE expires_at < NOW();
    DELETE FROM query_performance_log WHERE created_at < NOW() - INTERVAL '90 days';
    maintenance_log := maintenance_log || jsonb_build_object('cleanup_completed', NOW());

    -- Reindex fragmented indexes
    REINDEX INDEX CONCURRENTLY idx_journal_entries_user_date;
    REINDEX INDEX CONCURRENTLY idx_tasks_user_status;
    maintenance_log := maintenance_log || jsonb_build_object('reindex_completed', NOW());

    -- Log maintenance completion
    INSERT INTO activity_logs (user_id, activity_type, entity_type, details)
    SELECT
        id,
        'database_maintenance',
        'system',
        maintenance_log
    FROM users
    WHERE is_active = true
    LIMIT 1;

    RAISE NOTICE 'Maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Create maintenance schedule table
CREATE TABLE maintenance_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_name VARCHAR(100) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    schedule_expression VARCHAR(100),
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule regular maintenance
INSERT INTO maintenance_schedule (task_name, task_type, schedule_expression, next_run_at) VALUES
('daily_maintenance', 'cleanup', '0 2 * * *', NEXT_DAY(CURRENT_TIMESTAMP, 'sunday') + INTERVAL '2 hours'),
('weekly_vacuum', 'vacuum', '0 3 * * 0', NEXT_DAY(CURRENT_TIMESTAMP, 'sunday') + INTERVAL '3 hours'),
('monthly_reindex', 'reindex', '0 4 1 * *', DATE_TRUNC('month', CURRENT_DATE + INTERVAL '1 month') + INTERVAL '4 hours');
```

## 8. Performance Monitoring Dashboard

```sql
-- Real-time performance monitoring view
CREATE MATERIALIZED VIEW performance_dashboard AS
WITH current_performance AS (
    SELECT
        (SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE wait_event_type = 'Lock') as waiting_locks,
        (SELECT ROUND((SUM(blks_hit)::NUMERIC / NULLIF(SUM(blks_hit) + SUM(blks_read), 0)) * 100, 2)
         FROM pg_stat_database WHERE datname = current_database()) as cache_hit_ratio,
        (SELECT COUNT(*) FROM pg_stat_activity WHERE query_start < NOW() - INTERVAL '5 minutes' AND state = 'active') as long_running_queries
),
slow_queries_today AS (
    SELECT COUNT(*) as slow_query_count
    FROM query_performance_log
    WHERE DATE(created_at) = CURRENT_DATE
    AND execution_time_ms > 1000
),
table_sizes AS (
    SELECT
        schemaname || '.' || tablename as table_name,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        n_live_tup,
        n_dead_tup
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LIMIT 5
)
SELECT
    NOW() as snapshot_time,
    p.*,
    q.slow_query_count,
    json_agg(t.*) as top_tables
FROM current_performance p
CROSS JOIN slow_queries_today q
CROSS JOIN LATERAL (SELECT * FROM table_sizes LIMIT 3) t
GROUP BY p.active_connections, p.waiting_locks, p.cache_hit_ratio, p.long_running_queries, q.slow_query_count;

CREATE UNIQUE INDEX idx_performance_dashboard_unique ON performance_dashboard(snapshot_time);

-- Refresh function
CREATE OR REPLACE FUNCTION refresh_performance_dashboard()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY performance_dashboard;
END;
$$ LANGUAGE plpgsql;
```

## 9. Scaling Recommendations

### 9.1 Vertical Scaling Guidelines

```sql
-- Memory requirements calculation
WITH memory_requirements AS (
    SELECT
        'shared_buffers' as setting,
        ROUND(pg_size_pretty(pg_database_size(current_database()))::NUMERIC * 0.25) as recommended_mb
    UNION ALL
    SELECT
        'work_mem' as setting,
        ROUND(MAX(CASE
            WHEN schemaname = 'public'
            THEN (n_tup_ins + n_tup_upd + n_tup_del) * 8192 / 1024
            ELSE 0
        END)) as recommended_mb
    FROM pg_stat_user_tables
    UNION ALL
    SELECT
        'maintenance_work_mem' as setting,
        '512' as recommended_mb
    UNION ALL
    SELECT
        'effective_cache_size' as setting,
        ROUND((SELECT setting::INTEGER * 1024 FROM pg_settings WHERE name = 'shared_buffers') * 3) as recommended_mb
)
SELECT setting, recommended_mb || ' MB' as recommendation
FROM memory_requirements;
```

### 9.2 Horizontal Scaling Strategy

```python
# Database connection router for read/write splitting
class DatabaseRouter:
    def __init__(self):
        self.primary_pool = self._create_primary_pool()
        self.replica_pools = self._create_replica_pools()
        self.replica_index = 0

    def get_connection(self, read_only=False):
        if read_only and self.replica_pools:
            # Round-robin between replicas for read operations
            pool = self.replica_pools[self.replica_index % len(self.replica_pools)]
            self.replica_index += 1
            return pool.getconn()
        else:
            # Use primary for write operations and critical reads
            return self.primary_pool.getconn()

    def execute_query(self, query, params=None, read_only=False):
        conn = self.get_connection(read_only)
        try:
            with conn.cursor() as cur:
                cur.execute(query, params or ())
                if read_only:
                    return cur.fetchall()
                else:
                    conn.commit()
                    return cur.rowcount
        except Exception as e:
            if not read_only:
                conn.rollback()
            raise e
        finally:
            if read_only:
                self.replica_pools[self.replica_index - 1 % len(self.replica_pools)].putconn(conn)
            else:
                self.primary_pool.putconn(conn)
```

## Conclusion

This performance optimization strategy provides:

1. **Query Optimization**: Optimized common queries with proper indexing strategies
2. **Advanced Indexing**: Composite, partial, and functional indexes for optimal performance
3. **Partitioning**: Time-based and hash partitioning for large tables
4. **Caching**: Materialized views with intelligent refresh strategies
5. **Connection Management**: PgBouncer configuration and connection pooling
6. **Monitoring**: Comprehensive performance monitoring and alerting
7. **Maintenance**: Automated cleanup and optimization tasks
8. **Scaling**: Both vertical and horizontal scaling strategies

**Key Performance Metrics to Monitor:**
- Query execution times (target: < 100ms for dashboard queries)
- Cache hit ratio (target: > 95%)
- Connection pool utilization (target: < 80%)
- Index usage and efficiency
- Table bloat and fragmentation
- Lock contention and wait times

This optimization strategy ensures the Assistant Hub database can handle high traffic loads while maintaining excellent performance for all user interactions.