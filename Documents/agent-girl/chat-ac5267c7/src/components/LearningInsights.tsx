import React, { useMemo } from 'react';
import { JournalEntry } from '../types';

interface LearningInsightsProps {
  journalEntries: JournalEntry[];
}

const WordCloud: React.FC<{ themes: string[] }> = ({ themes }) => {
  const themeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    themes.forEach(theme => {
      counts[theme] = (counts[theme] || 0) + 1;
    });
    return counts;
  }, [themes]);

  const maxCount = Math.max(...Object.values(themeCounts));

  const getWordSize = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-2xl font-bold';
    if (ratio > 0.6) return 'text-xl font-semibold';
    if (ratio > 0.4) return 'text-lg font-medium';
    if (ratio > 0.2) return 'text-base';
    return 'text-sm';
  };

  const getWordColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.8) return 'text-sage-600 dark:text-sage-400';
    if (ratio > 0.6) return 'text-dusty-blue-600 dark:text-dusty-blue-400';
    if (ratio > 0.4) return 'text-soft-lavender-600 dark:text-soft-lavender-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="flex flex-wrap gap-2 p-4">
      {Object.entries(themeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([theme, count]) => (
          <span
            key={theme}
            className={`${getWordSize(count)} ${getWordColor(count)} capitalize transition-all duration-300 hover:scale-110 cursor-pointer`}
          >
            {theme}
          </span>
        ))}
    </div>
  );
};

const InsightCard: React.FC<{ title: string; content: string; icon: string }> = ({ title, content, icon }) => (
  <div className="glass-card p-4 hover:scale-105 transition-transform duration-300 cursor-pointer">
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h4 className="font-medium text-gray-900 dark:text-white mb-1">{title}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-300">{content}</p>
      </div>
    </div>
  </div>
);

export const LearningInsights: React.FC<LearningInsightsProps> = ({ journalEntries }) => {
  const insights = useMemo(() => {
    const themes = journalEntries.flatMap(entry => entry.themes);
    const allInsights = journalEntries.flatMap(entry => entry.insights);
    const recentEntries = journalEntries.slice(-5);

    const mostImpactful = recentEntries
      .filter(entry => entry.mood >= 8)
      .sort((a, b) => b.mood - a.mood)[0];

    return {
      themes,
      topInsights: allInsights.slice(-3),
      mostImpactful,
      learningStreak: journalEntries.length >= 15 ? 15 : journalEntries.length
    };
  }, [journalEntries]);

  return (
    <div className="space-y-4">
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Learning & Growth Insights</h3>

        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Common Themes</h4>
          <WordCloud themes={insights.themes} />
        </div>

        {insights.mostImpactful && (
          <div className="mb-6 p-4 bg-gradient-to-r from-sage-500/20 to-soft-lavender-500/20 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🌟</span>
              <h4 className="font-medium text-gray-900 dark:text-white">Most Impactful Learning</h4>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">
              "{insights.mostImpactful.content}"
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Mood: {insights.mostImpactful.mood}/10 • {insights.mostImpactful.date.toLocaleDateString()}
            </p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">Recent Insights</h4>
          <div className="space-y-2">
            {insights.topInsights.map((insight, index) => (
              <InsightCard
                key={index}
                title="Key Insight"
                content={insight}
                icon={index === 0 ? '💡' : index === 1 ? '🎯' : '🌱'}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between p-3 bg-sage-500/10 rounded-lg">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Learning Streak</span>
          <span className="text-lg font-bold text-sage-600 dark:text-sage-400">{insights.learningStreak} days 🔥</span>
        </div>
      </div>
    </div>
  );
};