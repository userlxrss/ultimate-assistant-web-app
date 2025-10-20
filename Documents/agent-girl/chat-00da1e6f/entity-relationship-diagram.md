# Assistant Hub - Entity Relationship Diagram

## Core Entity Relationships

```
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│      users      │◄──────┤   user_preferences   │──────►│ feature_flags   │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
         │
         ├───────────────────────────────────────────────────────────────────┐
         │                                                                   │
         ▼                                                                   ▼
┌─────────────────┐       ┌──────────────────────┐       ┌─────────────────┐
│ external_connections    │   activity_logs      │       │ analytics_data  │
└─────────────────┘       └──────────────────────┘       └─────────────────┘
         │
         ├───┐
         │   │
         ▼   ▼
┌─────────────────┐   ┌──────────────────────┐   ┌─────────────────┐
│ journal_entries │   │        tasks         │   │  calendar_events│
└─────────────────┘   └──────────────────────┘   └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐   ┌──────────────────────┐   ┌─────────────────┐
│ journal_reflections   │   task_projects     │   │ calendar_sources│
│ daily_wins           │   task_time_entries  │   │ event_reminders │
│ learning_insights    │   task_dependencies  │   └─────────────────┘
└─────────────────┘   └──────────────────────┘
```

## Detailed Relationship Mapping

### User-Centric Relationships
- **users** (1:1) → **user_preferences**
- **users** (1:N) → **external_connections**
- **users** (1:N) → **activity_logs**
- **users** (1:N) → **analytics_data**
- **users** (1:N) → **user_insights**

### Journal Module Relationships
- **users** (1:N) → **journal_entries**
- **journal_entries** (1:N) → **journal_reflections**
- **users** (1:N) → **daily_wins**
- **users** (1:N) → **learning_insights**

### Tasks Module Relationships
- **users** (1:N) → **tasks**
- **users** (1:N) → **task_projects**
- **tasks** (1:N) → **task_time_entries**
- **tasks** (M:N) → **task_dependencies** (self-referencing)
- **tasks** (N:1) → **task_projects**

### Calendar Module Relationships
- **users** (1:N) → **calendar_events**
- **users** (1:N) → **calendar_sources**
- **calendar_events** (1:N) → **event_reminders**
- **calendar_events** (1:N) → **calendar_events** (recurring instances)

### Email Module Relationships
- **users** (1:N) → **email_threads**
- **email_threads** (1:N) → **email_messages**
- **email_messages** (1:N) → **email_attachments**
- **email_messages** (1:1) → **email_search_index**

### Contacts Module Relationships
- **users** (1:N) → **contacts**
- **contacts** (1:N) → **contact_emails**
- **contacts** (1:N) → **contact_phones**
- **contacts** (1:N) → **contact_addresses**

## Cross-Module Data Flow

### Sync Integration Points
```
Google APIs → external_connections → Module Tables
Motion API  → external_connections → tasks table
Gmail API   → external_connections → email_* tables
Google Calendar → external_connections → calendar_* tables
Google Contacts → external_connections → contacts_* tables
```

### Analytics Pipeline
```
Module Tables → activity_logs → analytics_data → dashboard_metrics (materialized view)
```

### Dashboard Aggregation
```
journal_entries → mood trends
tasks → productivity metrics
calendar_events → time allocation
email_* → communication patterns
contacts → network analysis
```

## Key Constraints and Rules

1. **User Isolation**: All user-specific tables have user_id foreign keys with CASCADE delete
2. **External Data Sync**: External API data stored in external_data JSONB columns
3. **Temporal Relationships**: All tables have created_at/updated_at timestamps
4. **Soft Deletes**: Critical data uses is_active flags instead of hard deletes
5. **Audit Trail**: All modifications tracked through activity_logs

## Performance Considerations

1. **Indexing Strategy**: Primary indexes on user_id + frequently queried fields
2. **Partitioning**: Time-based partitioning for high-volume tables (journal_entries, analytics_data)
3. **Materialized Views**: Dashboard metrics pre-computed for fast loading
4. **Caching Layer**: Frequently accessed data cached in cache_entries table

## Security Boundaries

1. **Row Level Security**: Each user can only access their own data
2. **Data Encryption**: Sensitive fields encrypted using pgcrypto
3. **Audit Logging**: All data access logged for compliance
4. **Data Retention**: Configurable retention policies for different data types