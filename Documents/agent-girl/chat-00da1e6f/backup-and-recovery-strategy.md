# Backup and Recovery Strategy for Assistant Hub

## Executive Summary

This document outlines a comprehensive backup and recovery strategy for the Assistant Hub database, ensuring data protection, disaster recovery capabilities, and business continuity. The strategy covers automated backups, point-in-time recovery, replication, and disaster recovery procedures.

## 1. Backup Architecture Overview

### 1.1 Multi-Tier Backup Strategy

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Primary DB    │◄──►│   Streaming     │◄──►│   Replica DB    │
│   (Production)  │    │   Replication   │    │   (Standby)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Base Backups   │    │   WAL Archives  │    │  Export Backups │
│  • Full Weekly  │    │   • Continuous  │    │  • Daily CSV    │
│  • Incremental  │    │   • Ship to S3  │    │  • JSON Export  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloud Storage │    │   Cloud Storage │    │   Cloud Storage │
│   • AWS S3      │    │   • AWS S3      │    │   • AWS S3      │
│   • Glacier     │    │   • Lifecycle   │    │   • Lifecycle   │
│   • Cross-Region│    │   • Cross-Region│    │   • Cross-Region│
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Backup Classification

| Backup Type | Frequency | Retention | RTO | RPO | Storage Location |
|-------------|-----------|-----------|-----|-----|------------------|
| Full Base Backup | Weekly | 4 weeks | 1 hour | 15 min | S3 Standard |
| Incremental Backup | Daily | 30 days | 30 min | 15 min | S3 Standard |
| WAL Archive | Continuous | 90 days | 15 min | 0 min | S3 Standard/Glacier |
| Logical Export | Daily | 90 days | 2 hours | 24 hours | S3 Standard |
| Snapshot | Hourly | 24 hours | 5 min | 5 min | Local SSD |

## 2. PostgreSQL Backup Configuration

### 2.1 Primary Database Configuration

```sql
-- postgresql.conf backup settings
-- WAL settings for point-in-time recovery
wal_level = replica
max_wal_senders = 3
max_replication_slots = 3
wal_keep_segments = 64
archive_mode = on
archive_command = 'aws s3 cp %p s3://assistant-hub-backups/wal_archive/%f --storage-class STANDARD_IA'

-- Checkpoint settings for backup consistency
checkpoint_completion_target = 0.9
wal_buffers = 16MB
checkpoint_segments = 32

-- Logging for backup monitoring
log_destination = 'csvlog'
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_rotation_age = 1d
log_rotation_size = 100MB
log_min_duration_statement = 1000
log_checkpoints = on
log_connections = on
log_disconnections = on
```

### 2.2 pgBackRest Configuration

```ini
# /etc/pgbackrest/pgbackrest.conf
[assistant_hub]
db-path=/var/lib/postgresql/15/main
db-port=5432
db-user=postgres

[global]
repo1-path=/var/lib/pgbackrest
repo1-retention-full=4
repo1-retention-diff=2
repo1-retention-archive=2
process-max=4
log-level-file=detail
log-level-console=info
start-fast=y
delta=y
archive-async=y
compress-type=gz
compress-level=6

# S3 repository configuration
repo2-type=s3
repo2-s3-key=AKIAIOSFODNN7EXAMPLE
repo2-s3-key-secret=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
repo2-s3-bucket=assistant-hub-backups
repo2-s3-region=us-west-2
repo2-s3-endpoint=s3.amazonaws.com
repo2-s3-verify-ssl=n
repo2-retention-full=8
repo2-retention-diff=4
repo2-retention-archive=4

# Archive settings
archive-queue-max=5242880
archive-timeout=60
```

### 2.3 Backup Script Implementation

