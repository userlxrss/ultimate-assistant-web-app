# Data Synchronization Strategy for Assistant Hub

## Executive Summary

This document outlines a comprehensive data synchronization strategy for integrating external services (Google APIs, Motion API) with the Assistant Hub application. The strategy focuses on reliability, performance, conflict resolution, and data integrity.

## 1. Synchronization Architecture

### 1.1 High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │◄──►│  Sync Service   │◄──►│  External APIs  │
│                 │    │                 │    │                 │
│ • Dashboard     │    │ • Queue Manager │    │ • Google        │
│ • Journal       │    │ • Rate Limiter  │    │   - Calendar    │
│ • Tasks         │    │ • Conflict Mgr  │    │   - Gmail       │
│ • Calendar      │    │ • Error Handler │    │   - Contacts    │
│ • Email         │    │ • Scheduler     │    │ • Motion        │
│ • Contacts      │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Local Cache   │    │  Message Queue  │    │   Webhook      │
│                 │    │                 │    │   Processor    │
│ • Redis Cache   │    │ • Redis Streams │    │ • Real-time    │
│ • Session Data  │    │ • Background    │    │   Updates      │
│ • Temp Storage  │    │   Workers       │    │ • Validation   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.2 Sync Service Components

```python
# Sync Service Architecture
class SyncService:
    def __init__(self):
        self.queue_manager = QueueManager()
        self.rate_limiter = RateLimiter()
        self.conflict_manager = ConflictManager()
        self.error_handler = ErrorHandler()
        self.scheduler = TaskScheduler()
        self.webhook_processor = WebhookProcessor()

        # External API clients
        self.google_client = GoogleAPIClient()
        self.motion_client = MotionAPIClient()

        # Local storage
        self.cache = RedisCache()
        self.db = DatabaseManager()

class SyncOrchestrator:
    """Coordinates synchronization across all services"""

    def __init__(self):
        self.services = {
            'google_calendar': GoogleCalendarSync(),
            'google_contacts': GoogleContactsSync(),
            'google_gmail': GmailSync(),
            'motion_tasks': MotionTasksSync()
        }

        self.sync_queue = RedisQueue('sync_queue')
        self.priority_queue = RedisQueue('priority_queue')

    async def orchestrate_sync(self, user_id: str, services: List[str] = None):
        """Orchestrate synchronization for specified services"""
        if services is None:
            services = list(self.services.keys())

        # Add sync tasks to queue
        for service in services:
            await self.sync_queue.enqueue({
                'user_id': user_id,
                'service': service,
                'sync_type': 'full_sync',
                'priority': 'normal',
                'created_at': datetime.utcnow()
            })

    async def process_webhook(self, webhook_data: dict):
        """Process incoming webhook from external services"""
        service = webhook_data.get('service')
        if service in self.services:
            await self.priority_queue.enqueue({
                'user_id': webhook_data.get('user_id'),
                'service': service,
                'sync_type': 'incremental',
                'webhook_data': webhook_data,
                'priority': 'high',
                'created_at': datetime.utcnow()
            })
```

## 2. Google Services Integration

### 2.1 Google Calendar Synchronization

