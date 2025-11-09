import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../index';

interface MoodData {
  day: string;
  mood: number;
  energy: number;
}

interface MoodEnergyChartProps {
  detailed?: boolean;
}

export const MoodEnergyChart: React.FC<MoodEnergyChartProps> = ({ detailed = false }) => {
  const { theme } = useTheme();
  const [moodData, setMoodData] = useState<MoodData[]>([]);

  useEffect(() => {
    // Generate sample mood data for the last 7 days
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = days.map(day => ({
      day,
      mood: Math.floor(Math.random() * 3) + 6, // 6-8 range
      energy: Math.floor(Math.random() * 3) + 5, // 5-7 range
    }));
    setMoodData(data);
  }, []);

  const currentMood = moodData[moodData.length - 1]?.mood || 0;
  const currentEnergy = moodData[moodData.length - 1]?.energy || 0;

  const getMoodEmoji = (mood: number) => {
    if (mood >= 8) return '😊';
    if (mood >= 6) return '🙂';
    if (mood >= 4) return '😐';
    if (mood >= 2) return '😔';
    return '😢';
  };

  const getEnergyEmoji = (energy: number) => {
    if (energy >= 7) return '⚡';
    if (energy >= 5) return '🔋';
    if (energy >= 3) return '🪫';
    return '😴';
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (mood >= 6) return 'bg-gradient-to-r from-blue-500 to-indigo-600';
    if (mood >= 4) return 'bg-gradient-to-r from-amber-500 to-orange-600';
    return 'bg-gradient-to-r from-red-500 to-pink-600';
  };

  const getEnergyColor = (energy: number) => {
    if (energy >= 7) return 'bg-gradient-to-r from-green-500 to-emerald-600';
    if (energy >= 5) return 'bg-gradient-to-r from-cyan-500 to-blue-600';
    if (energy >= 3) return 'bg-gradient-to-r from-amber-500 to-yellow-600';
    return 'bg-gradient-to-r from-gray-500 to-slate-600';
  };

  if (detailed) {
    return (
      <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-blue">
        <h3 className="premium-text-primary premium-heading-3 mb-6">Mood & Energy Trends</h3>

        {/* Current Status */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="premium-glass-card premium-padding-md text-center">
            <div className="text-4xl mb-2">{getMoodEmoji(currentMood)}</div>
            <div className="text-2xl font-bold premium-text-primary mb-1">
              {currentMood}/10
            </div>
            <div className="premium-text-tiny">Current Mood</div>
          </div>

          <div className="premium-glass-card premium-padding-md text-center">
            <div className="text-4xl mb-2">{getEnergyEmoji(currentEnergy)}</div>
            <div className="text-2xl font-bold premium-text-primary mb-1">
              {currentEnergy}/10
            </div>
            <div className="premium-text-tiny">Current Energy</div>
          </div>
        </div>

        {/* Enhanced Chart */}
        <div className="premium-glass-card premium-padding-md mb-6">
          <h4 className="premium-text-secondary font-medium mb-4">7-Day Pattern</h4>
          <div className="space-y-3">
            {moodData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 premium-text-tiny text-sm">{data.day}</div>
                <div className="flex-1 flex gap-2 items-center">
                  <div className="flex-1 bg-gray-700/50 rounded-full h-6 overflow-hidden backdrop-blur-sm">
                    <div
                      className={`h-full ${getMoodColor(data.mood)} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                      style={{ width: `${data.mood * 10}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-700/50 rounded-full h-6 overflow-hidden backdrop-blur-sm">
                    <div
                      className={`h-full ${getEnergyColor(data.energy)} rounded-full transition-all duration-700 ease-out relative overflow-hidden`}
                      style={{ width: `${data.energy * 10}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 premium-text-primary text-sm font-medium">
                  <span>{data.mood}</span>
                  <span>{data.energy}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-6 mt-4 premium-text-tiny text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded"></div>
              <span>Mood</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded"></div>
              <span>Energy</span>
            </div>
          </div>
        </div>

        {/* Insights */}
        <div className="premium-gap-md">
          <div className="premium-glass-card premium-padding-md border-l-4 border-blue-500">
            <p className="premium-text-secondary font-medium mb-1">Weekly Pattern</p>
            <p className="premium-text-tiny">
              Your mood tends to be higher mid-week, while energy peaks on weekends.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-blue h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="premium-text-primary premium-heading-3">Mood & Energy</h3>
          <p className="premium-text-muted text-sm">Today's status</p>
        </div>
        <div className="premium-icon-bg-amber p-3 rounded-xl premium-hover-lift">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Current Mood & Energy */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center">
          <div className="text-4xl mb-2">{getMoodEmoji(currentMood)}</div>
          <div className="premium-text-tiny mb-1">Mood</div>
          <div className="text-2xl font-bold premium-text-primary">{currentMood}/10</div>
        </div>
        <div className="text-center">
          <div className="text-4xl mb-2">{getEnergyEmoji(currentEnergy)}</div>
          <div className="premium-text-tiny mb-1">Energy</div>
          <div className="text-2xl font-bold premium-text-primary">{currentEnergy}/10</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="premium-gap-sm mb-6">
        {moodData.slice(-3).map((data, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-8 premium-text-tiny text-sm">{data.day}</div>
            <div className="flex-1 bg-gray-700/50 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <div
                className={`h-full ${getMoodColor(data.mood)} rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${data.mood * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Premium Quick Actions */}
      <div className="flex gap-3">
        <button className="premium-button flex-1 text-sm premium-hover-glow">
          Log Mood
        </button>
        <button className="premium-button-secondary text-sm premium-padding-md premium-rounded-xl premium-hover-lift">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};