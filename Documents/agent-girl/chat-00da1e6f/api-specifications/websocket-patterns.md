# WebSocket Patterns for Real-time Data Synchronization

## Overview

This document outlines the WebSocket implementation patterns for real-time data synchronization in the Assistant Hub application. The WebSocket layer provides live updates for all modules and handles conflict resolution.

## Connection Architecture

### Connection Establishment

```javascript
// Client-side WebSocket connection
const ws = new WebSocket('wss://api.assistant-hub.com/v1/ws/realtime', [
  'jwt', // Authentication protocol
  'v1'   // API version
]);

// Authentication token sent as subprotocol
ws.onopen = function(event) {
  console.log('WebSocket connection established');

  // Send authentication message
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'jwt_token_here',
    userId: 'user_id_here'
  }));
};
```

### Message Protocol

All WebSocket messages follow this structure:

```typescript
interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: string;
  requestId?: string;
  correlationId?: string;
}
```

## Real-time Data Patterns

### 1. Dashboard Updates

```typescript
// Dashboard metrics update
interface DashboardUpdateMessage extends WebSocketMessage {
  type: 'dashboard:update';
  payload: {
    module: 'tasks' | 'calendar' | 'email' | 'journal' | 'contacts';
    metric: string;
    value: any;
    change: {
      previous: any;
      current: any;
      delta: number;
    };
  };
}

// Example message
{
  "type": "dashboard:update",
  "payload": {
    "module": "tasks",
    "metric": "completed",
    "value": 24,
    "change": {
      "previous": 23,
      "current": 24,
      "delta": 1
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 2. Task Synchronization

```typescript
// Task created/updated/deleted
interface TaskUpdateMessage extends WebSocketMessage {
  type: 'task:update';
  payload: {
    action: 'created' | 'updated' | 'deleted';
    task: Task;
    source: 'internal' | 'motion' | 'manual';
    conflict?: SyncConflict;
  };
}

// Bulk task sync
interface TaskSyncMessage extends WebSocketMessage {
  type: 'task:sync';
  payload: {
    syncId: string;
    status: 'started' | 'progress' | 'completed' | 'error';
    progress: number;
    processed: number;
    total: number;
    errors?: string[];
  };
}
```

### 3. Calendar Event Updates

```typescript
// Calendar event change
interface CalendarUpdateMessage extends WebSocketMessage {
  type: 'calendar:update';
  payload: {
    action: 'created' | 'updated' | 'deleted';
    event: CalendarEvent;
    source: 'internal' | 'google';
    attendees?: Attendee[];
  };
}

// Reminder notification
interface CalendarReminderMessage extends WebSocketMessage {
  type: 'calendar:reminder';
  payload: {
    eventId: string;
    title: string;
    startTime: string;
    reminderType: 'email' | 'popup';
    minutesBefore: number;
  };
}
```

### 4. Email Notifications

```typescript
// New email received
interface EmailNotificationMessage extends WebSocketMessage {
  type: 'email:new';
  payload: {
    message: EmailMessage;
    folder: string;
    importance: 'low' | 'normal' | 'high';
  };
}

// Email status change
interface EmailStatusMessage extends WebSocketMessage {
  type: 'email:status';
  payload: {
    messageId: string;
    status: 'read' | 'unread' | 'starred' | 'unstarred';
    changedBy: string;
  };
}
```

### 5. Contact Updates

```typescript
// Contact change notification
interface ContactUpdateMessage extends WebSocketMessage {
  type: 'contact:update';
  payload: {
    action: 'created' | 'updated' | 'deleted';
    contact: Contact;
    source: 'internal' | 'google';
    mergeConflict?: boolean;
  };
}
```

## Caching Strategies

### 1. Multi-level Cache Architecture

```typescript
interface CacheConfig {
  levels: {
    memory: {
      ttl: number;        // 5 minutes
      maxSize: number;    // 1000 items
      evictionPolicy: 'LRU' | 'FIFO';
    };
    redis: {
      ttl: number;        // 1 hour
      keyPrefix: string;
      compression: boolean;
    };
    database: {
      ttl: number;        // 24 hours
      indexedFields: string[];
    };
  };
}
```

### 2. Cache Invalidation Patterns

```typescript
// Cache invalidation message
interface CacheInvalidationMessage extends WebSocketMessage {
  type: 'cache:invalidate';
  payload: {
    keys: string[];
    pattern?: string;    // For pattern-based invalidation
    cascade: boolean;    // Invalidate dependent caches
  };
}