```python
class GoogleCalendarSync(BaseSyncService):
    """Handles synchronization with Google Calendar API"""

    def __init__(self):
        super().__init__()
        self.api = GoogleCalendarAPI()
        self.sync_batch_size = 100

    async def full_sync(self, user_id: str):
        """Perform full calendar synchronization"""
        try:
            # Get user's Google connection
            connection = await self.get_user_connection(user_id, 'google_calendar')
            if not connection or not connection.sync_enabled:
                return

            # Get all calendars
            calendars = await self.api.list_calendars(
                access_token=connection.access_token
            )

            # Sync each calendar
            for calendar in calendars:
                await self.sync_calendar(user_id, calendar, connection)

            # Update sync status
            await self.update_sync_status(
                user_id, 'google_calendar', 'full_sync', 'completed'
            )

        except Exception as e:
            await self.handle_sync_error(user_id, 'google_calendar', str(e))

    async def sync_calendar(self, user_id: str, calendar: dict, connection):
        """Sync individual calendar"""
        calendar_id = calendar['id']

        # Get sync token for incremental sync
        sync_token = await self.get_sync_token(user_id, calendar_id)

        try:
            # Fetch events
            events = await self.api.list_events(
                calendar_id=calendar_id,
                access_token=connection.access_token,
                sync_token=sync_token,
                max_results=self.sync_batch_size
            )

            # Process events in batches
            for event_batch in self.chunk_list(events, 10):
                await self.process_event_batch(user_id, event_batch, calendar_id)

            # Update sync token
            if events.get('nextSyncToken'):
                await self.save_sync_token(
                    user_id, calendar_id, events['nextSyncToken']
                )

        except HttpError as e:
            if e.resp.status == 410:  # Sync token expired
                # Perform full sync for this calendar
                await self.full_calendar_sync(user_id, calendar, connection)
            else:
                raise

    async def process_event_batch(self, user_id: str, events: List[dict], calendar_id: str):
        """Process a batch of calendar events"""
        async with self.db.transaction() as tx:
            for event in events:
                await self.sync_single_event(tx, user_id, event, calendar_id)

    async def sync_single_event(self, tx, user_id: str, event: dict, calendar_id: str):
        """Sync single calendar event"""
        google_event_id = event['id']

        # Check if event exists
        existing_event = await tx.fetch_one(
            "SELECT * FROM calendar_events WHERE user_id = $1 AND google_event_id = $2",
            user_id, google_event_id
        )

        if event['status'] == 'cancelled':
            # Delete cancelled event
            if existing_event:
                await tx.execute(
                    "DELETE FROM calendar_events WHERE id = $1",
                    existing_event['id']
                )
                await self.log_activity(
                    user_id, 'calendar_event_deleted',
                    {'google_event_id': google_event_id}
                )
        else:
            # Upsert event
            event_data = self.transform_event_data(event, calendar_id)

            if existing_event:
                # Update existing event
                await tx.execute("""
                    UPDATE calendar_events SET
                        title = $1, description = $2, location = $3,
                        start_time = $4, end_time = $5, is_all_day = $6,
                        visibility = $7, status = $8, attendees = $9,
                        updated_at = NOW()
                    WHERE id = $10
                """, *event_data.values(), existing_event['id'])

                await self.log_activity(
                    user_id, 'calendar_event_updated',
                    {'google_event_id': google_event_id, 'changes': self.get_field_changes(existing_event, event_data)}
                )
            else:
                # Insert new event
                await tx.execute("""
                    INSERT INTO calendar_events (
                        user_id, google_event_id, calendar_id, title, description,
                        location, start_time, end_time, is_all_day, visibility,
                        status, attendees, external_data, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
                """, user_id, google_event_id, calendar_id, *event_data.values(), json.dumps(event))

                await self.log_activity(
                    user_id, 'calendar_event_created',
                    {'google_event_id': google_event_id}
                )

    def transform_event_data(self, event: dict, calendar_id: str) -> dict:
        """Transform Google Calendar event to database format"""
        start = event.get('start', {})
        end = event.get('end', {})

        return {
            'title': event.get('summary', ''),
            'description': event.get('description', ''),
            'location': event.get('location', ''),
            'start_time': self.parse_datetime(start.get('dateTime', start.get('date'))),
            'end_time': self.parse_datetime(end.get('dateTime', end.get('date'))),
            'is_all_day': 'date' in start,
            'visibility': event.get('visibility', 'default'),
            'status': event.get('status', 'confirmed'),
            'attendees': json.dumps(event.get('attendees', []))
        }
```

### 2.2 Gmail Synchronization

```python
class GmailSync(BaseSyncService):
    """Handles synchronization with Gmail API"""

    def __init__(self):
        super().__init__()
        self.api = GmailAPI()
        self.message_batch_size = 50

    async def full_sync(self, user_id: str):
        """Perform full Gmail synchronization"""
        connection = await self.get_user_connection(user_id, 'google_gmail')
        if not connection or not connection.sync_enabled:
            return

        try:
            # Sync labels first
            await self.sync_labels(user_id, connection)

            # Get message history ID
            history_id = await self.get_history_id(user_id)

            # Sync messages
            await self.sync_messages(user_id, connection, history_id)

            # Update sync status
            await self.update_sync_status(
                user_id, 'google_gmail', 'full_sync', 'completed'
            )

        except Exception as e:
            await self.handle_sync_error(user_id, 'google_gmail', str(e))

    async def sync_messages(self, user_id: str, connection, history_id: str = None):
        """Sync Gmail messages using history API"""
        try:
            if history_id:
                # Incremental sync using history
                histories = await self.api.list_history(
                    access_token=connection.access_token,
                    history_id=history_id
                )

                for history in histories:
                    await self.process_history_changes(user_id, history)

            else:
                # Full sync - get recent messages
                messages = await self.api.list_messages(
                    access_token=connection.access_token,
                    max_results=1000  # Start with recent 1000 messages
                )

                # Process messages in batches
                for message_batch in self.chunk_list(messages, self.message_batch_size):
                    await self.process_message_batch(user_id, message_batch, connection)

        except HttpError as e:
            if e.resp.status == 404:  # History ID not found
                # Perform full sync
                await self.full_message_sync(user_id, connection)

    async def process_message_batch(self, user_id: str, message_ids: List[str], connection):
        """Process a batch of Gmail messages"""
        # Fetch full message details
        messages = await self.api.get_messages(
            access_token=connection.access_token,
            message_ids=message_ids
        )

        async with self.db.transaction() as tx:
            for message in messages:
                await self.sync_single_message(tx, user_id, message)

    async def sync_single_message(self, tx, user_id: str, message: dict):
        """Sync single Gmail message"""
        message_id = message['id']
        thread_id = message['threadId']

        # Find or create thread
        thread = await self.find_or_create_thread(tx, user_id, thread_id, message)

        # Check if message exists
        existing_message = await tx.fetch_one(
            "SELECT * FROM email_messages WHERE user_id = $1 AND gmail_message_id = $2",
            user_id, message_id
        )

        if not existing_message:
            # Insert new message
            message_data = self.transform_message_data(message, thread['id'])

            await tx.execute("""
                INSERT INTO email_messages (
                    thread_id, user_id, gmail_message_id, from_email, to_emails,
                    cc_emails, subject, body_text, body_html, attachments,
                    sent_at, received_at, is_read, is_draft, is_sent, external_data
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            """, *message_data.values(), json.dumps(message))

            # Update thread information
            await self.update_thread_info(tx, thread['id'], message)

            # Create search index entry
            await self.create_search_index_entry(tx, message_id, message)

            await self.log_activity(
                user_id, 'email_message_synced',
                {'gmail_message_id': message_id, 'thread_id': thread_id}
            )

    def transform_message_data(self, message: dict, thread_id: str) -> dict:
        """Transform Gmail message to database format"""
        headers = {h['name']: h['value'] for h in message.get('payload', {}).get('headers', [])}

        return {
            'thread_id': thread_id,
            'from_email': headers.get('From', ''),
            'to_emails': self.parse_email_addresses(headers.get('To', '')),
            'cc_emails': self.parse_email_addresses(headers.get('Cc', '')),
            'subject': headers.get('Subject', ''),
            'body_text': self.extract_message_body(message, 'text/plain'),
            'body_html': self.extract_message_body(message, 'text/html'),
            'attachments': json.dumps(self.extract_attachments(message)),
            'sent_at': self.parse_timestamp(message.get('internalDate')),
            'received_at': self.parse_timestamp(message.get('internalDate')),
            'is_read': 'UNREAD' not in message.get('labelIds', []),
            'is_draft': 'DRAFT' in message.get('labelIds', []),
            'is_sent': 'SENT' in message.get('labelIds', [])
        }
```

