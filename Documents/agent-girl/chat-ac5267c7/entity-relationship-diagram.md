# Entity Relationship Diagram (ERD)

## Overview

This document provides a detailed visual representation of the OAuth authentication database schema with relationships, cardinalities, and constraints.

## Complete ERD Diagram

```mermaid
erDiagram
    users {
        text id PK "UUID"
        text email UK "Email address"
        text password_hash "Hashed password"
        boolean email_verified "Email verification status"
        timestamp created_at "Account creation time"
        timestamp updated_at "Last update time"
        timestamp last_login "Last login time"
        boolean is_active "Account status"
        boolean two_factor_enabled "2FA status"
        text phone_number "Phone number"
        text timezone "User timezone"
        text language "Preferred language"
    }

    user_preferences {
        text id PK "UUID"
        text user_id FK "User ID"
        text settings "JSON settings"
        boolean notifications_enabled "Notification preferences"
        boolean auto_sync_enabled "Auto-sync status"
        integer sync_interval_minutes "Sync frequency"
        text theme "UI theme"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update time"
    }

    user_sessions {
        text id PK "UUID"
        text user_id FK "User ID"
        text session_token UK "Session token"
        text refresh_token "Refresh token"
        text ip_address "IP address"
        text user_agent "Browser/Client info"
        timestamp created_at "Session start"
        timestamp expires_at "Session expiry"
        timestamp last_used "Last activity"
        boolean is_active "Session status"
        text device_info "Device details (JSON)"
    }

    service_configs {
        text id PK "UUID"
        text service_name UK "Service identifier"
        text display_name "Display name"
        text client_id "OAuth client ID"
        text client_secret_encrypted "Encrypted secret"
        text scopes "OAuth scopes (JSON)"
        text redirect_uri "Callback URL"
        text auth_url "Authorization endpoint"
        text token_url "Token endpoint"
        text refresh_url "Refresh endpoint"
        text revoke_url "Revoke endpoint"
        text userinfo_url "User info endpoint"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update"
        boolean is_active "Service status"
        text settings "Service-specific settings"
        integer rate_limit_per_hour "Rate limit"
    }

    user_providers {
        text id PK "UUID"
        text user_id FK "User ID"
        text provider FK "Provider name"
        text provider_id "Provider user ID"
        text display_name "Display name"
        text avatar_url "Profile picture"
        text email "Provider email"
        timestamp created_at "Connection time"
        timestamp updated_at "Last update"
        boolean is_active "Connection status"
        text sync_status "Sync status"
        timestamp last_sync_at "Last sync time"
        text sync_error "Sync error message"
        text access_level "Permission level"
    }

    oauth_tokens {
        text id PK "UUID"
        text user_provider_id FK "User provider ID"
        text access_token_encrypted "Encrypted access token"
        text refresh_token_encrypted "Encrypted refresh token"
        text token_type "Token type"
        timestamp expires_at "Token expiry"
        text scope "Token scopes"
        timestamp created_at "Creation time"
        timestamp updated_at "Last update"
        boolean is_active "Token status"
        timestamp last_used "Last usage"
        integer usage_count "Usage counter"
        text metadata "Additional data (JSON)"
    }

    token_refresh_log {
        text id PK "UUID"
        text token_id FK "Token ID"
        text old_access_token_encrypted "Old token"
        text new_access_token_encrypted "New token"
        text refresh_token_encrypted "Refresh token used"
        boolean refresh_used "Refresh usage flag"
        timestamp created_at "Refresh time"
        boolean success "Success status"
        text error_message "Error details"
        text error_code "Error code"
        integer duration_ms "Process duration"
        text ip_address "Request IP"
    }

    auth_audit_log {
        text id PK "UUID"
        text user_id FK "User ID"
        text provider "Provider name"
        text action "Action type"
        text ip_address "IP address"
        text user_agent "Browser/Client"
        timestamp timestamp "Event time"
        boolean success "Success status"
        text error_message "Error details"
        text error_code "Error code"
        text session_id "Session identifier"
        text additional_data "Extra data (JSON)"
    }

    sync_logs {
        text id PK "UUID"
        text user_provider_id FK "User provider ID"
        text action_type "Sync type"
        text status "Sync status"
        integer data_size "Data volume"
        integer items_processed "Items synced"
        integer items_total "Total items"
        integer duration_ms "Duration"
        text error_message "Error details"
        text error_code "Error code"
        timestamp timestamp "Sync time"
        timestamp started_at "Start time"
        timestamp completed_at "End time"
        text metadata "Sync metadata"
    }

    rate_limits {
        text id PK "UUID"
        text user_provider_id FK "User provider ID"
        text endpoint "API endpoint"
        timestamp window_start "Rate limit window"
        integer request_count "Request count"
        integer limit "Rate limit"
        timestamp reset_at "Reset time"
        timestamp created_at "Creation time"
    }

    %% Relationships with cardinalities
    users ||--o{ user_sessions : "has"
    users ||--|| user_preferences : "has"
    users ||--o{ user_providers : "connects to"
    users ||--o{ auth_audit_log : "audits"

    service_configs ||--o{ user_providers : "enables"

    user_providers ||--|| oauth_tokens : "stores"
    user_providers ||--o{ sync_logs : "performs"
    user_providers ||--o{ rate_limits : "tracks"

    oauth_tokens ||--o{ token_refresh_log : "logs"

    %% Unique constraints
    users {
        UK email
    }

    user_sessions {
        UK session_token
    }

    service_configs {
        UK service_name
    }

    user_providers {
        UK user_id, provider, provider_id
    }

    oauth_tokens {
        UK user_provider_id
    }

    rate_limits {
        UK user_provider_id, endpoint, window_start
    }
```

