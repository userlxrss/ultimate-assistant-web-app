# OAuth Authentication Database Schema Design

## Overview

This document outlines a comprehensive database schema for storing OAuth credentials and user authentication data for a web application integrating with Google APIs (Gmail, Calendar, Contacts) and Motion API.

## Database Choice

- **Development**: SQLite - Simple, file-based, zero configuration
- **Production**: PostgreSQL - Robust, scalable, ACID compliant, advanced features

## Schema Architecture

The schema follows these principles:
- **Security**: Sensitive data encryption, audit trails
- **Scalability**: Normalized design, proper indexing
- **Flexibility**: Support for multiple OAuth providers
- **Maintainability**: Clear relationships, migration support

## Entity Relationship Diagram (ERD)

```
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│     Users       │───────│ UserPreferences  │───────│ UserSessions    │
│                 │ 1   1 │                  │ 1   N │                 │
│ - id (PK)       │       │ - id (PK)        │       │ - id (PK)       │
│ - email         │       │ - user_id (FK)   │       │ - user_id (FK)  │
│ - password_hash │       │ - settings       │       │ - token         │
│ - created_at    │       │ - updated_at     │       │ - expires_at    │
│ - updated_at    │       └──────────────────┘       │ - created_at    │
│ - last_login    │                               │ - last_used     │
│ - is_active     │                               └─────────────────┘
└─────────────────┘
         │
         │ 1
         │
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│  UserProviders  │───────│ OAuthTokens      │───────│ TokenRefreshLog │
│                 │ 1   N │                  │ 1   N │                 │
│ - id (PK)       │       │ - id (PK)        │       │ - id (PK)       │
│ - user_id (FK)  │       │ - user_provider_id│      │ - token_id (FK) │
│ - provider      │       │ (FK)             │       │ - old_token     │
│ - provider_id   │       │ - access_token   │       │ - new_token     │
│ - display_name  │       │ - refresh_token  │       │ - refresh_used  │
│ - avatar_url    │       │ - expires_at     │       │ - created_at    │
│ - created_at    │       │ - token_type     │       │ - success       │
│ - updated_at    │       │ - scope          │       │ - error_message │
│ - is_active     │       │ - created_at     │       └─────────────────┘
│ - sync_status   │       │ - updated_at     │
└─────────────────┘       │ - is_active      │
         │               │ - last_used      │
         │ 1             │ - metadata       │
         │               └──────────────────┘
         │
┌─────────────────┐       ┌──────────────────┐       ┌─────────────────┐
│ AuthAuditLog    │───────│  SyncLogs        │───────│  ServiceConfigs │
│                 │ 1   N │                  │ 1   1 │                 │
│ - id (PK)       │       │ - id (PK)        │       │ - id (PK)       │
│ - user_id (FK)  │       │ - user_provider_ │       │ - service_name  │
│ - action        │       │   id (FK)        │       │ - client_id     │
│ - provider      │       │ - action_type    │       │ - scopes        │
│ - ip_address    │       │ - status         │       │ - redirect_uri  │
│ - user_agent    │       │ - data_size      │       │ - auth_url      │
│ - timestamp     │       │ - duration_ms    │       │ - token_url     │
│ - success       │       │ - error_message  │       │ - created_at    │
│ - error_message │       │ - timestamp      │       │ - updated_at    │
└─────────────────┘       └──────────────────┘       │ - is_active     │
                                                   │ - settings      │
                                                   └─────────────────┘
```

## Table Definitions

### 1. Users Table
Stores core user account information.

### 2. UserPreferences Table
User-specific settings and preferences.

### 3. UserSessions Table
Active user sessions for session management.

### 4. UserProviders Table
Links users to OAuth providers (Google, Motion).

### 5. OAuthTokens Table
Stores encrypted OAuth tokens for each provider connection.

### 6. TokenRefreshLog Table
Tracks token refresh history for audit and debugging.

### 7. AuthAuditLog Table
Comprehensive audit trail for all authentication events.

### 8. SyncLogs Table
Tracks synchronization activities and performance.

### 9. ServiceConfigs Table
Configuration for supported OAuth providers.

## Security Features

- **Token Encryption**: All OAuth tokens encrypted at rest
- **Audit Trail**: Complete logging of authentication events
- **Session Management**: Secure session tokens with expiration
- **Access Control**: Role-based permissions where applicable
- **Data Integrity**: Foreign key constraints and proper normalization

## Performance Considerations

- **Indexing Strategy**: Optimized indexes for common queries
- **Connection Pooling**: Database connection pooling for scalability
- **Caching**: Frequently accessed data cached appropriately
- **Pagination**: Large datasets properly paginated

## Migration Strategy

- **Version Control**: All schema changes versioned
- **Rollback Support**: Migration rollback capabilities
- **Data Preservation**: Backward compatibility during migrations
- **Testing**: Comprehensive testing of migration scripts

## Backup and Recovery

- **Regular Backups**: Automated backup scheduling
- **Point-in-time Recovery**: Ability to restore to specific time
- **Redundancy**: Multi-region backup storage
- **Disaster Recovery**: Clear recovery procedures documented