### 2.3 Google Contacts Synchronization

```python
class GoogleContactsSync(BaseSyncService):
    """Handles synchronization with Google Contacts API"""

    def __init__(self):
        super().__init__()
        self.api = GoogleContactsAPI()
        self.contact_batch_size = 50

    async def full_sync(self, user_id: str):
        """Perform full contacts synchronization"""
        connection = await self.get_user_connection(user_id, 'google_contacts')
        if not connection or not connection.sync_enabled:
            return

        try:
            # Get sync token for incremental sync
            sync_token = await self.get_sync_token(user_id, 'contacts')

            if sync_token:
                await self.incremental_sync(user_id, connection, sync_token)
            else:
                await self.full_contacts_sync(user_id, connection)

            # Update sync status
            await self.update_sync_status(
                user_id, 'google_contacts', 'full_sync', 'completed'
            )

        except Exception as e:
            await self.handle_sync_error(user_id, 'google_contacts', str(e))

    async def incremental_sync(self, user_id: str, connection, sync_token: str):
        """Perform incremental contacts sync"""
        try:
            contacts = await self.api.list_contacts(
                access_token=connection.access_token,
                sync_token=sync_token,
                page_size=self.contact_batch_size
            )

            # Process contacts
            await self.process_contact_batch(user_id, contacts)

            # Update sync token
            if contacts.get('nextSyncToken'):
                await self.save_sync_token(
                    user_id, 'contacts', contacts['nextSyncToken']
                )

        except HttpError as e:
            if e.resp.status == 410:  # Sync token expired
                await self.full_contacts_sync(user_id, connection)

    async def process_contact_batch(self, user_id: str, contacts: List[dict]):
        """Process a batch of contacts"""
        async with self.db.transaction() as tx:
            for contact in contacts:
                await self.sync_single_contact(tx, user_id, contact)

    async def sync_single_contact(self, tx, user_id: str, contact: dict):
        """Sync single Google contact"""
        resource_name = contact.get('resourceName', '')
        google_contact_id = resource_name.split('/').pop() if '/' in resource_name else resource_name

        # Check if contact exists
        existing_contact = await tx.fetch_one(
            "SELECT * FROM contacts WHERE user_id = $1 AND google_contact_id = $2",
            user_id, google_contact_id
        )

        if contact.get('deleted'):
            # Delete deleted contact
            if existing_contact:
                await self.delete_contact_data(tx, existing_contact['id'])
                await self.log_activity(
                    user_id, 'contact_deleted',
                    {'google_contact_id': google_contact_id}
                )
        else:
            # Upsert contact
            contact_data = self.transform_contact_data(contact, google_contact_id)

            if existing_contact:
                # Update existing contact
                await tx.execute("""
                    UPDATE contacts SET
                        first_name = $1, last_name = $2, display_name = $3,
                        company = $4, job_title = $5, notes = $6,
                        birthday = $7, tags = $8, custom_fields = $9,
                        external_data = $10, updated_at = NOW()
                    WHERE id = $11
                """, *contact_data.values(), json.dumps(contact), existing_contact['id'])

                # Update contact details
                await self.sync_contact_details(tx, existing_contact['id'], contact)

            else:
                # Insert new contact
                contact_id = await tx.fetch_val("""
                    INSERT INTO contacts (
                        user_id, google_contact_id, first_name, last_name,
                        display_name, company, job_title, notes, birthday,
                        tags, custom_fields, external_data, created_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
                    RETURNING id
                """, user_id, google_contact_id, *contact_data.values(), json.dumps(contact))

                # Insert contact details
                await self.sync_contact_details(tx, contact_id, contact)

                await self.log_activity(
                    user_id, 'contact_created',
                    {'google_contact_id': google_contact_id}
                )

    async def sync_contact_details(self, tx, contact_id: str, contact: dict):
        """Sync contact emails, phones, and addresses"""
        # Delete existing details
        await tx.execute("DELETE FROM contact_emails WHERE contact_id = $1", contact_id)
        await tx.execute("DELETE FROM contact_phones WHERE contact_id = $1", contact_id)
        await tx.execute("DELETE FROM contact_addresses WHERE contact_id = $1", contact_id)

        # Insert emails
        for email in contact.get('emailAddresses', []):
            await tx.execute("""
                INSERT INTO contact_emails (contact_id, email, type, is_primary)
                VALUES ($1, $2, $3, $4)
            """, contact_id, email.get('value', ''), email.get('type', 'other'),
               email.get('metadata', {}).get('primary', False))

        # Insert phone numbers
        for phone in contact.get('phoneNumbers', []):
            await tx.execute("""
                INSERT INTO contact_phones (contact_id, phone_number, type, is_primary)
                VALUES ($1, $2, $3, $4)
            """, contact_id, phone.get('value', ''), phone.get('type', 'other'),
               phone.get('metadata', {}).get('primary', False))

        # Insert addresses
        for address in contact.get('addresses', []):
            await tx.execute("""
                INSERT INTO contact_addresses (
                    contact_id, street_address, city, state, postal_code, country, type, is_primary
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            """, contact_id,
               address.get('streetAddress', ''),
               address.get('city', ''),
               address.get('region', ''),
               address.get('postalCode', ''),
               address.get('country', ''),
               address.get('type', 'other'),
               address.get('metadata', {}).get('primary', False))
```