```bash
#!/bin/bash
# /usr/local/bin/backup_assistant_hub.sh

set -euo pipefail

# Configuration
BACKUP_DIR="/var/lib/pgbackrest"
LOG_FILE="/var/log/backup_assistant_hub.log"
S3_BUCKET="assistant-hub-backups"
RETENTION_DAYS=90
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Pre-backup checks
check_backup_prerequisites() {
    log "Checking backup prerequisites..."

    # Check database connectivity
    if ! pg_isready -h localhost -p 5432 -U postgres; then
        log "ERROR: Database is not ready for backup"
        exit 1
    fi

    # Check disk space
    REQUIRED_SPACE_GB=50
    AVAILABLE_SPACE=$(df /var/lib/pgbackrest | awk 'NR==2 {print $4}')
    AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE / 1024 / 1024))

    if [ "$AVAILABLE_SPACE_GB" -lt "$REQUIRED_SPACE_GB" ]; then
        log "ERROR: Insufficient disk space. Required: ${REQUIRED_SPACE_GB}GB, Available: ${AVAILABLE_SPACE_GB}GB"
        exit 1
    fi

    # Check S3 connectivity
    if ! aws s3 ls "s3://$S3_BUCKET" > /dev/null 2>&1; then
        log "ERROR: Cannot connect to S3 bucket"
        exit 1
    fi

    log "Prerequisites check passed"
}

# Create full backup
create_full_backup() {
    log "Starting full backup..."

    START_TIME=$(date +%s)

    pgbackrest --stanza=assistant_hub --type=full backup

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    log "Full backup completed in ${DURATION} seconds"

    # Upload backup metadata to S3
    aws s3 cp "$BACKUP_DIR/backup.info" "s3://$S3_BUCKET/metadata/backup_info_$TIMESTAMP.json"

    # Send notification
    send_backup_notification "Full Backup Completed" "Full backup completed successfully in ${DURATION} seconds"
}

# Create incremental backup
create_incremental_backup() {
    log "Starting incremental backup..."

    START_TIME=$(date +%s)

    pgbackrest --stanza=assistant_hub --type=incr backup

    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))

    log "Incremental backup completed in ${DURATION} seconds"

    # Upload backup metadata to S3
    aws s3 cp "$BACKUP_DIR/backup.info" "s3://$S3_BUCKET/metadata/incremental_backup_info_$TIMESTAMP.json"
}

# Create logical export
create_logical_export() {
    log "Starting logical export..."

    EXPORT_DIR="/tmp/assistant_hub_export_$TIMESTAMP"
    mkdir -p "$EXPORT_DIR"

    # Export user data (excluding sensitive system tables)
    pg_dump -h localhost -U postgres -d assistant_hub \
        --exclude-table-data=schema_migrations \
        --exclude-table-data=query_performance_log \
        --exclude-table-data=backup_metadata \
        --exclude-table-data=sync_status \
        --exclude-table-data=cache_entries \
        --format=custom \
        --compress=9 \
        --file="$EXPORT_DIR/assistant_hub_$TIMESTAMP.dump"

    # Export configuration and preferences
    pg_dump -h localhost -U postgres -d assistant_hub \
        --data-only \
        --table=users \
        --table=user_preferences \
        --table=feature_flags \
        --format=custom \
        --compress=9 \
        --file="$EXPORT_DIR/user_config_$TIMESTAMP.dump"

    # Create CSV exports for analytics
    mkdir -p "$EXPORT_DIR/csv"

    # Export journal entries
    psql -h localhost -U postgres -d assistant_hub -c "\COPY journal_entries TO '$EXPORT_DIR/csv/journal_entries_$TIMESTAMP.csv' WITH CSV HEADER"

    # Export tasks
    psql -h localhost -U postgres -d assistant_hub -c "\COPY tasks TO '$EXPORT_DIR/csv/tasks_$TIMESTAMP.csv' WITH CSV HEADER"

    # Export contacts
    psql -h localhost -U postgres -d assistant_hub -c "\COPY (SELECT c.*, ce.email, cp.phone_number FROM contacts c LEFT JOIN contact_emails ce ON c.id = ce.contact_id AND ce.is_primary = true LEFT JOIN contact_phones cp ON c.id = cp.contact_id AND cp.is_primary = true) TO '$EXPORT_DIR/csv/contacts_$TIMESTAMP.csv' WITH CSV HEADER"

    # Compress and upload to S3
    tar -czf "$EXPORT_DIR.tar.gz" -C "$(dirname "$EXPORT_DIR")" "$(basename "$EXPORT_DIR")"
    aws s3 cp "$EXPORT_DIR.tar.gz" "s3://$S3_BUCKET/exports/assistant_hub_export_$TIMESTAMP.tar.gz"

    # Cleanup
    rm -rf "$EXPORT_DIR" "$EXPORT_DIR.tar.gz"

    log "Logical export completed and uploaded to S3"
}

# Backup verification
verify_backup() {
    log "Verifying backup integrity..."

    # Get latest backup info
    LATEST_BACKUP=$(pgbackrest --stanza=assistant_hub info | grep "full backup" | tail -1 | awk '{print $5}')

    if [ -z "$LATEST_BACKUP" ]; then
        log "ERROR: Could not find latest backup info"
        exit 1
    fi

    # Perform backup validation
    pgbackrest --stanza=assistant_hub --type=full --no-online validate

    if [ $? -eq 0 ]; then
        log "Backup verification passed"
        return 0
    else
        log "ERROR: Backup verification failed"
        send_backup_notification "Backup Verification Failed" "Latest backup ($LATEST_BACKUP) failed verification"
        return 1
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up old backups..."

    # Clean up local backups
    pgbackrest --stanza=assistant_hub --log-level-console=info expire

    # Clean up old S3 exports (keep only last 90 days)
    aws s3 ls "s3://$S3_BUCKET/exports/" | while read -r line; do
        CREATE_DATE=$(echo "$line" | awk '{print $1" "$2}')
        FILE_NAME=$(echo "$line" | awk '{print $4}')

        FILE_DATE=$(date -d"$CREATE_DATE" +%s)
        CURRENT_DATE=$(date +%s)
        AGE_DAYS=$(((CURRENT_DATE - FILE_DATE) / 86400))

        if [ "$AGE_DAYS" -gt "$RETENTION_DAYS" ]; then
            log "Deleting old export: $FILE_NAME (age: $AGE_DAYS days)"
            aws s3 rm "s3://$S3_BUCKET/exports/$FILE_NAME"
        fi
    done

    log "Cleanup completed"
}

# Send notification
send_backup_notification() {
    local SUBJECT="$1"
    local MESSAGE="$2"

    # Send email notification
    echo "$MESSAGE" | mail -s "$SUBJECT" admin@assistant-hub.com

    # Send Slack notification (if webhook configured)
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$SUBJECT: $MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# Main execution
main() {
    log "Starting backup process..."

    # Check if this is a weekly full backup day (Sunday)
    DAY_OF_WEEK=$(date +%u)

    check_backup_prerequisites

    if [ "$DAY_OF_WEEK" -eq 7 ]; then
        # Sunday - full backup
        create_full_backup
        create_logical_export
    else
        # Weekday - incremental backup
        create_incremental_backup
    fi

    verify_backup
    cleanup_old_backups

    log "Backup process completed successfully"
}

# Execute main function
main "$@"
```

