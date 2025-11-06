# Productivity Hub - Technical Documentation

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [API Integrations](#api-integrations)
4. [Security Implementation](#security-implementation)
5. [Data Models & Types](#data-models--types)
6. [Component Architecture](#component-architecture)
7. [State Management](#state-management)
8. [Performance Optimizations](#performance-optimizations)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Guide](#deployment-guide)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Troubleshooting](#troubleshooting)

## Architecture Overview

### System Architecture

Productivity Hub is a single-page application (SPA) built with a modular architecture that separates concerns across different productivity domains:

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + TypeScript)            │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   Journal   │ │    Tasks    │ │  Calendar   │ │  Email  │ │
│  │   Module    │ │   Module    │ │   Module    │ │ Module  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────┤
│                    Authentication Layer                     │
│              (Google OAuth 2.0 + Session Mgmt)              │
├─────────────────────────────────────────────────────────────┤
│                      API Integration Layer                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │ Google Cal  │ │   Gmail     │ │Google People│ │  Local  │ │
│  │   API v3    │ │   API v1    │ │    API      │ │Storage  │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

1. **Modularity**: Each productivity domain is a self-contained module
2. **Security-First**: All operations include security validation and sanitization
3. **Performance**: Lazy loading, code splitting, and efficient rendering
4. **Type Safety**: Comprehensive TypeScript usage for compile-time error prevention
5. **User Experience**: Responsive design with accessibility considerations

## Technology Stack

### Core Technologies

#### Frontend Framework
- **React 18.2.0** - Modern React with concurrent features
- **TypeScript 5.2.2** - Type-safe JavaScript development
- **Vite 6.0.0** - Fast development build tool with HMR

#### Styling & UI
- **Tailwind CSS 3.3.6** - Utility-first CSS framework
- **Lucide React 0.294.0** - Modern icon library
- **Glassmorphism Design** - Custom CSS effects for modern UI

#### Routing & State Management
- **React Router DOM 7.9.5** - Client-side routing with lazy loading
- **React Context API** - Global state management
- **Custom Hooks** - Reusable state logic and side effects

#### Data Visualization
- **Chart.js 4.4.0** - Interactive charts library
- **React Chart.js 2 5.2.0** - React wrapper for Chart.js
- **Recharts 2.8.0** - Additional charting capabilities
- **D3.js** - Advanced data visualization (loaded on demand)

#### API & HTTP
- **Axios 1.12.2** - HTTP client with interceptors
- **Google APIs 164.1.0** - Official Google APIs client library

### Security & Validation
- **XSS 1.0.15** - HTML sanitization library
- **Zod 3.22.4** - Schema validation
- **Joi 17.9.2** - Alternative validation library

### Development Tools
- **ESLint** - Code linting and formatting
- **Prettier** - Code formatting
- **Terser** - JavaScript minification

## API Integrations

### Google Calendar API Integration

#### Configuration
```typescript
// Google Calendar API Configuration
const GOOGLE_CALENDAR_CONFIG = {
  API_KEY: import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY,
  CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
  DISCOVERY_DOC: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  SCOPES: [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events'
  ]
};
```

#### Features Implemented
- **Event Management**: Full CRUD operations for calendar events
- **Calendar List**: Retrieve and manage user's calendars
- **Recurring Events**: Support for recurring event patterns
- **Event Reminders**: Configurable reminders and notifications
- **Conflict Detection**: Identify scheduling conflicts
- **Time Zone Support**: Proper timezone handling for global users

#### API Usage
```typescript
// Initialize Calendar API
const calendarAPI = new GoogleCalendarAPI();
await calendarAPI.initializeGoogleAPI(clientId, apiKey);

// Get events
const events = await calendarAPI.getEvents('primary', startDate, endDate);

// Create event with validation
const event = await calendarAPI.createEvent('primary', {
  title: sanitizeHtml(eventData.title),
  startTime: eventData.startTime,
  endTime: eventData.endTime,
  description: sanitizeHtml(eventData.description),
  attendees: eventData.attendees?.filter(attendee => validators.email(attendee.email))
});
```

### Gmail API Integration

#### Configuration
```typescript
// Gmail API Configuration
const GMAIL_CONFIG = {
  BASE_URL: 'https://www.googleapis.com/gmail/v1',
  OAUTH_URL: 'https://accounts.google.com/o/oauth2/v2/auth',
  SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.send'
  ]
};
```

#### Features Implemented
- **Message Retrieval**: Fetch emails with full thread support
- **Email Composition**: Send emails with rich text and attachments
- **Label Management**: Organize emails with custom labels
- **Search & Filter**: Advanced email search capabilities
- **Thread Management**: Group related conversations
- **Attachment Handling**: Download and manage email attachments

#### Security Measures
- **HTML Sanitization**: All email content is sanitized before rendering
- **Input Validation**: All user inputs are validated before API calls
- **Rate Limiting**: Implement rate limiting to prevent API abuse
- **Secure Token Storage**: OAuth tokens stored securely with expiration checks

### Google People API Integration

#### Configuration
```typescript
// Google People API Configuration
const PEOPLE_CONFIG = {
  BASE_URL: 'https://people.googleapis.com/v1',
  SCOPES: [
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/contacts.readonly'
  ]
};
```

#### Features Implemented
- **Contact Management**: Full CRUD operations for contacts
- **Contact Groups**: Organize contacts into groups
- **Search & Filter**: Advanced contact search capabilities
- **Relationship Tracking**: Track professional relationships
- **Contact Photos**: Manage contact profile pictures

## Security Implementation

### Security Architecture

#### Authentication Layer
```typescript
// Authentication Manager
class AuthManager {
  private sessions: Map<string, UserSession> = new Map();

  async authenticateUser(credentials: AuthCredentials): Promise<AuthResult> {
    // Validate credentials
    if (!validators.email(credentials.email)) {
      throw new Error('Invalid email format');
    }

    // Perform OAuth flow
    const token = await this.performOAuthFlow(credentials);

    // Create secure session
    const session: UserSession = {
      userId: this.generateSecureUserId(),
      email: credentials.email,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresAt: Date.now() + (token.expires_in * 1000),
      isActive: true
    };

    this.sessions.set(session.userId, session);
    return { success: true, userId: session.userId };
  }
}
```

#### Input Validation & Sanitization
```typescript
// Security Utilities
export const securityUtils = {
  // HTML Sanitization
  sanitizeHtml: (dirty: string): string => {
    return xss(dirty, {
      whiteList: {
        a: ['href', 'title', 'target'],
        b: [],
        i: [],
        em: [],
        strong: [],
        p: [],
        br: []
      },
      stripIgnoreTag: true,
      stripIgnoreTagBody: ['script']
    });
  },

  // Input Validation
  validateInput: (input: any, schema: z.ZodSchema): any => {
    return schema.parse(input);
  },

  // Rate Limiting
  rateLimiter: new RateLimiter(100, 60000) // 100 requests per minute
};
```

#### Content Security Policy
```typescript
// CSP Header Configuration
const CSP_HEADER = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "connect-src 'self' https://apis.google.com https://mail.google.com",
  "font-src 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests"
].join('; ');
```

### Security Best Practices

#### 1. User Data Isolation
- **User-Specific Storage**: All localStorage keys are user-specific
- **Data Validation**: All data is validated before storage and retrieval
- **Access Control**: Users can only access their own data

#### 2. XSS Prevention
- **HTML Escaping**: All user content is HTML-escaped
- **Content Sanitization**: Rich content is sanitized using XSS library
- **CSP Headers**: Strong Content Security Policy headers

#### 3. CSRF Protection
- **Token Validation**: All state-changing operations include CSRF tokens
- **SameSite Cookies**: Cookies are configured with SameSite attribute
- **Origin Validation**: API calls validate request origin

#### 4. Secure API Integration
- **OAuth 2.0**: Secure authentication with proper scope management
- **Token Storage**: Access tokens stored securely with expiration
- **HTTPS Only**: All API communications over HTTPS

## Data Models & Types

### Core Type Definitions

#### Email System Types
```typescript
export interface Email {
  id: string;
  threadId: string;
  from: EmailAddress;
  to: EmailAddress[];
  cc?: EmailAddress[];
  bcc?: EmailAddress[];
  subject: string;
  body: string;
  bodyHtml?: string;
  bodyPlain?: string;
  date: Date;
  sent: boolean;
  read: boolean;
  starred: boolean;
  important: boolean;
  archived: boolean;
  deleted: boolean;
  draft: boolean;
  labels: EmailLabel[];
  attachments: EmailAttachment[];
  category: EmailCategory;
  folder: EmailFolder;
  snippet: string;
  hasAttachments: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  size: number;
}
```

#### Calendar System Types
```typescript
export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
  attendees?: Attendee[];
  color?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
  creator?: EventOrganizer;
  organizer?: EventOrganizer;
  type: EventType;
  isRecurring: boolean;
  recurrenceRule?: string;
  reminders: EventReminder[];
  timezone: string;
  visibility: 'public' | 'private' | 'confidential';
}
```

#### Task System Types
```typescript
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  category: string;
  tags: string[];
  estimatedTime?: number; // minutes
  actualTime?: number; // minutes
  subtasks: Task[];
  attachments: TaskAttachment[];
  recurring?: RecurrencePattern;
}
```

#### Journal System Types
```typescript
export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  mood: number; // 1-10 scale
  energy: number; // 1-10 scale
  themes: string[];
  insights: string[];
  tags: string[];
  isPrivate: boolean;
  attachments: JournalAttachment[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Data Validation Schemas

#### Email Validation
```typescript
const emailSchema = z.object({
  to: z.array(z.object({
    email: z.string().email(),
    name: z.string().optional()
  })).min(1),
  subject: z.string().max(255),
  body: z.string().max(100000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal')
});
```

#### Task Validation
```typescript
const taskSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  category: z.string().min(1),
  dueDate: z.date().optional(),
  tags: z.array(z.string().max(50)).max(10)
});
```

## Component Architecture

### Component Hierarchy

```
App
├── AuthWrapper
│   ├── AuthPage
│   └── MainApp
│       ├── Sidebar
│       ├── Header
│       │   ├── SearchBar
│       │   ├── NotificationCenter
│       │   └── ProfileDropdown
│       └── MainContent
│           ├── Dashboard
│           ├── JournalApp
│           ├── TasksApp
│           ├── CalendarApp
│           ├── EmailApp
│           ├── ContactsApp
│           └── Settings
```

### Module-Specific Components

#### Journal Module
```typescript
// Journal Module Components
export const JournalComponents = {
  JournalApp: lazy(() => import('./journal/JournalApp')),
  JournalSimple: lazy(() => import('./journal/JournalSimple')),
  JournalEditModal: lazy(() => import('./journal/JournalEditModal')),
  MoodChart: lazy(() => import('./journal/MoodChart')),
  WordCloud: lazy(() => import('./journal/WordCloud')),
  StreakTracker: lazy(() => import('./journal/StreakTracker')),
  EntryTemplates: lazy(() => import('./journal/EntryTemplates'))
};
```

#### Task Module
```typescript
// Task Module Components
export const TaskComponents = {
  TasksApp: lazy(() => import('./tasks/TasksApp')),
  TaskItem: lazy(() => import('./tasks/TaskItem')),
  TaskForm: lazy(() => import('./tasks/TaskForm')),
  TaskStats: lazy(() => import('./tasks/TaskStats')),
  TimerCard: lazy(() => import('./tasks/PremiumTimerCard')),
  TaskFilters: lazy(() => import('./tasks/TaskFilters'))
};
```

#### Calendar Module
```typescript
// Calendar Module Components
export const CalendarComponents = {
  CalendarApp: lazy(() => import('./calendar/CalendarApp')),
  CalendarDay: lazy(() => import('./calendar/CalendarDay')),
  CalendarWeek: lazy(() => import('./calendar/CalendarWeek')),
  CalendarAgenda: lazy(() => import('./calendar/CalendarAgenda')),
  EventForm: lazy(() => import('./calendar/EventForm')),
  EventDetails: lazy(() => import('./calendar/EventDetails'))
};
```

### Component Patterns

#### 1. Lazy Loading Pattern
```typescript
// Implementing lazy loading for performance
const LazyComponent = lazy(() => import('./HeavyComponent'));

// With loading fallback
<Suspense fallback={<LoadingSpinner />}>
  <LazyComponent />
</Suspense>
```

#### 2. Error Boundary Pattern
```typescript
// Error handling for component trees
class ComponentErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}
```

#### 3. Higher-Order Component Pattern
```typescript
// Security HOC for authenticated routes
const withAuth = (Component) => {
  return (props) => {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }

    return <Component {...props} />;
  };
};
```

## State Management

### Global State Architecture

#### Context Providers
```typescript
// Theme Context
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Auth Context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Timer Context
export const TimerContext = createContext<TimerContextType | undefined>(undefined);

// Notification Context
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
```

#### Custom Hooks
```typescript
// Authentication Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Local Storage Hook
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};
```

### Data Persistence Strategy

#### User-Specific Storage
```typescript
// Secure User Storage Implementation
class SecureUserStorage {
  private generateUserKey(baseKey: string, userEmail: string): string {
    const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    return `${baseKey}_${sanitizedEmail}`;
  }

  setData(key: string, data: any, userEmail: string): void {
    const userKey = this.generateUserKey(key, userEmail);
    const encryptedData = this.encryptData(data);
    localStorage.setItem(userKey, encryptedData);
  }

  getData(key: string, userEmail: string): any {
    const userKey = this.generateUserKey(key, userEmail);
    const encryptedData = localStorage.getItem(userKey);
    if (!encryptedData) return null;

    return this.decryptData(encryptedData);
  }
}
```

## Performance Optimizations

### Code Splitting & Lazy Loading

#### Route-Based Splitting
```typescript
// Vite configuration for optimal chunking
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'charts': ['chart.js', 'react-chartjs-2', 'recharts'],
          'google': ['googleapis'],
          'utils': ['axios', 'date-fns', 'lucide-react']
        }
      }
    }
  }
});
```

#### Component Lazy Loading
```typescript
// Lazy loading for heavy components
const Dashboard = lazy(() => import('./components/Dashboard'));
const Analytics = lazy(() => import('./components/Analytics'));