// Cache warming message
interface CacheWarmMessage extends WebSocketMessage {
  type: 'cache:warm';
  payload: {
    module: string;
    userId: string;
    dataTypes: string[];
  };
}
```

### 3. Cache Update Strategies

```typescript
// Write-through cache update
interface CacheUpdateMessage extends WebSocketMessage {
  type: 'cache:update';
  payload: {
    key: string;
    value: any;
    operation: 'set' | 'delete' | 'increment';
    ttl?: number;
    distribute: boolean; // Send to other instances
  };
}

// Cache synchronization
interface CacheSyncMessage extends WebSocketMessage {
  type: 'cache:sync';
  payload: {
    nodeId: string;
    checksums: Record<string, string>;
    requestSync: string[];
  };
}
```

## Conflict Resolution

### 1. Version Control System

```typescript
interface VersionedData {
  id: string;
  version: number;
  data: any;
  metadata: {
    createdAt: string;
    updatedAt: string;
    updatedBy: string;
    source: string;
  };
  conflictResolution?: {
    strategy: 'last-write-wins' | 'merge' | 'manual';
    resolvedAt?: string;
    resolvedBy?: string;
  };
}
```

### 2. Conflict Detection

```typescript
// Conflict detection message
interface ConflictDetectionMessage extends WebSocketMessage {
  type: 'conflict:detect';
  payload: {
    entityType: 'task' | 'event' | 'contact' | 'journal';
    entityId: string;
    versions: {
      local: VersionedData;
      remote: VersionedData;
      external?: VersionedData;
    };
    conflictType: 'version' | 'data' | 'schema';
  };
}
```

### 3. Conflict Resolution Strategies

```typescript
// Auto-merge conflict resolution
interface ConflictAutoMergeMessage extends WebSocketMessage {
  type: 'conflict:auto-merge';
  payload: {
    conflictId: string;
    strategy: 'field-level' | 'timestamp' | 'priority';
    result: {
      merged: VersionedData;
      rejected: VersionedData[];
      accepted: VersionedData[];
    };
  };
}

// Manual conflict resolution request
interface ConflictManualResolutionMessage extends WebSocketMessage {
  type: 'conflict:manual-resolution';
  payload: {
    conflictId: string;
    options: VersionedData[];
    ui: {
      title: string;
      description: string;
      fields: string[];
    };
  };
}
```

## Performance Optimization

### 1. Message Batching

```typescript
// Batch update message
interface BatchUpdateMessage extends WebSocketMessage {
  type: 'batch:update';
  payload: {
    batchId: string;
    updates: WebSocketMessage[];
    compression: 'gzip' | 'brotli';
    totalSize: number;
  };
}
```

### 2. Subscription Management

```typescript
// Subscribe to data updates
interface SubscribeMessage extends WebSocketMessage {
  type: 'subscribe';
  payload: {
    resources: string[];
    filters: Record<string, any>;
    throttle: number; // ms between updates
  };
}

// Unsubscribe from updates
interface UnsubscribeMessage extends WebSocketMessage {
  type: 'unsubscribe';
  payload: {
    resources: string[];
  };
}
```

### 3. Connection Health Monitoring

```typescript
// Ping/pong for connection health
interface PingMessage extends WebSocketMessage {
  type: 'ping';
  payload: {
    timestamp: string;
    sequenceNumber: number;
  };
}

interface PongMessage extends WebSocketMessage {
  type: 'pong';
  payload: {
    timestamp: string;
    sequenceNumber: number;
    latency: number;
  };
}