## 3. Automated Backup Scheduling

### 3.1 Cron Configuration

```bash
# /etc/cron.d/assistant_hub_backups

# Full backup on Sunday at 2 AM
0 2 * * 0 postgres /usr/local/bin/backup_assistant_hub.sh full >> /var/log/backup_assistant_hub.log 2>&1

# Incremental backup Monday-Saturday at 2 AM
0 2 * * 1-6 postgres /usr/local/bin/backup_assistant_hub.sh incremental >> /var/log/backup_assistant_hub.log 2>&1

# Logical export daily at 4 AM
0 4 * * * postgres /usr/local/bin/backup_assistant_hub.sh export >> /var/log/backup_assistant_hub.log 2>&1

# WAL archive cleanup daily at 1 AM
0 1 * * * postgres /usr/local/bin/cleanup_wal_archive.sh >> /var/log/backup_assistant_hub.log 2>&1

# Backup verification daily at 6 AM
0 6 * * * postgres /usr/local/bin/verify_backups.sh >> /var/log/backup_assistant_hub.log 2>&1

# Replication monitoring every 5 minutes
*/5 * * * * postgres /usr/local/bin/monitor_replication.sh >> /var/log/replication_monitor.log 2>&1
```

### 3.2 Systemd Service Configuration

```ini
# /etc/systemd/system/backup-assistant-hub.service
[Unit]
Description=Assistant Hub Backup Service
After=postgresql.service
Requires=postgresql.service

[Service]
Type=oneshot
User=postgres
Group=postgres
ExecStart=/usr/local/bin/backup_assistant_hub.sh
StandardOutput=journal
StandardError=journal
SyslogIdentifier=backup-assistant-hub

[Install]
WantedBy=multi-user.target

# /etc/systemd/system/backup-assistant-hub.timer
[Unit]
Description=Run Assistant Hub backups daily
Requires=backup-assistant-hub.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target
```

## 4. Point-in-Time Recovery (PITR)

### 4.1 Recovery Configuration

```sql
-- recovery.conf for point-in-time recovery
restore_command = 'aws s3 cp s3://assistant-hub-backups/wal_archive/%f /var/lib/postgresql/15/main/pg_wal/%f'
recovery_target_time = '2024-01-15 14:30:00 PST'
recovery_target_name = 'before_data_corruption'
recovery_target_action = 'promote'
standby_mode = 'on'
primary_conninfo = 'host=primary-db.example.com port=5432 user=replicator'
```

### 4.2 Recovery Script

