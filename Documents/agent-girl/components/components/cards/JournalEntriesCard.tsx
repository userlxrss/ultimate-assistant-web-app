import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../index';

export const JournalEntriesCard: React.FC = () => {
  const { theme } = useTheme();
  const [journalStats, setJournalStats] = useState({
    totalEntries: 0,
    thisWeek: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastEntry: null as Date | null,
  });

  const isDark = theme === 'dark' || document.documentElement.classList.contains('dark');

  useEffect(() => {
    // Load real journal data from localStorage
    const loadJournalStats = () => {
      try {
        const savedEntries = localStorage.getItem('journalEntries');
        if (savedEntries) {
          const entries = JSON.parse(savedEntries);

          if (entries && entries.length > 0) {
            // Calculate real statistics
            const now = new Date();
            const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

            // Count entries from this week
            const thisWeekEntries = entries.filter((entry: any) => {
              const entryDate = new Date(entry.date);
              return entryDate >= oneWeekAgo;
            });

            // Find last entry date
            const lastEntryDate = entries.length > 0
              ? new Date(entries[0].date) // Assuming entries are sorted newest first
              : null;

            // Calculate streaks
            const { currentStreak, longestStreak } = calculateStreaks(entries);

            setJournalStats({
              totalEntries: entries.length,
              thisWeek: thisWeekEntries.length,
              currentStreak,
              longestStreak,
              lastEntry: lastEntryDate,
            });
          } else {
            // No entries - show empty state
            setJournalStats({
              totalEntries: 0,
              thisWeek: 0,
              currentStreak: 0,
              longestStreak: 0,
              lastEntry: null,
            });
          }
        } else {
          // No saved entries - show empty state
          setJournalStats({
            totalEntries: 0,
            thisWeek: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastEntry: null,
          });
        }
      } catch (error) {
        console.error('Error loading journal stats:', error);
        // Fallback to empty state on error
        setJournalStats({
          totalEntries: 0,
          thisWeek: 0,
          currentStreak: 0,
          longestStreak: 0,
          lastEntry: null,
        });
      }
    };

    loadJournalStats();

    // Listen for storage changes to update stats in real-time
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'journalEntries') {
        loadJournalStats();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events from the journal component
    const handleJournalUpdate = () => {
      loadJournalStats();
    };

    window.addEventListener('journalEntriesUpdated', handleJournalUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('journalEntriesUpdated', handleJournalUpdate);
    };
  }, []);

  // Calculate streaks from journal entries
  const calculateStreaks = (entries: any[]) => {
    if (!entries || entries.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Sort entries by date (newest first)
    const sortedEntries = [...entries].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Get unique dates (just the date part, not time)
    const uniqueDates = [...new Set(
      sortedEntries.map(entry => new Date(entry.date).toDateString())
    )];

    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's an entry today or yesterday
    const mostRecentDate = new Date(uniqueDates[0]);
    mostRecentDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.floor((today.getTime() - mostRecentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff <= 1) { // Entry from today or yesterday counts as current streak
      currentStreak = 1;

      // Count consecutive days backwards
      for (let i = 1; i < uniqueDates.length; i++) {
        const currentDate = new Date(uniqueDates[i]);
        const previousDate = new Date(uniqueDates[i - 1]);
        currentDate.setHours(0, 0, 0, 0);
        previousDate.setHours(0, 0, 0, 0);

        const dayDifference = Math.abs((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDifference === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      const previousDate = new Date(uniqueDates[i - 1]);
      currentDate.setHours(0, 0, 0, 0);
      previousDate.setHours(0, 0, 0, 0);

      const dayDifference = Math.abs((currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDifference === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'No entries yet';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-400';
    if (streak >= 14) return 'text-green-400';
    if (streak >= 7) return 'text-amber-400';
    return 'text-gray-400';
  };

  return (
    <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-purple h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="premium-text-primary premium-heading-3">Journal Entries</h3>
          <p className="premium-text-muted text-sm">Track your thoughts</p>
        </div>
        <div className="premium-icon-bg-purple p-3 rounded-xl premium-hover-lift">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
      </div>

      {/* Main Stats */}
      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold premium-text-primary mr-2">{journalStats.totalEntries}</span>
          <span className="text-xl premium-text-muted">entries</span>
        </div>
        <div className="premium-text-tiny mt-2">
          {journalStats.thisWeek} this week
        </div>
      </div>

      {/* Streak Information */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="premium-glass-card premium-padding-md text-center">
          <div className={`text-2xl font-bold ${getStreakColor(journalStats.currentStreak)}`}>
            {journalStats.currentStreak}
          </div>
          <div className="premium-text-tiny">
            Current streak
          </div>
        </div>
        <div className="premium-glass-card premium-padding-md text-center">
          <div className="text-2xl font-bold premium-text-secondary">
            {journalStats.longestStreak}
          </div>
          <div className="premium-text-tiny">
            Longest streak
          </div>
        </div>
      </div>

      {/* Last Entry */}
      <div className="flex items-center justify-between pt-4 border-t premium-border-subtle mb-6">
        <span className="premium-text-muted text-sm">Last entry</span>
        <span className="premium-text-secondary font-medium">
          {formatDate(journalStats.lastEntry)}
        </span>
      </div>

      {/* Premium Quick Actions */}
      <div className="flex gap-3">
        <button className="premium-button flex-1 text-sm premium-hover-glow">
          Write Entry
        </button>
        <button className="premium-button-secondary text-sm premium-padding-md premium-rounded-xl premium-hover-lift">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Streak Celebration Animation */}
      {journalStats.currentStreak >= 7 && (
        <div className="absolute top-4 right-4">
          <span className="text-3xl animate-bounce">🔥</span>
        </div>
      )}
    </div>
  );
};