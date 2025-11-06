import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { MoodEntry } from '../types';
import { format } from 'date-fns';
import { moodChartOptions, createMoodGradient, createEnergyGradient } from '../utils/chartUtils';

interface MoodAnalyticsProps {
  moodData: MoodEntry[];
  days?: number;
}

export const MoodAnalytics: React.FC<MoodAnalyticsProps> = ({ moodData, days = 30 }) => {
  const chartData = useMemo(() => {
    const filteredData = moodData.slice(-days);

    const labels = filteredData.map(entry => format(entry.date, 'MMM dd'));
    const moodValues = filteredData.map(entry => entry.mood);
    const energyValues = filteredData.map(entry => entry.energy);

    return {
      labels,
      datasets: [
        {
          label: 'Mood',
          data: moodValues,
          borderColor: 'rgba(185, 164, 225, 0.8)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            return createMoodGradient(ctx);
          },
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(185, 164, 225, 1)',
          pointBorderColor: 'rgba(255, 255, 255, 0.8)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        },
        {
          label: 'Energy',
          data: energyValues,
          borderColor: 'rgba(105, 180, 145, 0.8)',
          backgroundColor: (context: any) => {
            const ctx = context.chart.ctx;
            return createEnergyGradient(ctx);
          },
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgba(105, 180, 145, 1)',
          pointBorderColor: 'rgba(255, 255, 255, 0.8)',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
        }
      ]
    };
  }, [moodData, days]);

  const averageMood = useMemo(() => {
    const recentData = moodData.slice(-days);
    return (recentData.reduce((sum, entry) => sum + entry.mood, 0) / recentData.length).toFixed(1);
  }, [moodData, days]);

  const averageEnergy = useMemo(() => {
    const recentData = moodData.slice(-days);
    return (recentData.reduce((sum, entry) => sum + entry.energy, 0) / recentData.length).toFixed(1);
  }, [moodData, days]);

  return (
    <div className="glass-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Mood & Energy Analytics</h3>
        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-soft-lavender-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Avg Mood: {averageMood}/10</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sage-500"></div>
            <span className="text-gray-600 dark:text-gray-300">Avg Energy: {averageEnergy}/10</span>
          </div>
        </div>
      </div>
      <div className="h-64">
        <Line data={chartData} options={moodChartOptions} />
      </div>
    </div>
  );
};