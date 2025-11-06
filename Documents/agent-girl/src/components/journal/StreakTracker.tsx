import React from 'react';
import { Flame, Calendar, Trophy } from 'lucide-react';

interface ExtendedJournalEntry {
  date: Date;
  id: string;
}

interface StreakTrackerProps {
  entries: ExtendedJournalEntry[];
}

const StreakTracker: React.FC<StreakTrackerProps> = ({ entries }) => {
  const calculateStreaks = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const entryDates = entries
      .map(entry => {
        const date = new Date(entry.date);
        date.setHours(0, 0, 0, 0);
        return date;
      })
      .sort((a, b) => b.getTime() - a.getTime());

    // Current streak
    let currentStreak = 0;
    let checkDate = new Date(today);

    while (currentStreak < entryDates.length) {
      const entryIndex = entryDates.findIndex(date => date.getTime() === checkDate.getTime());
      if (entryIndex === -1) break;

      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    let lastDate: Date | null = null;

    const sortedDates = entryDates.sort((a, b) => a.getTime() - b.getTime());

    for (const date of sortedDates) {
      if (lastDate && (date.getTime() - lastDate.getTime()) === 24 * 60 * 60 * 1000) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
      lastDate = date;
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    // Total entries this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const thisMonthEntries = entryDates.filter(date => date >= thisMonth).length;

    return {
      currentStreak,
      longestStreak,
      thisMonthEntries
    };
  };

  const { currentStreak, longestStreak, thisMonthEntries } = calculateStreaks();

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600 dark:text-purple-400';
    if (streak >= 14) return 'text-orange-600 dark:text-orange-400';
    if (streak >= 7) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStreakMessage = (streak: number) => {
    if (streak >= 30) return "Amazing! You're a journaling master!";
    if (streak >= 14) return "Fantastic! Keep it going!";
    if (streak >= 7) return "Great job! One week strong!";
    if (streak >= 3) return "Good momentum! Stay consistent!";
    if (streak >= 1) return "Keep going!";
    return "Start your streak today!";
  };

  return (
    <div className="glass-card">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Streak Tracker</h3>
      </div>

      <div className="space-y-4">
        {/* Current Streak */}
        <div className="text-center">
          <div className={`text-3xl font-bold ${getStreakColor(currentStreak)}`}>
            {currentStreak}
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">Current Streak</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {getStreakMessage(currentStreak)}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-xl glass">
            <Trophy className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {longestStreak}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">Longest</p>
          </div>
          <div className="text-center p-3 rounded-xl glass">
            <Calendar className="w-5 h-5 text-sage-500 mx-auto mb-1" />
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {thisMonthEntries}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">This Month</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-300 mb-1">
            <span>Progress to next milestone</span>
            <span>{Math.min(currentStreak, 7)}/7 days</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-sage-500 to-dusty-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((currentStreak % 7) * 100 / 7, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;