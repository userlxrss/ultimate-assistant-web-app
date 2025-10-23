import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

interface MoodData {
  date: Date;
  mood: number;
}

interface MoodChartProps {
  data: MoodData[];
}

const MoodChart: React.FC<MoodChartProps> = ({ data }) => {
  const chartData = data.slice(-30).map(entry => ({
    date: entry.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    mood: entry.mood,
    fullDate: entry.date
  }));

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return '#10b981'; // green-500
    if (mood >= 6) return '#84cc16'; // lime-500
    if (mood >= 4) return '#eab308'; // yellow-500
    if (mood >= 2) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  const averageMood = chartData.length > 0
    ? chartData.reduce((sum, entry) => sum + entry.mood, 0) / chartData.length
    : 0;

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mood Trends</h3>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-300">Average</p>
          <p className="text-2xl font-bold text-sage-600 dark:text-sage-400">
            {averageMood.toFixed(1)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 10]}
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="glass-card p-3 rounded-lg">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {data.fullDate.toLocaleDateString()}
                    </p>
                    <p className="text-lg font-bold" style={{ color: getMoodColor(data.mood) }}>
                      Mood: {data.mood}/10
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="mood"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#moodGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
        <span>Last 30 days</span>
        <div className="flex items-center gap-2">
          <span>😔</span>
          <div className="w-20 h-2 bg-gradient-to-r from-red-500 via-orange-500 via-yellow-500 via-lime-500 to-green-500 rounded-full"></div>
          <span>😊</span>
        </div>
      </div>
    </div>
  );
};

export default MoodChart;