## 3. Motion API Integration

### 3.1 Tasks Synchronization

```python
class MotionTasksSync(BaseSyncService):
    """Handles synchronization with Motion API"""

    def __init__(self):
        super().__init__()
        self.api = MotionAPIClient()
        self.task_batch_size = 100

    async def full_sync(self, user_id: str):
        """Perform full Motion tasks synchronization"""
        connection = await self.get_user_connection(user_id, 'motion_tasks')
        if not connection or not connection.sync_enabled:
            return

        try:
            # Sync projects first
            await self.sync_projects(user_id, connection)

            # Sync tasks
            await self.sync_tasks(user_id, connection)

            # Update sync status
            await self.update_sync_status(
                user_id, 'motion_tasks', 'full_sync', 'completed'
            )

        except Exception as e:
            await self.handle_sync_error(user_id, 'motion_tasks', str(e))

    async def sync_projects(self, user_id: str, connection):
        """Sync Motion projects"""
        projects = await self.api.list_projects(
            access_token=connection.access_token
        )

        async with self.db.transaction() as tx:
            for project in projects:
                await self.sync_single_project(tx, user_id, project)

    async def sync_single_project(self, tx, user_id: str, project: dict):
        """Sync single Motion project"""
        motion_project_id = str(project.get('id', ''))

        # Check if project exists
        existing_project = await tx.fetch_one(
            "SELECT * FROM task_projects WHERE user_id = $1 AND motion_project_id = $2",
            user_id, motion_project_id
        )

        project_data = self.transform_project_data(project)

        if existing_project:
            # Update existing project
            await tx.execute("""
                UPDATE task_projects SET
                    name = $1, description = $2, color = $3,
                    is_active = $4, external_data = $5, updated_at = NOW()
                WHERE id = $6
            """, *project_data.values(), json.dumps(project), existing_project['id'])
        else:
            # Insert new project
            await tx.execute("""
                INSERT INTO task_projects (
                    user_id, motion_project_id, name, description, color,
                    is_active, external_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            """, user_id, motion_project_id, *project_data.values(), json.dumps(project))

    async def sync_tasks(self, user_id: str, connection):
        """Sync Motion tasks"""
        # Get tasks with pagination
        page = 1
        while True:
            tasks_response = await self.api.list_tasks(
                access_token=connection.access_token,
                page=page,
                limit=self.task_batch_size
            )

            tasks = tasks_response.get('tasks', [])
            if not tasks:
                break

            # Process tasks in batch
            await self.process_task_batch(user_id, tasks)

            # Check if there are more pages
            if not tasks_response.get('hasMore', False):
                break

            page += 1

    async def process_task_batch(self, user_id: str, tasks: List[dict]):
        """Process a batch of Motion tasks"""
        async with self.db.transaction() as tx:
            for task in tasks:
                await self.sync_single_task(tx, user_id, task)

    async def sync_single_task(self, tx, user_id: str, task: dict):
        """Sync single Motion task"""
        motion_task_id = str(task.get('id', ''))

        # Check if task exists
        existing_task = await tx.fetch_one(
            "SELECT * FROM tasks WHERE user_id = $1 AND motion_task_id = $2",
            user_id, motion_task_id
        )

        # Find project ID
        project_id = None
        if task.get('projectId'):
            project = await tx.fetch_one(
                "SELECT id FROM task_projects WHERE user_id = $1 AND motion_project_id = $2",
                user_id, str(task['projectId'])
            )
            project_id = project['id'] if project else None

        task_data = self.transform_task_data(task, project_id)

        if existing_task:
            # Update existing task
            await tx.execute("""
                UPDATE tasks SET
                    title = $1, description = $2, status = $3, priority = $4,
                    due_date = $5, estimated_duration = $6, completion_percentage = $7,
                    tags = $8, category = $9, project_id = $10,
                    external_data = $11, updated_at = NOW()
                WHERE id = $12
            """, *task_data.values(), json.dumps(task), existing_task['id'])

            # Update completion time if task was completed
            if task_data['status'] == 'completed' and existing_task['status'] != 'completed':
                await tx.execute("""
                    UPDATE tasks SET completed_at = NOW()
                    WHERE id = $1
                """, existing_task['id'])

        else:
            # Insert new task
            await tx.execute("""
                INSERT INTO tasks (
                    user_id, motion_task_id, title, description, status, priority,
                    due_date, estimated_duration, completion_percentage, tags,
                    category, project_id, external_data, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
            """, user_id, motion_task_id, *task_data.values(), json.dumps(task))

    def transform_task_data(self, task: dict, project_id: str = None) -> dict:
        """Transform Motion task to database format"""
        return {
            'title': task.get('name', ''),
            'description': task.get('description', ''),
            'status': self.map_motion_status(task.get('status', 'ToDo')),
            'priority': self.map_motion_priority(task.get('priority', 3)),
            'due_date': self.parse_iso_datetime(task.get('dueDate')),
            'estimated_duration': task.get('duration', 0),
            'completion_percentage': task.get('progress', 0),
            'tags': task.get('labels', []),
            'category': task.get('type', 'task'),
            'project_id': project_id
        }

    def map_motion_status(self, motion_status: str) -> str:
        """Map Motion status to internal status"""
        status_mapping = {
            'ToDo': 'pending',
            'Doing': 'in_progress',
            'Done': 'completed',
            'Cancelled': 'cancelled'
        }
        return status_mapping.get(motion_status, 'pending')

    def map_motion_priority(self, motion_priority: int) -> int:
        """Map Motion priority to internal priority (1-5 scale)"""
        if motion_priority <= 1:
            return 1  # High
        elif motion_priority <= 2:
            return 2  # Medium-High
        elif motion_priority <= 3:
            return 3  # Medium
        elif motion_priority <= 4:
            return 4  # Medium-Low
        else:
            return 5  # Low
```