// With preload for better UX
const preloadComponent = (componentImport) => {
  const component = lazy(componentImport);
  // Preload component on hover or visibility
  return component;
};
```

### Rendering Optimizations

#### Memoization
```typescript
// Using React.memo for component optimization
const OptimizedTaskItem = React.memo(({ task, onUpdate }) => {
  return (
    <div>
      <h3>{task.title}</h3>
      <p>{task.description}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.task.id === nextProps.task.id &&
         prevProps.task.completed === nextProps.task.completed;
});

// Using useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Using useCallback for function optimization
const handleClick = useCallback((id) => {
  onTaskUpdate(id);
}, [onTaskUpdate]);
```

#### Virtual Scrolling
```typescript
// Virtual scrolling for large lists
import { FixedSizeList as List } from 'react-window';

const VirtualTaskList = ({ tasks }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <TaskItem task={tasks[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={tasks.length}
      itemSize={80}
    >
      {Row}
    </List>
  );
};
```

### API Optimizations

#### Request Caching
```typescript
// API response caching
const useCachedData = (key, fetcher, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cachedData = localStorage.getItem(`cache_${key}`);
    const cacheExpiry = localStorage.getItem(`cache_${key}_expiry`);

    if (cachedData && cacheExpiry && Date.now() < parseInt(cacheExpiry)) {
      setData(JSON.parse(cachedData));
      setLoading(false);
      return;
    }

    fetcher()
      .then(fetchedData => {
        setData(fetchedData);
        localStorage.setItem(`cache_${key}`, JSON.stringify(fetchedData));
        localStorage.setItem(`cache_${key}_expiry`, (Date.now() + 300000).toString()); // 5 minutes
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, dependencies);

  return { data, loading, error };
};
```

#### Debounced API Calls
```typescript
// Debounced search functionality
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Usage in search component
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      performSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);
};
```

## Testing Strategy

### Unit Testing

#### Component Testing
```typescript
// Example component test
import { render, screen, fireEvent } from '@testing-library/react';
import TaskItem from './TaskItem';

describe('TaskItem', () => {
  test('renders task title and description', () => {
    const mockTask = {
      id: '1',
      title: 'Test Task',
      description: 'Test Description',
      completed: false
    };

    render(<TaskItem task={mockTask} />);

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  test('calls onUpdate when completed', () => {
    const mockOnUpdate = jest.fn();
    const mockTask = {
      id: '1',
      title: 'Test Task',
      completed: false
    };

    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} />);

    fireEvent.click(screen.getByRole('checkbox'));
    expect(mockOnUpdate).toHaveBeenCalledWith('1', true);
  });
});
```

#### Utility Function Testing
```typescript
// Example utility test
import { validators, sanitizeHtml } from './security/securityUtils';

describe('Security Utils', () => {
  test('validators.email validates email format', () => {
    expect(validators.email('test@example.com')).toBe(true);
    expect(validators.email('invalid-email')).toBe(false);
    expect(validators.email('')).toBe(false);
  });

  test('sanitizeHtml removes dangerous content', () => {
    const dirtyHtml = '<script>alert("xss")</script><p>Safe content</p>';
    const cleanHtml = sanitizeHtml(dirtyHtml);
    expect(cleanHtml).not.toContain('<script>');
    expect(cleanHtml).toContain('Safe content');
  });
});
```

### Integration Testing

#### API Integration Testing
```typescript
// API integration test
import { gmailAPI } from './utils/gmailAPI';

describe('Gmail API Integration', () => {
  beforeEach(() => {
    // Mock authentication
    gmailAPI.saveConfig({
      accessToken: 'test-token',
      clientId: 'test-client-id'
    });
  });

  test('fetches messages successfully', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        messages: [{ id: '1', threadId: '1' }]
      })
    });

    const messages = await gmailAPI.getMessages();
    expect(messages).toHaveLength(1);
  });
});
```

### Security Testing

#### XSS Prevention Testing
```typescript
// Security test suite
describe('XSS Prevention', () => {
  test('prevents script injection in task titles', () => {
    const maliciousTitle = '<script>alert("xss")</script>Task Title';
    const sanitizedTitle = sanitizeHtml(maliciousTitle);
    expect(sanitizedTitle).not.toContain('<script>');
  });

  test('prevents HTML injection in email bodies', () => {
    const maliciousBody = '<img src=x onerror=alert("xss")>';
    const sanitizedBody = sanitizeHtml(maliciousBody);
    expect(sanitizedBody).not.toContain('onerror');
  });
});
```

## Deployment Guide

### Production Deployment

#### Vercel Configuration
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "GOOGLE_CLIENT_ID": "@google-client-id",
    "GOOGLE_API_KEY": "@google-api-key"
  }
}
```