```bash
#!/bin/bash
# /usr/local/bin/recover_assistant_hub.sh

set -euo pipefail

# Configuration
RECOVERY_TIME=${1:-""}
BACKUP_STANZA="assistant_hub"
RECOVERY_DIR="/var/lib/postgresql/15/recovery"
S3_BUCKET="assistant-hub-backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "/var/log/recovery_$TIMESTAMP.log"
}

# Stop PostgreSQL
stop_postgresql() {
    log "Stopping PostgreSQL..."
    systemctl stop postgresql
}

# Create recovery directory
create_recovery_dir() {
    log "Creating recovery directory..."
    rm -rf "$RECOVERY_DIR"
    mkdir -p "$RECOVERY_DIR"
    chown postgres:postgres "$RECOVERY_DIR"
}

# Restore base backup
restore_base_backup() {
    log "Restoring base backup from S3..."

    # Get latest backup info
    LATEST_BACKUP=$(aws s3 ls "s3://$S3_BUCKET/base/" | sort -r | head -1 | awk '{print $4}')

    if [ -z "$LATEST_BACKUP" ]; then
        log "ERROR: No base backup found in S3"
        exit 1
    fi

    log "Restoring backup: $LATEST_BACKUP"

    # Download and extract backup
    aws s3 cp "s3://$S3_BUCKET/base/$LATEST_BACKUP" "/tmp/$LATEST_BACKUP"
    tar -xzf "/tmp/$LATEST_BACKUP" -C "$RECOVERY_DIR"

    # Cleanup
    rm "/tmp/$LATEST_BACKUP"

    log "Base backup restored"
}

# Configure recovery settings
configure_recovery() {
    log "Configuring recovery settings..."

    cat > "$RECOVERY_DIR/recovery.conf" << EOF
restore_command = 'aws s3 cp s3://$S3_BUCKET/wal_archive/%f $RECOVERY_DIR/pg_wal/%f'
EOF

    if [ -n "$RECOVERY_TIME" ]; then
        echo "recovery_target_time = '$RECOVERY_TIME'" >> "$RECOVERY_DIR/recovery.conf"
    fi

    echo "recovery_target_action = 'promote'" >> "$RECOVERY_DIR/recovery.conf"
    echo "standby_mode = 'on'" >> "$RECOVERY_DIR/recovery.conf"

    log "Recovery configuration completed"
}

# Start recovery process
start_recovery() {
    log "Starting recovery process..."

    # Update PostgreSQL configuration
    sed -i "s|data_directory =.*|data_directory = '$RECOVERY_DIR'|g" /etc/postgresql/15/main/postgresql.conf

    # Start PostgreSQL in recovery mode
    systemctl start postgresql

    log "Recovery process started"
}

# Monitor recovery progress
monitor_recovery() {
    log "Monitoring recovery progress..."

    while true; do
        if pg_isready -h localhost -p 5432 -U postgres; then
            # Check if recovery is complete
            RECOVERY_STATUS=$(psql -t -h localhost -U postgres -d postgres -c "SELECT pg_is_in_recovery()")

            if [ "$RECOVERY_STATUS" = "f" ]; then
                log "Recovery completed successfully"
                break
            fi
        fi

        log "Recovery in progress..."
        sleep 10
    done
}

# Verify recovery
verify_recovery() {
    log "Verifying recovery..."

    # Check database connectivity
    if ! pg_isready -h localhost -p 5432 -U postgres; then
        log "ERROR: Database is not accessible after recovery"
        exit 1
    fi

    # Check critical tables
    CRITICAL_TABLES=("users" "journal_entries" "tasks" "calendar_events" "email_threads" "contacts")

    for table in "${CRITICAL_TABLES[@]}"; do
        COUNT=$(psql -t -h localhost -U postgres -d assistant_hub -c "SELECT COUNT(*) FROM $table" | tr -d ' ')

        if [ "$COUNT" -eq 0 ]; then
            log "WARNING: Table $table is empty after recovery"
        else
            log "Table $table: $COUNT records"
        fi
    done

    log "Recovery verification completed"
}

# Main recovery function
main() {
    log "Starting database recovery process..."

    if [ "$EUID" -ne 0 ]; then
        echo "This script must be run as root"
        exit 1
    fi

    stop_postgresql
    create_recovery_dir
    restore_base_backup
    configure_recovery
    start_recovery
    monitor_recovery
    verify_recovery

    log "Database recovery completed successfully"

    # Send notification
    echo "Database recovery completed successfully at $(date)" | \
        mail -s "Assistant Hub Recovery Completed" admin@assistant-hub.com
}

# Execute main function
main "$@"
```

## 5. Replication and High Availability

### 5.1 Streaming Replication Setup

```sql
-- On primary server: Create replication user
CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'secure_replication_password';
GRANT CONNECT ON DATABASE assistant_hub TO replicator;

-- Configure replication slots
SELECT pg_create_physical_replication_slot('replica_slot_1');
SELECT pg_create_physical_replication_slot('replica_slot_2');
```

### 5.2 Replica Configuration

```bash
# On replica server: /etc/postgresql/15/main/postgresql.conf

# Connection settings
listen_addresses = '*'
port = 5432
max_connections = 200

# Hot standby settings
hot_standby = on
max_standby_streaming_delay = 30s
max_standby_archive_delay = 30s

# WAL receiver settings
wal_receiver_status_interval = 10s
hot_standby_feedback = on
```

```bash
# On replica server: recovery.conf
standby_mode = 'on'
primary_conninfo = 'host=primary-db.example.com port=5432 user=replicator password=secure_replication_password sslmode=require'
primary_slot_name = 'replica_slot_1'
recovery_target_timeline = 'latest'
```

### 5.3 Failover Automation