## 4. Conflict Resolution Strategy

### 4.1 Conflict Detection and Resolution

```python
class ConflictManager:
    """Manages data conflicts during synchronization"""

    def __init__(self):
        self.conflict_strategies = {
            'last_write_wins': self.last_write_wins,
            'manual_review': self.manual_review,
            'merge_changes': self.merge_changes,
            'preserve_local': self.preserve_local,
            'preserve_remote': self.preserve_remote
        }

    async def detect_conflicts(self, local_data: dict, remote_data: dict,
                              entity_type: str) -> List[dict]:
        """Detect conflicts between local and remote data"""
        conflicts = []

        # Define fields to check for each entity type
        conflict_fields = self.get_conflict_fields(entity_type)

        for field in conflict_fields:
            local_value = local_data.get(field)
            remote_value = remote_data.get(field)

            if self.is_conflicting(local_value, remote_value, local_data, remote_data):
                conflicts.append({
                    'field': field,
                    'local_value': local_value,
                    'remote_value': remote_value,
                    'local_modified': local_data.get('updated_at'),
                    'remote_modified': remote_data.get('updated_at')
                })

        return conflicts

    async def resolve_conflicts(self, user_id: str, conflicts: List[dict],
                               strategy: str = 'last_write_wins') -> dict:
        """Resolve conflicts using specified strategy"""
        resolver = self.conflict_strategies.get(strategy, self.last_write_wins)
        return await resolver(user_id, conflicts)

    async def last_write_wins(self, user_id: str, conflicts: List[dict]) -> dict:
        """Resolve conflicts by keeping the most recently modified data"""
        resolution = {}

        for conflict in conflicts:
            local_time = conflict.get('local_modified')
            remote_time = conflict.get('remote_modified')

            if local_time and remote_time:
                if local_time > remote_time:
                    resolution[conflict['field']] = conflict['local_value']
                    resolution['_winner'] = 'local'
                else:
                    resolution[conflict['field']] = conflict['remote_value']
                    resolution['_winner'] = 'remote'
            else:
                # Fallback to remote if timestamps are missing
                resolution[conflict['field']] = conflict['remote_value']
                resolution['_winner'] = 'remote'

        return resolution

    async def manual_review(self, user_id: str, conflicts: List[dict]) -> dict:
        """Flag conflicts for manual review"""
        # Log conflict for manual review
        for conflict in conflicts:
            await self.log_conflict(user_id, conflict)

        # Return original values (no automatic resolution)
        return {'_resolution_required': True, '_conflicts': conflicts}

    async def merge_changes(self, user_id: str, conflicts: List[dict]) -> dict:
        """Attempt to merge conflicting changes intelligently"""
        resolution = {}

        for conflict in conflicts:
            field = conflict['field']
            local_value = conflict['local_value']
            remote_value = conflict['remote_value']

            # Try to merge based on field type
            merged_value = await self.merge_field_values(
                field, local_value, remote_value
            )

            if merged_value is not None:
                resolution[field] = merged_value
                resolution['_merge_strategy'] = 'intelligent'
            else:
                # Fallback to last write wins
                resolution[field] = local_value if conflict.get('local_modified') > conflict.get('remote_modified') else remote_value
                resolution['_merge_strategy'] = 'last_write_wins'

        return resolution

    async def merge_field_values(self, field: str, local_value: any, remote_value: any) -> any:
        """Intelligently merge field values"""
        # Text fields - concatenate if different
        if isinstance(local_value, str) and isinstance(remote_value, str):
            if local_value != remote_value:
                # Try to merge intelligently
                if local_value and remote_value:
                    # Combine both values
                    return f"{local_value}\n\n[Remote update]: {remote_value}"
                else:
                    return local_value or remote_value

        # Array fields - union
        elif isinstance(local_value, list) and isinstance(remote_value, list):
            return list(set(local_value + remote_value))

        # JSON fields - deep merge
        elif isinstance(local_value, dict) and isinstance(remote_value, dict):
            return {**local_value, **remote_value}

        # Can't merge automatically
        return None

    async def log_conflict(self, user_id: str, conflict: dict):
        """Log conflict for manual review"""
        async with self.db.transaction() as tx:
            await tx.execute("""
                INSERT INTO sync_conflicts (
                    user_id, service_name, entity_type, entity_id,
                    local_data, remote_data, conflict_type, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            """,
                user_id,
                conflict.get('service_name'),
                conflict.get('entity_type'),
                conflict.get('entity_id'),
                json.dumps(conflict.get('local_data')),
                json.dumps(conflict.get('remote_data')),
                conflict.get('field')
            )
```

