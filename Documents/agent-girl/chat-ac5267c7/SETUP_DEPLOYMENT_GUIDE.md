# Productivity Hub - Setup & Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Google Cloud Configuration](#google-cloud-configuration)
4. [Environment Configuration](#environment-configuration)
5. [Testing & Validation](#testing--validation)
6. [Production Deployment](#production-deployment)
7. [Monitoring & Maintenance](#monitoring--maintenance)
8. [Troubleshooting](#troubleshooting)
9. [Security Hardening](#security-hardening)
10. [Performance Optimization](#performance-optimization)

## Prerequisites

### System Requirements

#### Development Environment
- **Node.js**: Version 16.x or higher (recommended 18.x or 20.x)
- **npm**: Version 8.x or higher (or yarn 1.22.x+)
- **Git**: Version 2.x or higher
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+

#### Operating System Support
- **Windows**: Windows 10 or higher
- **macOS**: macOS 10.15 (Catalina) or higher
- **Linux**: Ubuntu 18.04+, Fedora 30+, or equivalent

#### Hardware Requirements
- **RAM**: Minimum 4GB, recommended 8GB+
- **Storage**: Minimum 2GB free disk space
- **Processor**: Modern 64-bit processor

### Google Cloud Account Setup

#### Required Google Services
1. **Google Cloud Platform (GCP) Account**
   - Create account at [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Enable billing account (free tier available for development)

2. **Google Workspace Account** (for testing)
   - Gmail account with access to Calendar and Contacts
   - Google Workspace account recommended for full functionality

3. **OAuth Application Registration**
   - Ability to create OAuth 2.0 client credentials
   - Domain ownership verification for production

## Local Development Setup

### 1. Clone the Repository

```bash
# Clone the repository
git clone <repository-url>
cd productivity-hub

# Verify the installation
ls -la
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# Or using yarn
yarn install

# Verify installation
npm list --depth=0
```

### 3. Environment Variables Setup

Create a `.env` file in the root directory:

```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

#### Required Environment Variables

```env
# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Google API Keys
VITE_GOOGLE_API_KEY=your-google-api-key
VITE_GOOGLE_CALENDAR_API_KEY=your-calendar-api-key
VITE_GOOGLE_GMAIL_API_KEY=your-gmail-api-key
VITE_GOOGLE_CONTACTS_API_KEY=your-contacts-api-key

# Application Configuration
VITE_APP_NAME=Productivity Hub
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
```

### 4. Start Development Server

```bash
# Start the development server
npm run dev

# Or using yarn
yarn dev
```

The application should now be running at `http://localhost:5173`

### 5. Verify Development Setup

Open your browser and navigate to `http://localhost:5173`:

1. **Check Application Loading**: The main application should load without errors
2. **Check Console**: Open browser console - should show no critical errors
3. **Check Network Tab**: Verify no failed API requests
4. **Test Authentication**: Click on Google Sign-in to test OAuth flow

## Google Cloud Configuration

### 1. Create Google Cloud Project

1. **Navigate to Google Cloud Console**
   - Go to [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create New Project**
   ```
   Project Name: Productivity Hub Development
   Project ID: productivity-hub-dev-[unique-id]
   Organization: [Your organization if applicable]
   Location: [Select appropriate location]
   ```

3. **Enable Billing**
   - Go to "Billing" → "Link billing account"
   - Select "Free tier" for development

### 2. Enable Required APIs

Navigate to "APIs & Services" → "Library" and enable:

#### Core APIs
```
Google Calendar API
- ID: calendar-json.googleapis.com
- Purpose: Calendar event management

Gmail API
- ID: gmail.googleapis.com
- Purpose: Email management

Google People API
- ID: people.googleapis.com
- Purpose: Contact management

Google OAuth2 API
- ID: oauth2.googleapis.com
- Purpose: Authentication
```

#### Optional APIs
```
Google Sheets API
- ID: sheets.googleapis.com
- Purpose: Data export functionality

Google Drive API
- ID: drive.googleapis.com
- Purpose: File attachments storage
```

### 3. Configure OAuth 2.0 Credentials

#### Create OAuth Consent Screen
1. **Navigate to "APIs & Services" → "OAuth consent screen"**
2. **Choose User Type**: External (for testing) or Internal (for organization)
3. **Fill in App Information**:
   ```
   App name: Productivity Hub
   User support email: your-email@example.com
   App logo: [Upload app logo - optional]
   Application homepage link: https://your-app-domain.com
   Application privacy policy link: https://your-app-domain.com/privacy
   Application terms of service link: https://your-app-domain.com/terms
   Authorized domains: localhost, your-production-domain.com
   Developer contact information: your-email@example.com
   ```

4. **Configure Scopes**:
   ```
   Required Scopes:
   - ../auth/calendar
   - ../auth/calendar.events
   - ../auth/gmail.readonly
   - ../auth/gmail.send
   - ../auth/contacts
   - ../auth/userinfo.email
   - ../auth/userinfo.profile
   ```

#### Create OAuth 2.0 Client ID
1. **Navigate to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "OAuth client ID"**
3. **Configure Application**:
   ```
   Application type: Web application
   Name: Productivity Hub Web Client

   Authorized JavaScript origins:
   - http://localhost:5173
   - https://your-production-domain.com

   Authorized redirect URIs:
   - http://localhost:5173
   - https://your-production-domain.com
   ```

4. **Save and Note Credentials**:
   ```
   Client ID: [your-client-id]
   Client Secret: [your-client-secret]
   ```

### 4. Create API Keys

For each required API, create an API key:

1. **Navigate to "APIs & Services" → "Credentials"**
2. **Click "Create Credentials" → "API key"**
3. **Restrict API Key** (recommended for production):
   ```
   API restrictions:
   - Select required APIs (Calendar, Gmail, People)

   Application restrictions:
   - HTTP referrers: your-production-domain.com
   - IP addresses: [Your server IP addresses]
   ```

4. **Create Separate Keys for Each Service**:
   ```
   Google Calendar API Key
   Gmail API Key
   Google People API Key
   General Google API Key
   ```

## Environment Configuration

### Development Environment

#### .env.development
```env
# Development Configuration
NODE_ENV=development
VITE_APP_ENVIRONMENT=development

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-dev-client-id
VITE_GOOGLE_CLIENT_SECRET=your-dev-client-secret

# API Keys
VITE_GOOGLE_CALENDAR_API_KEY=your-dev-calendar-key
VITE_GOOGLE_GMAIL_API_KEY=your-dev-gmail-key
VITE_GOOGLE_CONTACTS_API_KEY=your-dev-contacts-key

# Debug Settings
VITE_ENABLE_DEBUG_MODE=true
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=false

# API Endpoints
VITE_API_BASE_URL=http://localhost:3001
VITE_AUTH_CALLBACK_URL=http://localhost:5173
```

#### .env.production
```env
# Production Configuration
NODE_ENV=production
VITE_APP_ENVIRONMENT=production

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-prod-client-id
VITE_GOOGLE_CLIENT_SECRET=your-prod-client-secret

# API Keys
VITE_GOOGLE_CALENDAR_API_KEY=your-prod-calendar-key
VITE_GOOGLE_GMAIL_API_KEY=your-prod-gmail-key
VITE_GOOGLE_CONTACTS_API_KEY=your-prod-contacts-key

# Production Settings
VITE_ENABLE_DEBUG_MODE=false
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_ENABLE_ERROR_REPORTING=true

# API Endpoints
VITE_API_BASE_URL=https://api.your-domain.com
VITE_AUTH_CALLBACK_URL=https://your-domain.com
```

### Security Configuration

#### Environment Variable Validation
```typescript
// src/utils/envValidation.ts
interface EnvConfig {
  VITE_GOOGLE_CLIENT_ID: string;
  VITE_GOOGLE_API_KEY: string;
  VITE_GOOGLE_CALENDAR_API_KEY: string;
  VITE_GOOGLE_GMAIL_API_KEY: string;
  VITE_GOOGLE_CONTACTS_API_KEY: string;
  VITE_APP_ENVIRONMENT: string;
}

export const validateEnvironment = (): EnvConfig => {
  const requiredVars = [
    'VITE_GOOGLE_CLIENT_ID',
    'VITE_GOOGLE_API_KEY',
    'VITE_GOOGLE_CALENDAR_API_KEY',
    'VITE_GOOGLE_GMAIL_API_KEY',
    'VITE_GOOGLE_CONTACTS_API_KEY'
  ];

  const missing = requiredVars.filter(varName => !import.meta.env[varName]);

  if (missing.length > 0) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return {
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID!,
    VITE_GOOGLE_API_KEY: import.meta.env.VITE_GOOGLE_API_KEY!,
    VITE_GOOGLE_CALENDAR_API_KEY: import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY!,
    VITE_GOOGLE_GMAIL_API_KEY: import.meta.env.VITE_GOOGLE_GMAIL_API_KEY!,
    VITE_GOOGLE_CONTACTS_API_KEY: import.meta.env.VITE_GOOGLE_CONTACTS_API_KEY!,
    VITE_APP_ENVIRONMENT: import.meta.env.VITE_APP_ENVIRONMENT || 'development'
  };
};
```

## Testing & Validation

### 1. Automated Testing

#### Unit Tests
```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

#### Integration Tests
```bash
# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

#### Security Tests
```bash
# Run security audit
npm run security-audit

# Fix security vulnerabilities
npm run security-fix

# Run dependency check
npm audit
```

### 2. Manual Testing Checklist

#### Authentication Testing
- [ ] Google OAuth flow completes successfully
- [ ] User profile information loads correctly
- [ ] Token refresh works properly
- [ ] Sign-out clears all stored data
- [ ] Session persistence across page reloads

#### API Integration Testing
- [ ] Google Calendar API integration works
- [ ] Gmail API integration works
- [ ] Google Contacts API integration works
- [ ] API error handling works properly
- [ ] Rate limiting prevents API abuse

#### Feature Testing
- [ ] Journal entries can be created and saved
- [ ] Tasks can be created, updated, and deleted
- [ ] Calendar events sync properly
- [ ] Email functionality works
- [ ] Contact management functions correctly

#### Security Testing
- [ ] XSS protection works for all inputs
- [ ] CSRF protection is active
- [ ] Content Security Policy is enforced
- [ ] User data isolation is working
- [ ] Sensitive data is properly encrypted

### 3. Performance Testing

#### Load Testing
```bash
# Install load testing tools
npm install -g artillery

# Run load test
artillery run load-test-config.yml
```

#### Performance Monitoring
```typescript
// Enable performance monitoring
if (import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING === 'true') {
  // Initialize performance monitoring
  import('./utils/performanceMonitor').then(monitor => {
    monitor.initialize();
  });
}
```

## Production Deployment

### Vercel Deployment (Recommended)

#### Prerequisites
- Vercel account
- Connected Git repository
- Configured environment variables

#### Step-by-Step Deployment

1. **Install Vercel CLI**
```bash
npm install -g vercel
vercel login
```

2. **Deploy Application**
```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

3. **Configure Environment Variables in Vercel Dashboard**
```
Go to: Vercel Dashboard → Your Project → Settings → Environment Variables

Add all production environment variables:
- VITE_GOOGLE_CLIENT_ID
- VITE_GOOGLE_CALENDAR_API_KEY
- VITE_GOOGLE_GMAIL_API_KEY
- VITE_GOOGLE_CONTACTS_API_KEY
```

4. **Configure Custom Domain** (Optional)
```bash
# Add custom domain
vercel domains add your-domain.com
```

#### Vercel Configuration

Create `vercel.json` in the root directory:

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
    "VITE_GOOGLE_CLIENT_ID": "@google-client-id",
    "VITE_GOOGLE_CALENDAR_API_KEY": "@google-calendar-api-key",
    "VITE_GOOGLE_GMAIL_API_KEY": "@gmail-api-key",
    "VITE_GOOGLE_CONTACTS_API_KEY": "@contacts-api-key"
  },
  "functions": {
    "api/*.js": {
      "maxDuration": 30
    }
  }
}
```

### Alternative Deployment Options

#### Netlify Deployment
1. **Connect Repository to Netlify**
2. **Configure Build Settings**:
   ```
   Build command: npm run build
   Publish directory: dist
   ```

3. **Set Environment Variables** in Netlify dashboard

#### AWS S3 + CloudFront
1. **Build Application**:
```bash
npm run build
```

2. **Deploy to S3**:
```bash
aws s3 sync dist/ s3://your-bucket-name --delete
```

3. **Configure CloudFront** for CDN

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Monitoring & Maintenance

### Application Monitoring

#### Performance Monitoring
```typescript
// src/utils/monitoring.ts
export class PerformanceMonitor {
  initialize() {
    // Monitor Core Web Vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(this.sendMetric.bind(this));
      getFID(this.sendMetric.bind(this));
      getFCP(this.sendMetric.bind(this));
      getLCP(this.sendMetric.bind(this));
      getTTFB(this.sendMetric.bind(this));
    });
  }

  private sendMetric(metric: any) {
    // Send to monitoring service
    console.log(`Performance metric: ${metric.name}: ${metric.value}`);

    // In production, send to analytics service
    if (import.meta.env.PROD) {
      // analytics.track('performance_metric', metric);
    }
  }
}
```

#### Error Tracking
```typescript
// src/utils/errorTracking.ts
export class ErrorTracker {
  initialize() {
    // Global error handler
    window.addEventListener('error', this.handleError.bind(this));
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
  }

  private handleError(event: ErrorEvent) {
    this.reportError({
      type: 'javascript_error',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack
    });
  }

  private handlePromiseRejection(event: PromiseRejectionEvent) {
    this.reportError({
      type: 'promise_rejection',
      reason: event.reason
    });
  }

  private reportError(error: any) {
    console.error('Application error:', error);

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      // errorReporting.captureException(error);
    }
  }
}
```

### Health Checks

#### API Health Monitoring
```typescript
// src/utils/healthCheck.ts
export class HealthChecker {
  async checkAPIHealth() {
    const checks = [
      this.checkGoogleAPI('calendar'),
      this.checkGoogleAPI('gmail'),
      this.checkGoogleAPI('contacts'),
      this.checkLocalStorage(),
      this.checkAuthentication()
    ];

    const results = await Promise.allSettled(checks);
    return this.aggregateHealthResults(results);
  }

  private async checkGoogleAPI(service: string) {
    try {
      const response = await fetch(`/api/health/${service}`);
      return { service, status: response.ok ? 'healthy' : 'unhealthy' };
    } catch (error) {
      return { service, status: 'error', error: error.message };
    }
  }

  private checkLocalStorage() {
    try {
      localStorage.setItem('health_check', 'test');
      localStorage.removeItem('health_check');
      return { service: 'localStorage', status: 'healthy' };
    } catch (error) {
      return { service: 'localStorage', status: 'error', error: error.message };
    }
  }
}
```

### Maintenance Tasks

#### Regular Maintenance
```bash
# Daily/Weekly tasks
npm run security-audit          # Check for security vulnerabilities
npm run dependency-update       # Update dependencies
npm run performance-test        # Run performance tests
npm run backup-data            # Backup user data (if applicable)
```

#### Automated Maintenance
```yaml
# .github/workflows/maintenance.yml
name: Maintenance Tasks

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2 AM

jobs:
  security-audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm audit --audit-level=moderate

  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npm outdated
```

## Troubleshooting

### Common Issues

#### 1. OAuth Authentication Issues
**Problem**: Google OAuth not working or redirecting incorrectly

**Solution**:
```bash
# Check OAuth configuration
echo "Client ID: $VITE_GOOGLE_CLIENT_ID"
echo "Redirect URI configured correctly?"

# Verify Google Cloud Console settings
# 1. OAuth consent screen is configured
# 2. Client ID is correct
# 3. Redirect URIs include your domain
# 4. Required scopes are added
```

#### 2. API Integration Issues
**Problem**: Google API calls failing

**Solution**:
```typescript
// Debug API configuration
const debugAPIConfig = () => {
  console.log('API Configuration:');
  console.log('Calendar API Key:', import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY ? 'Set' : 'Missing');
  console.log('Gmail API Key:', import.meta.env.VITE_GOOGLE_GMAIL_API_KEY ? 'Set' : 'Missing');
  console.log('Contacts API Key:', import.meta.env.VITE_GOOGLE_CONTACTS_API_KEY ? 'Set' : 'Missing');
};

// Check API connectivity
const testAPIConnectivity = async () => {
  try {
    const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList');
    console.log('Calendar API Status:', response.status);
  } catch (error) {
    console.error('Calendar API Error:', error);
  }
};
```

#### 3. Build Issues
**Problem**: Build failing due to errors or warnings

**Solution**:
```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build

# Check for specific issues
npm run lint           # Check for linting errors
npm run type-check     # Check for TypeScript errors
npm run test           # Run tests to identify issues
```

#### 4. Performance Issues
**Problem**: Application loading slowly or feeling unresponsive

**Solution**:
```typescript
// Performance diagnostics
const diagnosePerformance = () => {
  // Check memory usage
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    console.log(`Memory: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`);
  }

  // Check render performance
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (entry.duration > 100) {
        console.log(`Slow operation: ${entry.name} - ${entry.duration}ms`);
      }
    });
  });

  observer.observe({ entryTypes: ['measure', 'navigation'] });
};
```

### Debug Mode

#### Enable Debug Mode
```typescript
// Enable comprehensive debugging
const enableDebugMode = () => {
  localStorage.setItem('debug', 'true');
  localStorage.setItem('verbose_logging', 'true');

  console.log('🔍 Debug mode enabled');
  console.log('Available commands:');
  console.log('- debugAuth() - Check authentication status');
  console.log('- debugAPI() - Check API configuration');
  console.log('- debugPerformance() - Check performance metrics');
  console.log('- debugStorage() - Check local storage');
};

// Make debug functions available globally
if (typeof window !== 'undefined') {
  (window as any).debug = {
    enableDebugMode,
    debugAuth: () => console.log('Auth status:', getAuthStatus()),
    debugAPI: () => console.log('API config:', getAPIConfig()),
    debugPerformance: () => diagnosePerformance(),
    debugStorage: () => console.log('Storage:', localStorage)
  };
}
```

## Security Hardening

### Production Security Checklist

#### Authentication Security
- [ ] OAuth client secret is properly secured
- [ ] Redirect URIs are properly configured
- [ ] Token refresh is working correctly
- [ ] Session timeout is configured appropriately
- [ ] Multi-factor authentication is encouraged

#### API Security
- [ ] API keys are restricted to specific domains/IPs
- [ ] Rate limiting is configured
- [ ] Input validation is implemented
- [ ] Output encoding is in place
- [ ] Error messages don't leak sensitive information

#### Application Security
- [ ] Content Security Policy is configured
- [ ] XSS protection is active
- [ ] CSRF protection is implemented
- [ ] HTTPS is enforced in production
- [ ] Security headers are configured

#### Data Security
- [ ] Sensitive data is encrypted at rest
- [ ] Data transmission uses HTTPS
- [ ] User data is properly isolated
- [ ] Backup encryption is configured
- [ ] Data retention policies are in place

### Security Monitoring

#### Automated Security Scanning
```bash
# Regular security scans
npm audit                       # Check for vulnerable dependencies
npm run security-audit         # Custom security checks
npm run dependency-check       # Check for outdated dependencies

# Container security (if using Docker)
docker scan productivity-hub:latest
```

#### Security Headers Configuration
```typescript
// src/utils/securityHeaders.ts
export const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "connect-src 'self' https://apis.google.com",
    "font-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};
```

## Performance Optimization

### Build Optimization

#### Vite Configuration Optimization
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2', 'recharts'],
          google: ['googleapis'],
          utils: ['axios', 'date-fns', 'lucide-react']
        }
      }
    },
    sourcemap: false,
    chunkSizeWarningLimit: 500
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'axios', 'date-fns'],
    exclude: ['recharts', 'chart.js', 'googleapis']
  }
});
```

#### Runtime Optimization
```typescript
// src/utils/performanceOptimizations.ts
export class PerformanceOptimizer {
  // Lazy load heavy components
  static lazyLoadComponents() {
    const LazyComponent = lazy(() => import('./HeavyComponent'));
    return <Suspense fallback={<LoadingSpinner />}><LazyComponent /></Suspense>;
  }

  // Debounce expensive operations
  static debounce(func: Function, wait: number) {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Memoize expensive calculations
  static memoize(fn: Function) {
    const cache = new Map();
    return (...args: any[]) => {
      const key = JSON.stringify(args);
      if (cache.has(key)) return cache.get(key);
      const result = fn(...args);
      cache.set(key, result);
      return result;
    };
  }
}
```

### Monitoring and Metrics

#### Core Web Vitals Monitoring
```typescript
// src/utils/webVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function reportWebVitals(onPerfEntry?: (metric: any) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    getCLS(onPerfEntry);
    getFID(onPerfEntry);
    getFCP(onPerfEntry);
    getLCP(onPerfEntry);
    getTTFB(onPerfEntry);
  }
}

// Usage in main.tsx
reportWebVitals((metric) => {
  console.log(`${metric.name}:`, metric.value);

  // Send to analytics in production
  if (import.meta.env.PROD) {
    // analytics.track('web_vital', metric);
  }
});
```

---

This comprehensive setup and deployment guide covers all aspects of setting up, deploying, and maintaining the Productivity Hub application. For additional assistance or specific issues, refer to the troubleshooting section or contact the development team.