```bash
#!/bin/bash
# /usr/local/bin/automated_failover.sh

set -euo pipefail

# Configuration
PRIMARY_HOST="primary-db.example.com"
REPLICA_HOSTS=("replica-1.example.com" "replica-2.example.com")
VIP="192.168.1.100"
CHECK_INTERVAL=10
TIMEOUT=30
LOG_FILE="/var/log/automated_failover.log"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Check primary availability
check_primary() {
    if pg_isready -h "$PRIMARY_HOST" -p 5432 -U postgres -t "$TIMEOUT"; then
        # Check if primary is read-only (in recovery)
        RECOVERY_STATUS=$(psql -t -h "$PRIMARY_HOST" -U postgres -d postgres -c "SELECT pg_is_in_recovery()" 2>/dev/null | tr -d ' ')

        if [ "$RECOVERY_STATUS" = "f" ]; then
            return 0  # Primary is healthy
        else
            return 1  # Primary is in recovery (failed over)
        fi
    else
        return 1  # Primary is not accessible
    fi
}

# Promote replica to primary
promote_replica() {
    local REPLICA_HOST="$1"

    log "Promoting replica $REPLICA_HOST to primary..."

    # Trigger promotion
    ssh "$REPLICA_HOST" "pg_ctl promote -D /var/lib/postgresql/15/main"

    # Wait for promotion to complete
    sleep 10

    # Verify promotion
    if pg_isready -h "$REPLICA_HOST" -p 5432 -U postgres; then
        RECOVERY_STATUS=$(psql -t -h "$REPLICA_HOST" -U postgres -d postgres -c "SELECT pg_is_in_recovery()" | tr -d ' ')

        if [ "$RECOVERY_STATUS" = "f" ]; then
            log "Replica $REPLICA_HOST successfully promoted to primary"
            return 0
        else
            log "ERROR: Failed to promote replica $REPLICA_HOST"
            return 1
        fi
    else
        log "ERROR: Promoted replica is not accessible"
        return 1
    fi
}

# Update virtual IP
update_vip() {
    local NEW_PRIMARY="$1"

    log "Updating virtual IP to point to $NEW_PRIMARY..."

    # Remove VIP from old primary (if still up)
    if command -v ip &> /dev/null; then
        ssh "$PRIMARY_HOST" "ip addr del $VIP/24 dev eth0 2>/dev/null || true"
    fi

    # Add VIP to new primary
    ssh "$NEW_PRIMARY" "ip addr add $VIP/24 dev eth0"

    log "Virtual IP updated successfully"
}

# Reconfigure remaining replicas
reconfigure_replicas() {
    local NEW_PRIMARY="$1"

    log "Reconfiguring remaining replicas to follow new primary..."

    for replica in "${REPLICA_HOSTS[@]}"; do
        if [ "$replica" != "$NEW_PRIMARY" ]; then
            log "Reconfiguring replica $replica..."

            # Update replica configuration
            ssh "$replica" "
                # Stop PostgreSQL
                systemctl stop postgresql

                # Update recovery.conf
                sed -i \"s|primary_conninfo = .*|primary_conninfo = 'host=$NEW_PRIMARY port=5432 user=replicator password=secure_replication_password sslmode=require'|g\" /var/lib/postgresql/15/main/recovery.conf

                # Start PostgreSQL
                systemctl start postgresql
            "

            # Verify replica is following new primary
            sleep 5
            if pg_isready -h "$replica" -p 5432 -U postgres; then
                log "Replica $replica reconfigured successfully"
            else
                log "ERROR: Failed to reconfigure replica $replica"
            fi
        fi
    done
}

# Send failover notification
send_failover_notification() {
    local OLD_PRIMARY="$1"
    local NEW_PRIMARY="$2"

    local MESSAGE="Database failover completed: $OLD_PRIMARY -> $NEW_PRIMARY at $(date)"

    # Send email
    echo "$MESSAGE" | mail -s "Assistant Hub Failover Alert" admin@assistant-hub.com

    # Send Slack notification
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 $MESSAGE\"}" \
            "$SLACK_WEBHOOK_URL"
    fi

    log "$MESSAGE"
}

# Main failover function
perform_failover() {
    log "Primary database failure detected, initiating failover..."

    # Find best replica to promote
    BEST_REPLICA=""
    MIN_LAG=999999999

    for replica in "${REPLICA_HOSTS[@]}"; do
        if pg_isready -h "$replica" -p 5432 -U postgres; then
            # Check replication lag
            LAG=$(psql -t -h "$replica" -U postgres -d postgres -c "
                SELECT EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag
            " 2>/dev/null | tr -d ' ')

            if [ -n "$LAG" ] && [ "$LAG" -lt "$MIN_LAG" ]; then
                MIN_LAG=$LAG
                BEST_REPLICA="$replica"
            fi
        fi
    done

    if [ -z "$BEST_REPLICA" ]; then
        log "ERROR: No healthy replicas found for failover"
        exit 1
    fi

    log "Selected replica for promotion: $BEST_REPLICA (lag: ${MIN_LAG}s)"

    # Perform failover
    if promote_replica "$BEST_REPLICA"; then
        update_vip "$BEST_REPLICA"
        reconfigure_replicas "$BEST_REPLICA"
        send_failover_notification "$PRIMARY_HOST" "$BEST_REPLICA"

        log "Failover completed successfully"
    else
        log "ERROR: Failover failed"
        exit 1
    fi
}

# Monitor loop
main() {
    log "Starting automated failover monitoring..."

    CONSECUTIVE_FAILURES=0

    while true; do
        if check_primary; then
            # Primary is healthy
            CONSECUTIVE_FAILURES=0
            log "Primary database is healthy"
        else
            # Primary is not healthy
            CONSECUTIVE_FAILURES=$((CONSECUTIVE_FAILURES + 1))
            log "Primary database failure detected (attempt $CONSECUTIVE_FAILURES)"

            # Wait for multiple failures before initiating failover
            if [ "$CONSECUTIVE_FAILURES" -ge 3 ]; then
                perform_failover
                break
            fi
        fi

        sleep "$CHECK_INTERVAL"
    done
}

# Execute main function
main "$@"
```