### 4.2 Conflict Resolution UI Data

```python
class ConflictResolutionService:
    """Service for handling conflict resolution in the UI"""

    async def get_pending_conflicts(self, user_id: str) -> List[dict]:
        """Get all pending conflicts for a user"""
        return await self.db.fetch_all("""
            SELECT
                sc.*,
                u.username as resolver_name,
                sc.created_at as conflict_detected_at
            FROM sync_conflicts sc
            LEFT JOIN users u ON sc.resolved_by = u.id
            WHERE sc.user_id = $1
            AND sc.resolution IS NULL
            ORDER BY sc.created_at DESC
        """, user_id)

    async def resolve_conflict_manually(self, conflict_id: str, resolution: dict,
                                      resolved_by: str):
        """Manually resolve a conflict"""
        async with self.db.transaction() as tx:
            # Update conflict record
            await tx.execute("""
                UPDATE sync_conflicts
                SET resolution = $1, resolved_by = $2, resolved_at = NOW()
                WHERE id = $3
            """, resolution.get('action'), resolved_by, conflict_id)

            # Apply resolution to the actual data
            await self.apply_conflict_resolution(tx, conflict_id, resolution)

    async def apply_conflict_resolution(self, tx, conflict_id: str, resolution: dict):
        """Apply the resolved changes to the database"""
        conflict = await tx.fetch_one(
            "SELECT * FROM sync_conflicts WHERE id = $1", conflict_id
        )

        entity_type = conflict['entity_type']
        entity_id = conflict['entity_id']

        if entity_type == 'calendar_event':
            await self.apply_calendar_event_resolution(tx, entity_id, resolution)
        elif entity_type == 'task':
            await self.apply_task_resolution(tx, entity_id, resolution)
        elif entity_type == 'contact':
            await self.apply_contact_resolution(tx, entity_id, resolution)
        # Add other entity types as needed

    async def apply_calendar_event_resolution(self, tx, event_id: str, resolution: dict):
        """Apply calendar event conflict resolution"""
        if resolution.get('action') == 'keep_local':
            # Update remote service with local data
            local_data = json.loads(resolution.get('local_data', '{}'))
            await self.update_remote_calendar_event(event_id, local_data)
        elif resolution.get('action') == 'keep_remote':
            # Update local database with remote data
            remote_data = json.loads(resolution.get('remote_data', '{}'))
            await self.update_local_calendar_event(tx, event_id, remote_data)
        elif resolution.get('action') == 'merge':
            # Apply merged data
            merged_data = resolution.get('merged_data', {})
            await self.update_local_calendar_event(tx, event_id, merged_data)
            await self.update_remote_calendar_event(event_id, merged_data)
```

## 5. Rate Limiting and Error Handling

### 5.1 Rate Limiting Strategy

