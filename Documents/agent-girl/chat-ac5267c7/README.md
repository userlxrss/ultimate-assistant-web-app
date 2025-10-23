# Analytics Dashboard with Glassmorphism Design

A comprehensive productivity analytics dashboard built with React, TypeScript, and Chart.js featuring modern glassmorphism design patterns.

## Features

### 📊 Core Analytics
- **At-a-Glance Stats**: 4 key metric cards with trend indicators
- **Mood & Energy Analytics**: 30-day interactive line graphs with gradient fills
- **Learning & Growth Insights**: Word cloud visualization and impactful learning highlights
- **Productivity Metrics**: Task completion rates, calendar breakdowns, email activity, and contact growth

### 🎯 Smart Features
- **Recent Activity Timeline**: Last 15 activities with categorized icons
- **Upcoming Events Preview**: Next 5 events with live countdown timers
- **Quick Actions Bar**: One-click access to journal, tasks, events, email, and contacts
- **AI-Powered Insights**: Pattern recognition, recommendations, and motivational insights
- **Weekly Comparison**: This week vs last week performance metrics
- **Productivity Score**: Calculated 1-100 score with trend visualization
- **Meeting Load Indicator**: Visual representation of meeting time vs work hours

### 🎨 Design Features
- **Glassmorphism Design**: Frosted glass effects with backdrop blur
- **Dark/Light Mode**: Full theme support with smooth transitions
- **Responsive Layout**: Adapts seamlessly to desktop, tablet, and mobile
- **Gender-Neutral Colors**: Sage green, dusty blue, and soft lavender palette
- **Micro-interactions**: Hover effects, animations, and smooth transitions

### ⚙️ Customization
- **Date Range Selector**: 7, 30, 60, 90 days, or yearly views
- **Widget Layout Options**: Default, compact, detailed, or custom layouts
- **Export Functionality**: PDF reports, CSV data, and JSON exports
- **Settings Panel**: Persistent preferences and customization options

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom glassmorphism utilities
- **Charts**: Chart.js with react-chartjs-2
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **State Management**: React hooks and context

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dashboard-analytics
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/           # React components
│   ├── Dashboard.tsx    # Main dashboard component
│   ├── DashboardStats.tsx
│   ├── MoodAnalytics.tsx
│   ├── LearningInsights.tsx
│   ├── ProductivityMetrics.tsx
│   ├── RecentActivity.tsx
│   ├── UpcomingEvents.tsx
│   ├── QuickActions.tsx
│   ├── AIInsights.tsx
│   ├── WeeklyComparison.tsx
│   ├── ProductivityScore.tsx
│   ├── MeetingLoad.tsx
│   └── Settings.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── dataGenerator.ts # Mock data generation
│   ├── chartUtils.ts    # Chart configuration
│   └── helpers.ts       # Helper functions
├── App.tsx             # Root component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Key Components

### DashboardStats
Displays four key metrics with trend indicators:
- Task Completion Rate
- Total Journal Entries
- Email Activity
- Total Contacts

### MoodAnalytics
Interactive line chart showing mood and energy trends over time with gradient fills and smooth animations.

### ProductivityMetrics
Comprehensive productivity visualizations including:
- Task creation vs completion trends
- Calendar event breakdown (doughnut chart)
- Email activity analysis
- Contact growth over time

### AIInsights
Smart insights panel with:
- Pattern recognition
- Personalized recommendations
- Motivational content
- Priority-based categorization

### QuickActions
One-click access to common tasks:
- Write Journal
- Create Task
- Schedule Event
- Compose Email
- Add Contact

## Data Generation

The dashboard includes sophisticated mock data generation that creates:
- 60 days of realistic mood and energy data
- Task completion patterns with priority weighting
- Journal entries with themes and insights
- Calendar events with various types
- Email activity statistics
- Contact growth over time
- Activity timeline

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
- Integration with popular productivity tools