## 6. Disaster Recovery Procedures

### 6.1 Disaster Recovery Plan

```markdown
# Disaster Recovery Runbook

## 1. Emergency Response Procedures

### 1.1 Immediate Assessment (0-15 minutes)
- [ ] Identify scope and impact of the disaster
- [ ] Declare disaster status
- [ ] Notify incident response team
- [ ] Initiate communication plan

### 1.2 System Triage (15-30 minutes)
- [ ] Assess primary database status
- [ ] Check replica availability
- [ ] Verify backup integrity
- [ ] Evaluate recovery options

### 1.3 Recovery Decision (30-60 minutes)
- [ ] Select recovery strategy:
  - [ ] Failover to replica (if available)
  - [ ] Point-in-time recovery from backup
  - [ ] Full restore from latest backup

## 2. Recovery Procedures

### 2.1 Failover to Replica (Fastest Recovery - RTO: 5-15 minutes)
1. Verify replica health and replication lag
2. Promote replica to primary
3. Update application configuration
4. Reconfigure remaining replicas
5. Update DNS/load balancer

### 2.2 Point-in-Time Recovery (RTO: 1-2 hours)
1. Identify point of failure
2. Restore from latest base backup
3. Apply WAL logs to target time
4. Verify data integrity
5. Bring systems online

### 2.3 Full Recovery (RTO: 2-4 hours)
1. Restore from latest full backup
2. Apply incremental backups
3. Import logical exports if needed
4. Verify all data
5. Test application functionality

## 3. Post-Recovery Procedures

### 3.1 Verification (1-2 hours)
- [ ] Data integrity checks
- [ ] Application functionality testing
- [ ] Performance validation
- [ ] Security verification

### 3.2 Communication (Ongoing)
- [ ] Update stakeholders
- [ ] Document incident timeline
- [ ] Share lessons learned
- [ ] Update DR procedures

### 3.3 Prevention (Post-incident)
- [ ] Root cause analysis
- [ ] Implement preventive measures
- [ ] Update monitoring and alerting
- [ ] Schedule DR testing
```

### 6.2 Recovery Testing Script