```python
class RateLimiter:
    """Implements rate limiting for external API calls"""

    def __init__(self):
        self.redis = Redis()
        self.rate_limits = {
            'google_calendar': {'requests': 600, 'window': 60},  # 600 requests per minute
            'google_contacts': {'requests': 100, 'window': 100},  # 100 requests per 100 seconds
            'google_gmail': {'requests': 250, 'window': 100},  # 250 requests per 100 seconds
            'motion_tasks': {'requests': 1000, 'window': 3600}  # 1000 requests per hour
        }

    async def check_rate_limit(self, service: str, user_id: str = None) -> bool:
        """Check if request is allowed under rate limits"""
        limits = self.rate_limits.get(service)
        if not limits:
            return True

        key = f"rate_limit:{service}"
        if user_id:
            key += f":{user_id}"

        current_count = await self.redis.get(key)

        if current_count and int(current_count) >= limits['requests']:
            return False

        # Increment counter
        await self.redis.incr(key)
        await self.redis.expire(key, limits['window'])

        return True

    async def wait_for_rate_limit(self, service: str, user_id: str = None):
        """Wait until rate limit allows requests"""
        while not await self.check_rate_limit(service, user_id):
            await asyncio.sleep(1)

    async def get_remaining_requests(self, service: str, user_id: str = None) -> int:
        """Get number of remaining requests for this window"""
        limits = self.rate_limits.get(service)
        if not limits:
            return float('inf')

        key = f"rate_limit:{service}"
        if user_id:
            key += f":{user_id}"

        current_count = await self.redis.get(key)
        if current_count:
            return max(0, limits['requests'] - int(current_count))
        return limits['requests']

class ErrorHandler:
    """Handles sync errors and retry logic"""

    def __init__(self):
        self.max_retries = 3
        self.retry_delays = [1, 5, 15]  # seconds
        self.fatal_errors = {
            401: 'authentication_error',
            403: 'permission_denied',
            404: 'not_found',
            429: 'rate_limit_exceeded'
        }

    async def handle_api_error(self, error: Exception, service: str,
                              user_id: str, operation: str) -> dict:
        """Handle API errors with appropriate retry logic"""
        error_info = self.analyze_error(error)

        if error_info['is_fatal']:
            # Fatal error - don't retry
            await self.log_fatal_error(user_id, service, operation, error_info)
            return {'action': 'abort', 'error': error_info}

        elif error_info['is_rate_limit']:
            # Rate limit error - wait and retry
            delay = self.calculate_retry_delay(error_info)
            await self.schedule_retry(user_id, service, operation, delay)
            return {'action': 'retry', 'delay': delay, 'error': error_info}

        elif error_info['is_retryable']:
            # Retryable error - retry with exponential backoff
            retry_count = await self.get_retry_count(user_id, service, operation)

            if retry_count < self.max_retries:
                delay = self.retry_delays[min(retry_count, len(self.retry_delays) - 1)]
                await self.schedule_retry(user_id, service, operation, delay, retry_count + 1)
                return {'action': 'retry', 'delay': delay, 'error': error_info}
            else:
                # Max retries exceeded
                await self.log_max_retries_exceeded(user_id, service, operation, error_info)
                return {'action': 'abort', 'error': error_info}

        else:
            # Unknown error - log and continue
            await self.log_unknown_error(user_id, service, operation, error_info)
            return {'action': 'continue', 'error': error_info}

    def analyze_error(self, error: Exception) -> dict:
        """Analyze error to determine appropriate handling"""
        error_info = {
            'type': type(error).__name__,
            'message': str(error),
            'is_fatal': False,
            'is_retryable': False,
            'is_rate_limit': False
        }

        if hasattr(error, 'resp') and hasattr(error.resp, 'status'):
            status_code = error.resp.status

            if status_code in self.fatal_errors:
                error_info['is_fatal'] = True
                error_info['error_type'] = self.fatal_errors[status_code]
            elif status_code == 429:
                error_info['is_rate_limit'] = True
                error_info['error_type'] = 'rate_limit_exceeded'
            elif status_code >= 500:
                error_info['is_retryable'] = True
                error_info['error_type'] = 'server_error'
            elif status_code in [408, 429]:
                error_info['is_retryable'] = True
                error_info['error_type'] = 'timeout_or_rate_limit'

        elif isinstance(error, (ConnectionError, TimeoutError)):
            error_info['is_retryable'] = True
            error_info['error_type'] = 'network_error'

        return error_info

    async def schedule_retry(self, user_id: str, service: str, operation: str,
                           delay: int, retry_count: int = 1):
        """Schedule a retry operation"""
        retry_data = {
            'user_id': user_id,
            'service': service,
            'operation': operation,
            'retry_count': retry_count,
            'scheduled_for': datetime.utcnow() + timedelta(seconds=delay)
        }

        # Add to retry queue
        await self.redis.zadd(
            'retry_queue',
            {json.dumps(retry_data): retry_data['scheduled_for'].timestamp()}
        )
```

## 6. Webhook Processing

### 6.1 Webhook Handler

