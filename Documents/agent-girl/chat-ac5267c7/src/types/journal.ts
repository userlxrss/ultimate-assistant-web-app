export interface ExtendedJournalEntry {
  id: string;
  date: Date;
  title?: string;
  mood: number;
  energy: number;
  reflections?: string;
  gratitude?: string;
  biggestWin?: string;
  challenge?: string;
  learning?: string;
  tomorrowFocus?: string;
  tags?: string[];
  affirmations?: string[];
  weather?: string;
  location?: string;
  content?: string;
  themes?: string[];
  insights?: string[];
  template?: string;
  isDraft?: boolean;
  lastSaved?: Date;
}

export interface JournalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  content: string;
}

export interface MoodData {
  date: Date;
  mood: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  thisMonthEntries: number;
}

export interface JournalFilter {
  searchQuery: string;
  selectedTags: string[];
  moodRange: [number, number];
  dateRange?: {
    start: Date;
    end: Date;
  };
}