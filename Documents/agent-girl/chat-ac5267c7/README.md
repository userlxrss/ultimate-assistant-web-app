# Productivity Hub - Your Personal Assistant

A comprehensive productivity assistant that brings together journal, tasks, calendar, email, contacts, and powerful analytics in one beautiful interface. Built with React, TypeScript, and featuring modern glassmorphism design patterns.

## Features

### 🗓️ Calendar Integration
- **Google Calendar Sync**: Real-time calendar integration and event management
- **Motion API Integration**: Advanced task scheduling and time management
- **Smart Event Suggestions**: AI-powered recommendations for optimal scheduling
- **Meeting Load Analytics**: Visual representation of meeting time vs work hours

### 📝 Journal & Tasks
- **Personal Journal**: Rich text journaling with mood tracking and insights
- **Task Management**: Create, organize, and track tasks with priorities and deadlines
- **Productivity Analytics**: Task completion rates and performance metrics
- **Smart Reminders**: Intelligent notifications for important tasks and events

### 📧 Email & Contacts
- **Gmail Integration**: Full Gmail IMAP integration with email management
- **Contact Management**: CardDAV integration for comprehensive contact handling
- **Email Analytics**: Activity tracking and communication patterns
- **Quick Compose**: Fast email drafting and response templates

### 📊 Analytics & Insights
- **Comprehensive Dashboard**: At-a-glance stats with trend indicators
- **Mood & Energy Tracking**: 30-day interactive charts with gradient fills
- **Productivity Score**: Calculated 1-100 score with trend visualization
- **Weekly Comparisons**: This week vs last week performance metrics
- **AI-Powered Insights**: Pattern recognition, recommendations, and motivation
- **Recent Activity Timeline**: Last 15 activities with categorized icons
- **Upcoming Events Preview**: Next 5 events with live countdown timers

### 🎨 Design Features
- **Glassmorphism Design**: Frosted glass effects with backdrop blur
- **Dark/Light Mode**: Full theme support with smooth transitions
- **Responsive Layout**: Adapts seamlessly to desktop, tablet, and mobile
- **Gender-Neutral Colors**: Sage green, dusty blue, and soft lavender palette
- **Micro-interactions**: Hover effects, animations, and smooth transitions

### ⚙️ Features & Customization
- **Date Range Selector**: 7, 30, 60, 90 days, or yearly views
- **Widget Layout Options**: Default, compact, detailed, or custom layouts
- **Export Functionality**: PDF reports, CSV data, and JSON exports
- **Settings Panel**: Persistent preferences and customization options
- **OAuth Authentication**: Secure Google authentication for all services
- **Real-time Sync**: Live synchronization across all connected services
- **Quick Actions Bar**: One-click access to journal, tasks, events, email, and contacts

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Backend**: Express.js with OAuth and session management
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Charts & Analytics**: Chart.js, recharts for data visualization
- **Icons**: Lucide React for beautiful UI icons
- **Authentication**: Google OAuth 2.0 with secure session handling
- **Email Integration**: Gmail IMAP and nodemailer
- **Calendar Integration**: Google Calendar API and Motion API
- **Contact Integration**: CardDAV protocol support
- **Database**: Firebase for real-time data storage
- **Date Handling**: date-fns for comprehensive date manipulation
- **Build Tool**: Vite with ultra-fast hot module replacement
- **State Management**: React hooks and context API

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd productivity-hub
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Create a .env file in the root directory
cp .env.example .env
# Edit .env with your Google OAuth credentials
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

6. Configure your integrations:
   - Go to the OAuth tab to connect Google services
   - Set up Gmail IMAP access
   - Configure Motion API for advanced task management
   - Set up CardDAV for contact synchronization

### Build for Production