```python
class WebhookProcessor:
    """Processes incoming webhooks from external services"""

    def __init__(self):
        self.webhook_handlers = {
            'google_calendar': self.handle_google_calendar_webhook,
            'google_gmail': self.handle_gmail_webhook,
            'motion_tasks': self.handle_motion_webhook
        }
        self.signature_validator = WebhookSignatureValidator()

    async def process_webhook(self, webhook_data: dict, headers: dict) -> dict:
        """Process incoming webhook"""
        try:
            # Validate webhook signature
            if not await self.signature_validator.validate(webhook_data, headers):
                return {'status': 'error', 'message': 'Invalid signature'}

            # Extract service and user information
            service = webhook_data.get('service')
            user_id = webhook_data.get('user_id')

            if not service or not user_id:
                return {'status': 'error', 'message': 'Missing service or user_id'}

            # Get appropriate handler
            handler = self.webhook_handlers.get(service)
            if not handler:
                return {'status': 'error', 'message': f'Unknown service: {service}'}

            # Process webhook
            result = await handler(user_id, webhook_data)

            return {'status': 'success', 'result': result}

        except Exception as e:
            await self.log_webhook_error(webhook_data, headers, str(e))
            return {'status': 'error', 'message': str(e)}

    async def handle_google_calendar_webhook(self, user_id: str, webhook_data: dict):
        """Handle Google Calendar webhook"""
        channel_id = webhook_data.get('channelId')
        resource_id = webhook_data.get('resourceId')
        resource_state = webhook_data.get('resourceState')

        if resource_state == 'exists':
            # Event was created or updated
            # Trigger incremental sync for this calendar
            await self.trigger_incremental_sync(user_id, 'google_calendar', {
                'calendar_id': webhook_data.get('calendarId'),
                'event_id': webhook_data.get('id')
            })
        elif resource_state == 'not_exists':
            # Event was deleted
            await self.handle_calendar_event_deletion(user_id, webhook_data)

    async def handle_motion_webhook(self, user_id: str, webhook_data: dict):
        """Handle Motion webhook"""
        event_type = webhook_data.get('type')
        entity_data = webhook_data.get('data', {})

        if event_type in ['task.created', 'task.updated', 'task.deleted']:
            # Trigger task sync
            await self.trigger_incremental_sync(user_id, 'motion_tasks', {
                'task_id': entity_data.get('id'),
                'event_type': event_type
            })
        elif event_type in ['project.created', 'project.updated', 'project.deleted']:
            # Trigger project sync
            await self.trigger_incremental_sync(user_id, 'motion_tasks', {
                'project_id': entity_data.get('id'),
                'event_type': event_type,
                'entity_type': 'project'
            })

    async def trigger_incremental_sync(self, user_id: str, service: str, context: dict):
        """Trigger incremental sync for specific entity"""
        sync_task = {
            'user_id': user_id,
            'service': service,
            'sync_type': 'incremental',
            'context': context,
            'priority': 'high',
            'created_at': datetime.utcnow()
        }

        # Add to high priority queue
        await self.redis.lpush('high_priority_sync_queue', json.dumps(sync_task))
```

## 7. Monitoring and Analytics

### 7.1 Sync Monitoring

```python
class SyncMonitor:
    """Monitors synchronization performance and health"""

    def __init__(self):
        self.metrics_collector = MetricsCollector()
        self.alert_manager = AlertManager()

    async def collect_sync_metrics(self):
        """Collect comprehensive sync metrics"""
        metrics = {
            'sync_status': await self.get_sync_status_metrics(),
            'performance': await self.get_performance_metrics(),
            'errors': await self.get_error_metrics(),
            'conflicts': await self.get_conflict_metrics(),
            'api_usage': await self.get_api_usage_metrics()
        }

        await self.metrics_collector.store_metrics(metrics)

        # Check for alerts
        await self.check_sync_alerts(metrics)

        return metrics

    async def get_sync_status_metrics(self) -> dict:
        """Get sync status metrics across all users"""
        return await self.db.fetch_one("""
            SELECT
                COUNT(DISTINCT user_id) as total_users,
                COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
                COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_syncs,
                COUNT(CASE WHEN status = 'running' THEN 1 END) as running_syncs,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_sync_duration_seconds
            FROM sync_status
            WHERE created_at >= NOW() - INTERVAL '24 hours'
        """)

    async def get_performance_metrics(self) -> dict:
        """Get performance metrics for sync operations"""
        return await self.db.fetch_one("""
            SELECT
                service_name,
                AVG(records_processed) as avg_records_processed,
                AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_duration_seconds,
                MAX(records_processed) as max_records_processed,
                COUNT(*) as total_syncs
            FROM sync_status
            WHERE status = 'completed'
            AND created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY service_name
        """)

    async def check_sync_alerts(self, metrics: dict):
        """Check for sync-related alerts"""
        # High failure rate alert
        total_syncs = metrics['sync_status'].get('successful_syncs', 0) + \
                     metrics['sync_status'].get('failed_syncs', 0)

        if total_syncs > 0:
            failure_rate = metrics['sync_status'].get('failed_syncs', 0) / total_syncs

            if failure_rate > 0.1:  # 10% failure rate threshold
                await self.alert_manager.send_alert(
                    'sync_high_failure_rate',
                    f"Sync failure rate is {failure_rate:.2%}",
                    'warning'
                )

        # Long running syncs alert
        running_syncs = metrics['sync_status'].get('running_syncs', 0)
        if running_syncs > 10:
            await self.alert_manager.send_alert(
                'sync_queue_backlog',
                f"{running_syncs} syncs currently running",
                'warning'
            )
```

## 8. Conclusion

This comprehensive data synchronization strategy provides:

1. **Robust Architecture**: Queue-based system with proper error handling and retry logic
2. **Service Integration**: Full support for Google Calendar, Gmail, Contacts, and Motion APIs
3. **Conflict Resolution**: Intelligent conflict detection and multiple resolution strategies
4. **Performance Optimization**: Rate limiting, batch processing, and webhook-driven updates
5. **Monitoring**: Comprehensive metrics collection and alerting
6. **Scalability**: Designed to handle thousands of users with multiple synchronized services

**Key Benefits:**
- Real-time synchronization with webhooks
- Automatic conflict resolution with manual override options
- Resilient error handling with retry logic
- Efficient resource usage with rate limiting
- Comprehensive monitoring and alerting
- GDPR-compliant data handling

This strategy ensures reliable, performant synchronization while maintaining data integrity across all integrated services.