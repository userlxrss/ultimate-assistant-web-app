# Comprehensive Journal Module

A feature-rich journal application with glassmorphism design, built with React, TypeScript, and Tailwind CSS.

## Features

### Core Features
- **Structured Form Interface** with auto-filled date field
- **Reflections Text Area** for detailed journal entries
- **Mood Slider** (1-10 scale, where 10 = peace and joy)
- **Biggest Win Field** to capture daily achievements
- **Learning Field** for insights and takeaways
- **Voice Entry** with simulated auto-transcription
- **Tags System** for categorizing entries
- **Draft Auto-Save** every 30 seconds

### View Modes
- **Form View**: Write and edit journal entries
- **Calendar View**: Visual monthly calendar with mood indicators
- **List View**: Sortable list with search and filters

### Analytics & Insights
- **Mood Tracker Graph**: Visual mood trends over time
- **Streak Tracker**: Current streak, longest streak, and monthly stats
- **Word Cloud**: Most frequently used words in entries
- **Entry Statistics**: Completion rates and usage patterns

### Templates
- **Morning Pages**: Start your day with intention
- **Evening Reflection**: End your day with gratitude
- **Gratitude**: Focus on appreciation
- **Goal Review**: Track progress on objectives

### Search & Filter
- **Full-text search** across all entry content
- **Tag filtering** with multiple selection
- **Mood range filtering** (1-10 scale)
- **Date range selection**

### Additional Features
- **Dark/Light Mode** toggle
- **Edit and Delete** functionality for all entries
- **Responsive Design** for mobile and desktop
- **45 Realistic Entries** pre-generated over 60 days
- **Natural Mood Distribution** (more 5-8, fewer extremes)

## Design System

### Colors
- **Sage Green** (#69b491): Primary action and accent
- **Dusty Blue** (#6886b4): Secondary elements
- **Soft Lavender** (#b9a4e1): Accent and highlights
- **Gender-neutral palette** suitable for all users

### Glassmorphism Effects
- **Backdrop blur** for depth
- **Semi-transparent backgrounds** with blur
- **Subtle borders** and shadows
- **Hover states** with enhanced opacity

### Typography
- Clean, modern font stack
- Consistent spacing and hierarchy
- Readable line heights for long text

## Technical Architecture

### Component Structure
```
src/
├── components/
│   ├── Journal.tsx                 # Main journal component
│   └── journal/
│       ├── MoodChart.tsx          # Mood trend visualization
│       ├── WordCloud.tsx          # Word frequency display
│       ├── StreakTracker.tsx      # Streak statistics
│       ├── EntryTemplates.tsx     # Template selection
│       ├── CalendarView.tsx       # Calendar view component
│       └── ListView.tsx           # List view component
├── types/
│   └── journal.ts                 # TypeScript definitions
├── utils/
│   └── journalUtils.ts            # Helper functions
└── pages/
    └── JournalPage.tsx            # Journal page wrapper
```

### State Management
- **Local state** with React hooks
- **Auto-save** functionality with timers
- **Optimistic updates** for better UX

### Data Flow
1. **Entry Creation**: Form → State → Auto-save → Storage
2. **View Switching**: State updates → Component re-render
3. **Filtering**: Search/Filter → State → Filtered entries
4. **Analytics**: Entries → Processed data → Charts

## Installation & Usage

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser to `http://localhost:5173`

### Build for Production
```bash
npm run build
```

## Data Model

### JournalEntry Interface
```typescript
interface ExtendedJournalEntry {
  id: string;
  date: Date;
  content: string;           // Main reflections
  mood: number;             // 1-10 scale
  themes: string[];         // Auto-generated themes
  insights: string[];       // AI insights
  biggestWin?: string;      // Daily achievement
  learning?: string;        // Key learning
  tags?: string[];          // User-defined tags
  template?: string;        // Template used
  isDraft?: boolean;        // Draft status
  lastSaved?: Date;         // Last save timestamp
}
```

### Mood Scale
- **1-2**: Very Low (😢)
- **3-4**: Low (😔)
- **5-6**: Neutral (😐)
- **7-8**: Good (🙂)
- **9-10**: Excellent (😊)

## Customization

### Adding New Templates
1. Update `EntryTemplates.tsx` with new template
2. Add template logic in `applyTemplate` function
3. Include relevant content prompts

### Extending Analytics
1. Create new chart components in `journal/` directory
2. Add data processing functions in `journalUtils.ts`
3. Include charts in main Journal component

### Modifying Colors
Update `tailwind.config.js` with new color definitions:
```javascript
colors: {
  'your-color': {
    50: '#...',
    500: '#...',
    900: '#...'
  }
}
```

## Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations
- **Virtual scrolling** for large entry lists
- **Debounced search** to prevent excessive re-renders
- **Memoized components** for expensive calculations
- **Lazy loading** for chart components

## Future Enhancements
- [ ] Real voice recording with speech-to-text
- [ ] AI-powered insights and recommendations
- [ ] Export functionality (PDF, JSON)
- [ ] Cloud synchronization
- [ ] Collaborative journaling
- [ ] Advanced analytics with AI
- [ ] Mobile app version

## Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License
This project is open source and available under the [MIT License](LICENSE).