```bash
npm run build
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run gmail-server` - Start Gmail IMAP server
- `npm run oauth-server` - Start OAuth authentication server
- `npm run security-audit` - Audit dependencies for security issues
- `npm run install-oauth-deps` - Install OAuth-specific dependencies

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── DashboardStats.tsx
│   ├── MoodAnalytics.tsx
│   ├── ProductivityMetrics.tsx
│   ├── RecentActivity.tsx
│   ├── UpcomingEvents.tsx
│   ├── QuickActions.tsx
│   ├── AIInsights.tsx
│   ├── WeeklyComparison.tsx
│   ├── ProductivityScore.tsx
│   ├── CalendarIntegration.tsx
│   ├── EmailIntegration.tsx
│   ├── ContactManager.tsx
│   ├── Journal.tsx
│   ├── Tasks.tsx
│   └── Settings.tsx
├── pages/               # Page components
│   ├── JournalPage.tsx
│   ├── TasksPage.tsx
│   ├── CalendarPage.tsx
│   ├── EmailPage.tsx
│   ├── ContactsPage.tsx
│   └── AnalyticsPage.tsx
├── services/           # External service integrations
│   ├── googleCalendar.ts
│   ├── gmailService.ts
│   ├── motionAPI.ts
│   ├── carddavService.ts
│   └── authService.ts
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── dataGenerator.ts
│   ├── chartUtils.ts
│   ├── apiHelpers.ts
│   └── helpers.ts
├── hooks/              # Custom React hooks
├── context/            # React context providers
├── App.tsx            # Root component
├── main.tsx           # Application entry point
└── index.css          # Global styles
```

## Integrations

### Google Services Setup
1. Create a Google Cloud Project
2. Enable Google Calendar API, Gmail API, and People API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URIs for your domain
5. Configure environment variables with your credentials

### Motion API Setup
1. Sign up at [usemotion.com](https://usemotion.com)
2. Generate API key from developer dashboard
3. Configure API key in OAuth settings

### Gmail IMAP Setup
1. Enable 2-factor authentication on your Google account
2. Generate an app password
3. Configure IMAP credentials in settings

## Key Features

### Journal Integration
- Rich text journaling with mood tracking
- Daily prompts and reflection questions
- Emotional pattern analysis and insights
- Export journal entries as PDF or markdown

### Task Management
- Create, organize, and prioritize tasks
- Smart task suggestions based on calendar events
- Progress tracking and completion analytics
- Integration with Motion API for advanced scheduling

### Calendar Integration
- Google Calendar synchronization
- Smart event suggestions and scheduling
- Meeting load analysis and optimization
- Conflict detection and resolution

### Email Integration
- Gmail IMAP integration for email management
- Email analytics and communication patterns
- Quick compose and response templates
- Automated email categorization

### Contact Management
- CardDAV protocol support for contact sync
- Contact analytics and interaction tracking
- Smart contact suggestions and organization
- Export contacts in various formats

### Analytics Dashboard
- Comprehensive productivity metrics
- Mood and energy trend analysis
- Time tracking and productivity scoring
- Weekly and monthly performance comparisons
- AI-powered insights and recommendations

### Security & Privacy
- OAuth 2.0 authentication for all services
- End-to-end encryption for sensitive data
- Local data storage with optional cloud sync
- GDPR-compliant data handling

## Customization

### Glassmorphism Effects
The glassmorphism design uses:
- `backdrop-blur-md` for frosted glass effect
- `bg-white/20` and `bg-white/10` for transparency
- `border-white/20` for subtle borders
- `shadow-glass` for depth

### Color Scheme
- **Sage Green**: Primary accent for positive metrics
- **Dusty Blue**: Secondary accent for neutral elements
- **Soft Lavender**: Tertiary accent for creative elements
- **Gender-neutral palette** that works for all users

### Animations
- Hover effects with `scale-105` transformations
- Smooth transitions with `duration-300`
- Fade-in animations with staggered delays
- Pulse animations for live elements

## Performance Optimizations

- React.memo for component optimization
- useMemo for expensive calculations
- Lazy loading of chart data
- Efficient data filtering and aggregation
- Optimized re-renders with proper dependency arrays

## Accessibility

- Semantic HTML structure
- ARIA labels for screen readers
- Keyboard navigation support
- High contrast ratios for text
- Focus indicators for interactive elements

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- Real-time data integration
- Advanced filtering and search
- Custom widget creation
- Team collaboration features
- Mobile app version
- Advanced AI insights
- Integration with popular productivity tools# Trigger deployment for authentication fix - Tue  4 Nov 2025 10:51:46 PST
