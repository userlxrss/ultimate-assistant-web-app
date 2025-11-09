import React from 'react';
import { TaskCompletionCard } from './cards/TaskCompletionCard';
import { JournalEntriesCard } from './cards/JournalEntriesCard';
import { MoodEnergyChart } from './cards/MoodEnergyChart';
import { ProductivityScoreChart } from './cards/ProductivityScoreChart';
import { QuickStartButtons } from './cards/QuickStartButtons';

export const DashboardGrid: React.FC = () => {
  return (
    <div className="premium-padding-xl premium-gap-xl">
      {/* Welcome Header */}
      <div className="premium-padding-lg premium-glass-card premium-glow-blue premium-animate-in">
        <h1 className="premium-text-primary premium-heading-1 mb-4">
          Welcome back! 👋
        </h1>
        <p className="premium-text-secondary text-lg">
          Here's what's happening with your productivity today.
        </p>
      </div>

      {/* Top Row - Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <TaskCompletionCard />
        <JournalEntriesCard />
        <MoodEnergyChart />
        <ProductivityScoreChart />
      </div>

      {/* Quick Start Section */}
      <div className="mb-8">
        <QuickStartButtons />
      </div>

      {/* Main Content Area - Charts and Detailed Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 premium-gap-lg">
          {/* Mood & Energy Trends Chart */}
          <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-purple">
            <h3 className="premium-text-primary premium-heading-3 mb-6">Mood & Energy Trends</h3>
            <MoodEnergyChart detailed={true} />
          </div>

          {/* Productivity Analysis */}
          <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in premium-glow-blue">
            <h3 className="premium-text-primary premium-heading-3 mb-6">Productivity Analysis</h3>
            <ProductivityScoreChart detailed={true} />
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="premium-gap-lg">
          {/* Recent Activity */}
          <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in">
            <h3 className="premium-text-primary premium-heading-3 mb-6">Recent Activity</h3>
            <div className="premium-gap-md">
              {[
                { icon: '✅', text: 'Completed morning meditation', time: '2 hours ago' },
                { icon: '📝', text: 'Journal entry created', time: '5 hours ago' },
                { icon: '🎯', text: 'Goal milestone reached', time: '1 day ago' },
                { icon: '💪', text: 'Habit streak: 7 days', time: '1 day ago' },
              ].map((activity, index) => (
                <div key={index} className="premium-glass-card premium-padding-md premium-hover-lift flex items-start">
                  <span className="text-2xl mr-4">{activity.icon}</span>
                  <div className="flex-1">
                    <p className="premium-text-primary font-medium">{activity.text}</p>
                    <p className="premium-text-tiny mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights - Premium Card */}
          <div className="premium-glass-insights premium-padding-lg premium-hover-lift premium-animate-in">
            <h3 className="premium-text-primary premium-heading-3 mb-6 flex items-center">
              <span className="premium-icon-bg-purple p-2 mr-3 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              AI Insights
            </h3>
            <div className="premium-gap-md">
              <div className="premium-glass-card premium-padding-md border-l-4 border-purple-500">
                <p className="premium-text-secondary font-medium mb-2">Peak Performance Time</p>
                <p className="premium-text-tiny">Your productivity peaks between 9-11 AM. Schedule important tasks during this window.</p>
              </div>
              <div className="premium-glass-card premium-padding-md border-l-4 border-blue-500">
                <p className="premium-text-secondary font-medium mb-2">Mood Correlation</p>
                <p className="premium-text-tiny">Higher energy levels correlate with better mood. Consider morning exercise.</p>
              </div>
              <div className="premium-glass-card premium-padding-md border-l-4 border-green-500">
                <p className="premium-text-secondary font-medium mb-2">Streak Alert</p>
                <p className="premium-text-tiny">You're on a 7-day journaling streak! Keep it going for maximum benefits.</p>
              </div>
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="premium-glass-card premium-padding-lg premium-hover-lift premium-animate-in">
            <h3 className="premium-text-primary premium-heading-3 mb-6">Upcoming Reminders</h3>
            <div className="premium-gap-md">
              {[
                { title: 'Evening reflection', time: '8:00 PM', type: 'daily', color: 'blue' },
                { title: 'Weekly review', time: 'Tomorrow, 6:00 PM', type: 'weekly', color: 'purple' },
                { title: 'Goal deadline', time: 'In 3 days', type: 'goal', color: 'amber' },
              ].map((reminder, index) => (
                <div key={index} className="premium-glass-card premium-padding-md premium-hover-lift border-l-4"
                     style={{ borderColor: reminder.color === 'blue' ? '#3b82f6' :
                                             reminder.color === 'purple' ? '#8b5cf6' : '#f59e0b' }}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="premium-text-primary font-medium">{reminder.title}</p>
                      <p className="premium-text-tiny mt-1">{reminder.time}</p>
                    </div>
                    <span className={`text-xs premium-padding-sm premium-rounded-lg font-medium ${
                      reminder.type === 'daily' ? 'bg-blue-500/20 text-blue-300' :
                      reminder.type === 'weekly' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-amber-500/20 text-amber-300'
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