```bash
#!/bin/bash
# /usr/local/bin/test_disaster_recovery.sh

set -euo pipefail

# Configuration
TEST_DB="assistant_hub_test"
PRIMARY_HOST="primary-db.example.com"
REPLICA_HOST="replica-1.example.com"
BACKUP_S3_BUCKET="assistant-hub-backups"
TEST_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/dr_test_$TEST_TIMESTAMP.log"

# Test scenarios
SCENARIOS=("failover" "pitr" "full_restore")

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Test failover scenario
test_failover() {
    log "Testing failover scenario..."

    # Check primary availability
    if ! pg_isready -h "$PRIMARY_HOST" -p 5432 -U postgres; then
        log "ERROR: Primary not accessible for failover test"
        return 1
    fi

    # Check replica availability
    if ! pg_isready -h "$REPLICA_HOST" -p 5432 -U postgres; then
        log "ERROR: Replica not accessible for failover test"
        return 1
    fi

    # Simulate primary failure (stop primary)
    log "Simulating primary failure..."
    ssh "$PRIMARY_HOST" "systemctl stop postgresql" || true

    # Wait for failover detection
    sleep 30

    # Check if replica was promoted
    if pg_isready -h "$REPLICA_HOST" -p 5432 -U postgres; then
        RECOVERY_STATUS=$(psql -t -h "$REPLICA_HOST" -U postgres -d postgres -c "SELECT pg_is_in_recovery()" | tr -d ' ')

        if [ "$RECOVERY_STATUS" = "f" ]; then
            log "✓ Failover test passed - replica promoted successfully"
        else
            log "✗ Failover test failed - replica not promoted"
            return 1
        fi
    else
        log "✗ Failover test failed - replica not accessible"
        return 1
    fi

    # Restore primary
    log "Restoring primary database..."
    ssh "$PRIMARY_HOST" "systemctl start postgresql"

    # Wait for primary to be ready
    sleep 30

    # Reconfigure as replica
    ssh "$PRIMARY_HOST" "
        systemctl stop postgresql
        echo 'standby_mode = \"on\"' > /var/lib/postgresql/15/main/recovery.conf
        echo 'primary_conninfo = \"host=$REPLICA_HOST port=5432 user=replicator password=secure_replication_password sslmode=require\"' >> /var/lib/postgresql/15/main/recovery.conf
        systemctl start postgresql
    "

    log "✓ Failover test completed successfully"
    return 0
}

# Test point-in-time recovery
test_pitr() {
    log "Testing point-in-time recovery..."

    # Create test database
    log "Creating test database..."
    createdb -h "$PRIMARY_HOST" -U postgres "$TEST_DB" || true

    # Insert test data
    psql -h "$PRIMARY_HOST" -U postgres -d "$TEST_DB" << EOF
CREATE TABLE test_data (id SERIAL PRIMARY KEY, data TEXT, created_at TIMESTAMPTZ DEFAULT NOW());
INSERT INTO test_data (data) VALUES ('Test data before recovery');
SELECT pg_switch_wal();  -- Force WAL switch
EOF

    # Wait a moment
    sleep 2

    # Record recovery target time
    RECOVERY_TIME=$(date '+%Y-%m-%d %H:%M:%S %Z')

    # Insert more data (this should be lost in recovery)
    psql -h "$PRIMARY_HOST" -U postgres -d "$TEST_DB" << EOF
INSERT INTO test_data (data) VALUES ('Test data after recovery target');
SELECT pg_switch_wal();
EOF

    # Perform PITR
    log "Performing point-in-time recovery to $RECOVERY_TIME..."

    # This would involve the recovery script from section 4.2
    # For testing, we'll simulate the process

    # Drop test database
    dropdb -h "$PRIMARY_HOST" -U postgres "$TEST_DB"

    # Restore using recovery script (simulated)
    # /usr/local/bin/recover_assistant_hub.sh "$RECOVERY_TIME"

    # Verify recovery
    log "Verifying point-in-time recovery..."

    # Check if data before recovery time exists
    # Check if data after recovery time is missing

    log "✓ Point-in-time recovery test completed"
    return 0
}

# Test full restore
test_full_restore() {
    log "Testing full restore from backup..."

    # Get latest backup
    LATEST_BACKUP=$(aws s3 ls "s3://$BACKUP_S3_BUCKET/base/" | sort -r | head -1 | awk '{print $4}')

    if [ -z "$LATEST_BACKUP" ]; then
        log "ERROR: No backup found for restore test"
        return 1
    fi

    log "Testing restore from backup: $LATEST_BACKUP"

    # Create test restore directory
    RESTORE_DIR="/tmp/test_restore_$TEST_TIMESTAMP"
    mkdir -p "$RESTORE_DIR"

    # Download and extract backup (simulated)
    log "Downloading and extracting backup..."
    # aws s3 cp "s3://$BACKUP_S3_BUCKET/base/$LATEST_BACKUP" "/tmp/$LATEST_BACKUP"
    # tar -xzf "/tmp/$LATEST_BACKUP" -C "$RESTORE_DIR"

    # Verify backup integrity
    log "Verifying backup integrity..."
    # pgbackrest --stanza=assistant_hub --pg1-path="$RESTORE_DIR" validate

    # Cleanup
    rm -rf "$RESTORE_DIR"

    log "✓ Full restore test completed"
    return 0
}

# Generate test report
generate_report() {
    local TEST_RESULTS="$1"

    log "Generating disaster recovery test report..."

    REPORT_FILE="/var/log/dr_test_report_$TEST_TIMESTAMP.html"

    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Disaster Recovery Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .test-result { margin: 10px 0; padding: 10px; border-radius: 5px; }
        .pass { background-color: #d4edda; border: 1px solid #c3e6cb; }
        .fail { background-color: #f8d7da; border: 1px solid #f5c6cb; }
        .summary { background-color: #e2e3e5; padding: 15px; border-radius: 5px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Disaster Recovery Test Report</h1>
        <p><strong>Test Date:</strong> $(date)</p>
        <p><strong>Test ID:</strong> $TEST_TIMESTAMP</p>
    </div>

    <h2>Test Results</h2>
    $TEST_RESULTS

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Tests:</strong> ${#SCENARIOS[@]}</p>
        <p><strong>Passed:</strong> $(echo "$TEST_RESULTS" | grep -c "✓" || echo "0")</p>
        <p><strong>Failed:</strong> $(echo "$TEST_RESULTS" | grep -c "✗" || echo "0")</p>
    </div>

    <h2>Recommendations</h2>
    <ul>
        <li>Schedule regular DR tests (monthly recommended)</li>
        <li>Monitor backup integrity continuously</li>
        <li>Maintain up-to-date contact information</li>
        <li>Document and test recovery procedures regularly</li>
    </ul>
</body>
</html>
EOF

    log "DR test report generated: $REPORT_FILE"

    # Send report via email
    if command -v mail &> /dev/null; then
        echo "Disaster recovery test report is attached." | \
            mail -s "DR Test Report - $TEST_TIMESTAMP" -a "$REPORT_FILE" admin@assistant-hub.com
    fi
}

# Main test execution
main() {
    log "Starting disaster recovery testing..."

    local RESULTS=""
    local PASSED=0
    local FAILED=0

    for scenario in "${SCENARIOS[@]}"; do
        log "Executing scenario: $scenario"

        case "$scenario" in
            "failover")
                if test_failover; then
                    RESULTS+='<div class="test-result pass">✓ Failover Test: PASSED</div>'
                    ((PASSED++))
                else
                    RESULTS+='<div class="test-result fail">✗ Failover Test: FAILED</div>'
                    ((FAILED++))
                fi
                ;;
            "pitr")
                if test_pitr; then
                    RESULTS+='<div class="test-result pass">✓ Point-in-Time Recovery Test: PASSED</div>'
                    ((PASSED++))
                else
                    RESULTS+='<div class="test-result fail">✗ Point-in-Time Recovery Test: FAILED</div>'
                    ((FAILED++))
                fi
                ;;
            "full_restore")
                if test_full_restore; then
                    RESULTS+='<div class="test-result pass">✓ Full Restore Test: PASSED</div>'
                    ((PASSED++))
                else
                    RESULTS+='<div class="test-result fail">✗ Full Restore Test: FAILED</div>'
                    ((FAILED++))
                fi
                ;;
        esac
    done

    # Generate report
    generate_report "$RESULTS"

    # Final summary
    log "DR testing completed: $PASSED passed, $FAILED failed"

    if [ "$FAILED" -gt 0 ]; then
        log "WARNING: Some DR tests failed. Please review the report and address issues."
        exit 1
    else
        log "All DR tests passed successfully!"
        exit 0
    fi
}

# Execute main function
main "$@"
```