// Connection status update
interface ConnectionStatusMessage extends WebSocketMessage {
  type: 'connection:status';
  payload: {
    status: 'connected' | 'disconnected' | 'reconnecting';
    reason?: string;
    reconnectAttempts: number;
    nextReconnectIn: number;
  };
}
```

## Security Considerations

### 1. Authentication & Authorization

```typescript
// Authentication challenge
interface AuthChallengeMessage extends WebSocketMessage {
  type: 'auth:challenge';
  payload: {
    nonce: string;
    timestamp: string;
    expiresAt: string;
  };
}

// Authorization check
interface AuthzCheckMessage extends WebSocketMessage {
  type: 'authz:check';
  payload: {
    resource: string;
    action: string;
    context: Record<string, any>;
  };
}
```

### 2. Rate Limiting

```typescript
// Rate limit notification
interface RateLimitMessage extends WebSocketMessage {
  type: 'rate-limit';
  payload: {
    limit: number;
    remaining: number;
    resetAt: string;
    window: string;
  };
}
```

## Error Handling

### 1. Error Message Structure

```typescript
interface ErrorMessage extends WebSocketMessage {
  type: 'error';
  payload: {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
    retryAfter?: number;
  };
}
```

### 2. Recovery Strategies

```typescript
// Recovery request
interface RecoveryMessage extends WebSocketMessage {
  type: 'recovery:request';
  payload: {
    lastSequenceNumber: number;
    missingRanges: Array<{
      start: number;
      end: number;
    }>;
  };
}

// Recovery response
interface RecoveryResponseMessage extends WebSocketMessage {
  type: 'recovery:response';
  payload: {
    sequenceNumber: number;
    data: any;
    isComplete: boolean;
  };
}
```

## Implementation Example

### Server-side WebSocket Handler

```typescript
class AssistantHubWebSocketServer {
  private connections: Map<string, WebSocket> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private messageQueue: Map<string, WebSocketMessage[]> = new Map();

  async handleConnection(ws: WebSocket, req: Request) {
    const userId = await this.authenticateUser(req);
    const connectionId = this.generateConnectionId();

    this.connections.set(connectionId, ws);

    ws.on('message', async (data) => {
      const message: WebSocketMessage = JSON.parse(data.toString());
      await this.handleMessage(connectionId, message);
    });

    ws.on('close', () => {
      this.handleDisconnection(connectionId);
    });

    // Send initial connection message
    this.sendMessage(connectionId, {
      type: 'connection:established',
      payload: { connectionId, userId },
      timestamp: new Date().toISOString()
    });
  }

  private async handleMessage(connectionId: string, message: WebSocketMessage) {
    switch (message.type) {
      case 'subscribe':
        await this.handleSubscription(connectionId, message);
        break;
      case 'ping':
        this.handlePing(connectionId, message);
        break;
      // ... other message types
    }
  }

  private broadcastToModule(module: string, message: WebSocketMessage) {
    const subscribers = this.subscriptions.get(module) || new Set();
    subscribers.forEach(connectionId => {
      this.sendMessage(connectionId, message);
    });
  }
}
```

### Client-side WebSocket Manager

```typescript
class AssistantHubWebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private messageQueue: WebSocketMessage[] = [];
  private subscriptions: Set<string> = new Set();

  connect(token: string) {
    this.ws = new WebSocket('wss://api.assistant-hub.com/v1/ws/realtime');

    this.ws.onopen = () => {
      this.authenticate(token);
      this.flushMessageQueue();
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.handleMessage(message);
    };

    this.ws.onclose = () => {
      this.handleReconnect();
    };
  }

  subscribe(resources: string[]) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendMessage({
        type: 'subscribe',
        payload: { resources },
        timestamp: new Date().toISOString()
      });
    }

    resources.forEach(resource => this.subscriptions.add(resource));
  }

  private handleMessage(message: WebSocketMessage) {
    switch (message.type) {
      case 'dashboard:update':
        this.emit('dashboardUpdate', message.payload);
        break;
      case 'task:update':
        this.emit('taskUpdate', message.payload);
        break;
      // ... other message types
    }
  }
}
```