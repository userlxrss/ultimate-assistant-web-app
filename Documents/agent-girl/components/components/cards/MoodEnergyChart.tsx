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
    if (mood >= 8) return 'bg-success';
    if (mood >= 6) return 'bg-primary';
    if (mood >= 4) return 'bg-warning';
    return 'bg-error';
  };

  const getEnergyColor = (energy: number) => {
    if (energy >= 7) return 'bg-success';
    if (energy >= 5) return 'bg-info';
    if (energy >= 3) return 'bg-warning';
    return 'bg-error';
  };

  if (detailed) {
    return (
      <div className="space-y-6">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="glass glass-blur-8 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">{getMoodEmoji(currentMood)}</div>
            <div className="text-sm opacity-70">Current Mood</div>
            <div className="text-xl font-bold">{currentMood}/10</div>
          </div>
          <div className="glass glass-blur-8 rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">{getEnergyEmoji(currentEnergy)}</div>
            <div className="text-sm opacity-70">Current Energy</div>
            <div className="text-xl font-bold">{currentEnergy}/10</div>
          </div>
        </div>

        {/* Chart */}
        <div className="glass glass-blur-8 rounded-lg p-4">
          <h4 className="font-medium mb-4">7-Day Trend</h4>
          <div className="space-y-3">
            {moodData.map((data, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-12 text-sm opacity-70">{data.day}</div>
                <div className="flex-1 flex gap-2 items-center">
                  <div className="flex-1 bg-secondary/20 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${getMoodColor(data.mood)} rounded-full transition-all duration-500`}
                      style={{ width: `${data.mood * 10}%` }}
                    />
                  </div>
                  <div className="flex-1 bg-secondary/20 rounded-full h-6 overflow-hidden">
                    <div
                      className={`h-full ${getEnergyColor(data.energy)} rounded-full transition-all duration-500`}
                      style={{ width: `${data.energy * 10}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2 text-sm">
                  <span>{data.mood}</span>
                  <span>{data.energy}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-4 text-xs opacity-70">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-primary rounded" />
              <span>Mood</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-info rounded" />
              <span>Energy</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6 hover:shadow-xl transition-all duration-300 group cursor-pointer">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">Mood & Energy</h3>
          <p className="text-sm opacity-70">Today's status</p>
        </div>
        <div className="glass glass-blur-8 rounded-lg p-2 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>

      {/* Current Mood & Energy */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-3xl mb-2">{getMoodEmoji(currentMood)}</div>
          <div className="text-sm opacity-70">Mood</div>
          <div className="text-xl font-bold">{currentMood}/10</div>
        </div>
        <div className="text-center">
          <div className="text-3xl mb-2">{getEnergyEmoji(currentEnergy)}</div>
          <div className="text-sm opacity-70">Energy</div>
          <div className="text-xl font-bold">{currentEnergy}/10</div>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="space-y-2 mb-4">
        {moodData.slice(-3).map((data, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-8 text-xs opacity-70">{data.day}</div>
            <div className="flex-1 bg-secondary/20 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500"
                style={{ width: `${data.mood * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <button className="glass-button glass-button-primary flex-1 text-sm">
          Log Mood
        </button>
        <button className="glass-button glass-button-secondary text-sm px-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </div>
  );
};