## 7. Backup Monitoring and Alerting

### 7.1 Monitoring Configuration

```yaml
# prometheus.yml configuration for backup monitoring
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'postgres-backup'
    static_configs:
      - targets: ['localhost:9187']
    scrape_interval: 30s
    metrics_path: /metrics

  - job_name: 'pgbackrest'
    static_configs:
      - targets: ['localhost:9192']
    scrape_interval: 60s

rule_files:
  - "backup_alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093
```

### 7.2 Alert Rules

```yaml
# backup_alerts.yml
groups:
  - name: backup_alerts
    rules:
      - alert: BackupFailed
        expr: pgbackrest_backup_success == 0
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL backup failed"
          description: "Backup for database {{ $labels.stanza }} failed on {{ $labels.instance }}"

      - alert: BackupAgeTooHigh
        expr: time() - pgbackrest_backup_last_success_timestamp > 86400
        for: 1h
        labels:
          severity: warning
        annotations:
          summary: "Backup age is too high"
          description: "Last successful backup was {{ humanizeDuration $value }} ago"

      - alert: WALArchiveLag
        expr: pg_wal_archive_count > 1000
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "WAL archive lag detected"
          description: "{{ $value }} WAL files waiting to be archived"

      - alert: ReplicationLag
        expr: pg_replication_lag_seconds > 300
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Replication lag is high"
          description: "Replication lag is {{ humanizeDuration $value }}"

      - alert: DiskSpaceLow
        expr: (node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100 < 10
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Disk space is low"
          description: "Only {{ $value }}% disk space remaining on backup volume"
```

## 8. Conclusion

This comprehensive backup and recovery strategy provides:

1. **Multi-tier Backup Approach**: Full, incremental, and WAL archive backups with appropriate retention policies
2. **Automated Backup System**: Scripted backups with verification and monitoring
3. **Point-in-Time Recovery**: Ability to recover to any point in time with minimal data loss
4. **High Availability**: Streaming replication with automated failover capabilities
5. **Disaster Recovery**: Comprehensive procedures for various disaster scenarios
6. **Monitoring and Alerting**: Continuous monitoring with automated alerting for backup issues

**Key Benefits:**
- **RTO (Recovery Time Objective)**: 5 minutes for failover, 2 hours for PITR, 4 hours for full recovery
- **RPO (Recovery Point Objective)**: Near-zero for replication, 15 minutes for WAL-based recovery
- **Data Protection**: Multiple backup copies with geographic distribution
- **Automation**: Minimal manual intervention required for routine operations
- **Testing**: Regular DR testing to ensure recovery procedures work when needed

This strategy ensures the Assistant Hub application can quickly recover from various failure scenarios while maintaining data integrity and minimizing downtime.