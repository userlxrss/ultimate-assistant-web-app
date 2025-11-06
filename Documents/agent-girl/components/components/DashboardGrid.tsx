import React from 'react';
import { TaskCompletionCard } from './cards/TaskCompletionCard';
import { JournalEntriesCard } from './cards/JournalEntriesCard';
import { MoodEnergyChart } from './cards/MoodEnergyChart';
import { ProductivityScoreChart } from './cards/ProductivityScoreChart';
import { QuickStartButtons } from './cards/QuickStartButtons';

export const DashboardGrid: React.FC = () => {
  return (
    <div className="dashboard-grid">
      {/* Top Row - Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TaskCompletionCard />
        <JournalEntriesCard />
        <MoodEnergyChart />
        <ProductivityScoreChart />
      </div>

      {/* Quick Start Section */}
      <div className="mb-6">
        <QuickStartButtons />
      </div>

      {/* Main Content Area - Charts and Detailed Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood & Energy Trends Chart */}
          <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Mood & Energy Trends</h3>
            <MoodEnergyChart detailed={true} />
          </div>

          {/* Productivity Analysis */}
          <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Productivity Analysis</h3>
            <ProductivityScoreChart detailed={true} />
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {[
                { icon: '✅', text: 'Completed morning meditation', time: '2 hours ago' },
                { icon: '📝', text: 'Journal entry created', time: '5 hours ago' },
                { icon: '🎯', text: 'Goal milestone reached', time: '1 day ago' },
                { icon: '💪', text: 'Habit streak: 7 days', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 glass glass-blur-8 rounded-lg">
                  <span className="text-xl">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs opacity-70">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Upcoming Reminders</h3>
            <div className="space-y-3">
              {[
                { title: 'Evening reflection', time: '8:00 PM', type: 'daily' },
                { title: 'Weekly review', time: 'Tomorrow, 6:00 PM', type: 'weekly' },
                { title: 'Goal deadline', time: 'In 3 days', type: 'goal' },
              ].map((reminder, index) => (
                <div key={index} className="p-3 glass glass-blur-8 rounded-lg border-l-4 border-accent-primary">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm">{reminder.title}</p>
                      <p className="text-xs opacity-70">{reminder.time}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full glass glass-blur-8 ${
                      reminder.type === 'daily' ? 'bg-info/20 text-info' :
                      reminder.type === 'weekly' ? 'bg-warning/20 text-warning' :
                      'bg-success/20 text-success'
                    }`}>
                      {reminder.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};