#### Environment Variables
```bash
# Production Environment Variables
VITE_GOOGLE_CLIENT_ID=your-production-client-id
VITE_GOOGLE_API_KEY=your-production-api-key
VITE_GOOGLE_CALENDAR_API_KEY=your-calendar-api-key
VITE_GOOGLE_GMAIL_API_KEY=your-gmail-api-key
VITE_GOOGLE_CONTACTS_API_KEY=your-contacts-api-key

# Application Configuration
VITE_APP_NAME=Productivity Hub
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### Build Optimization

#### Vite Configuration
```typescript
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          utils: ['axios', 'date-fns']
        }
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500
  }
});
```

#### CDN Configuration
```typescript
// Static asset optimization
const assetConfig = {
  imageOptimization: {
    quality: 85,
    format: ['webp', 'avif'],
    fallback: 'jpeg'
  },
  caching: {
    maxAge: 31536000, // 1 year for static assets
    immutable: true
  }
};
```

## Monitoring & Analytics

### Performance Monitoring

#### Core Web Vitals
```typescript
// Performance monitoring setup
const reportWebVitals = (onPerfEntry) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

// Performance metrics tracking
const trackPerformance = () => {
  // Track page load time
  const navigation = performance.getEntriesByType('navigation')[0];
  const loadTime = navigation.loadEventEnd - navigation.fetchStart;

  // Track API response times
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.initiatorType === 'fetch') {
        console.log(`API call to ${entry.name} took ${entry.duration}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
};
```

#### Error Tracking
```typescript
// Global error handling
window.addEventListener('error', (event) => {
  const errorInfo = {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    stack: event.error?.stack,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };

  // Send to error tracking service
  sendErrorReport(errorInfo);
});

// Unhandled promise rejection tracking
window.addEventListener('unhandledrejection', (event) => {
  const errorInfo = {
    reason: event.reason,
    promise: event.promise,
    timestamp: new Date().toISOString()
  };

  sendErrorReport(errorInfo);
});
```

### User Analytics

#### Productivity Metrics
```typescript
// Analytics tracking for user engagement
const trackUserActivity = (action: string, module: string, metadata?: any) => {
  const activity = {
    action,
    module,
    metadata,
    timestamp: Date.now(),
    sessionId: getSessionId(),
    userId: getCurrentUserId()
  };

  // Send to analytics service
  analytics.track('user_activity', activity);
};

// Track feature usage
const trackFeatureUsage = (feature: string, usedSuccessfully: boolean) => {
  trackUserActivity('feature_usage', feature, {
    success: usedSuccessfully,
    timestamp: Date.now()
  });
};
```

## Troubleshooting

### Common Issues

#### Authentication Issues
```typescript
// Debug authentication state
const debugAuth = () => {
  console.log('=== Authentication Debug ===');
  console.log('Current User:', getCurrentUser());
  console.log('Access Token:', localStorage.getItem('google_access_token'));
  console.log('Token Expiry:', localStorage.getItem('token_expiry'));
  console.log('OAuth State:', localStorage.getItem('oauth_state'));
};

// Fix common authentication issues
const fixAuthentication = async () => {
  // Clear corrupted tokens
  const accessToken = localStorage.getItem('google_access_token');
  const expiry = localStorage.getItem('token_expiry');

  if (accessToken && (!expiry || Date.now() > parseInt(expiry))) {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('token_expiry');
    console.log('Expired token cleared');
  }

  // Re-initialize authentication
  window.location.href = '/login';
};
```

#### API Integration Issues
```typescript
// API connection diagnostics
const diagnoseAPIConnection = async (serviceName: string) => {
  console.log(`=== ${serviceName} API Diagnosis ===`);

  try {
    const response = await fetch(`https://www.googleapis.com/${serviceName}/v1/userinfo`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('google_access_token')}`
      }
    });

    if (response.ok) {
      console.log(`${serviceName} API: Connected`);
      return true;
    } else {
      console.log(`${serviceName} API: Error - ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`${serviceName} API: Connection failed`);
    return false;
  }
};
```

#### Performance Issues
```typescript
// Performance diagnostics
const diagnosePerformance = () => {
  console.log('=== Performance Diagnosis ===');

  // Check memory usage
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`Memory Usage: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
  }

  // Check component render times
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('render')) {
        console.log(`Render time for ${entry.name}: ${entry.duration}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['measure'] });
};
```

### Debug Tools

#### Debug Mode Toggle
```typescript
// Enable debug mode
const enableDebugMode = () => {
  localStorage.setItem('debug', 'true');
  console.log('🔍 Debug mode enabled');
  console.log('Available commands:');
  console.log('- debugAuth() - Check authentication status');
  console.log('- diagnoseAPIConnection("gmail") - Test Gmail API');
  console.log('- diagnosePerformance() - Check performance metrics');
};

// Make debug functions available globally
if (typeof window !== 'undefined') {
  (window as any).debug = {
    enableDebugMode,
    debugAuth,
    diagnoseAPIConnection,
    diagnosePerformance
  };
}
```

---

This technical documentation provides a comprehensive overview of the Productivity Hub architecture, implementation details, and operational procedures. For specific implementation details or troubleshooting assistance, refer to the relevant sections or contact the development team.