## Relationship Details

### 1. User Relationships

**users → user_sessions** (1:N)
- One user can have multiple active sessions
- Supports concurrent login from multiple devices
- Sessions are managed independently with expiration

**users → user_preferences** (1:1)
- Each user has exactly one preference record
- Stores user-specific settings and configurations
- Created automatically with user account

**users → user_providers** (1:N)
- One user can connect to multiple OAuth providers
- Supports multiple Google services (Gmail, Calendar, Contacts)
- Each connection is tracked separately

**users → auth_audit_log** (1:N)
- Complete audit trail of all authentication activities
- Helps in security monitoring and compliance
- Records both successful and failed attempts

### 2. Provider Relationships

**service_configs → user_providers** (1:N)
- Service configuration for each OAuth provider
- Centralized management of OAuth settings
- Enables easy addition of new providers

**user_providers → oauth_tokens** (1:1)
- Each provider connection has exactly one token set
- Tokens are encrypted for security
- Supports token refresh and rotation

**user_providers → sync_logs** (1:N)
- Comprehensive logging of synchronization activities
- Performance monitoring and debugging
- Tracks sync errors and success rates

**user_providers → rate_limits** (1:N)
- API rate limiting per provider and endpoint
- Prevents API quota exhaustion
- Sliding window rate limit tracking

### 3. Token Management

**oauth_tokens → token_refresh_log** (1:N)
- Complete history of token refresh operations
- Helps in debugging token expiration issues
- Tracks refresh token usage patterns

## Data Flow Patterns

### Authentication Flow
1. User initiates OAuth with provider
2. `auth_audit_log` records the attempt
3. `user_providers` creates/updates connection
4. `oauth_tokens` stores encrypted credentials
5. `user_sessions` creates user session

### Token Refresh Flow
1. System detects expiring token
2. `oauth_tokens` record is updated
3. `token_refresh_log` records the operation
4. `auth_audit_log` logs the refresh event

### Synchronization Flow
1. User requests sync or auto-sync triggers
2. `rate_limits` checked for API availability
3. `sync_logs` creates sync record
4. Data synchronized with provider
5. `sync_logs` updates with results

## Security Considerations

### Encryption Requirements
- `oauth_tokens.access_token_encrypted`
- `oauth_tokens.refresh_token_encrypted`
- `service_configs.client_secret_encrypted`
- `token_refresh_log` token fields

### Audit Trail
- All authentication events logged in `auth_audit_log`
- Token refresh activities tracked in `token_refresh_log`
- Synchronization activities logged in `sync_logs`

### Access Control
- Session-based authentication via `user_sessions`
- Provider-specific permissions in `user_providers.access_level`
- Time-based session expiration and refresh

## Index Strategy

### Primary Indexes
- All primary key fields indexed automatically
- Unique constraints on business keys

### Performance Indexes
- Foreign key relationships indexed
- Timestamp fields for time-based queries
- Status fields for filtering active records

### Composite Indexes
- `(user_id, provider, provider_id)` for user provider lookups
- `(user_provider_id, endpoint, window_start)` for rate limiting
- `(timestamp, action, user_id)` for audit log queries

## Normalization Level

The schema follows Third Normal Form (3NF):
- **1NF**: All attributes atomic, no repeating groups
- **2NF**: No partial dependencies on composite keys
- **3NF**: No transitive dependencies

This ensures data integrity while maintaining query performance through proper indexing.