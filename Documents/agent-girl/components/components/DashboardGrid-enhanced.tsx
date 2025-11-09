import React from 'react';
import { TaskCompletionCard } from './cards/TaskCompletionCard';
import { JournalEntriesCard } from './cards/JournalEntriesCard';
import { MoodEnergyChart } from './cards/MoodEnergyChart';
import { ProductivityScoreChart } from './cards/ProductivityScoreChart';
import { QuickStartButtons } from './cards/QuickStartButtons';
import { BarChart3, TrendingUp, Calendar, Clock, Target, Activity } from 'lucide-react';

export const DashboardGridEnhanced: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Top Row - Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TaskCompletionCard />
        <JournalEntriesCard />
        <MoodEnergyChart />
        <ProductivityScoreChart />
      </div>

      {/* Quick Start Section */}
      <div className="premium-card">
        <QuickStartButtons />
      </div>

      {/* Main Content Area - Charts and Detailed Views */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Mood & Energy Trends Chart */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Mood & Energy Trends</h3>
            </div>
            <MoodEnergyChart detailed={true} />
          </div>

          {/* Productivity Analysis */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Productivity Analysis</h3>
            </div>
            <ProductivityScoreChart detailed={true} />
          </div>

          {/* Weekly Overview */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Weekly Overview</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stats-card p-4 text-center">
                <div className="text-2xl font-bold text-green-400">87%</div>
                <div className="text-sm premium-text-secondary">Tasks Completed</div>
                <div className="text-xs premium-text-muted">+12% from last week</div>
              </div>
              <div className="stats-card p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">7.2</div>
                <div className="text-sm premium-text-secondary">Avg Mood</div>
                <div className="text-xs premium-text-muted">+0.5 from last week</div>
              </div>
              <div className="stats-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">42h</div>
                <div className="text-sm premium-text-secondary">Focus Time</div>
                <div className="text-xs premium-text-muted">+5h from last week</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions & Info */}
        <div className="space-y-6">
          {/* Recent Activity */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Recent Activity</h3>
            </div>
            <div className="space-y-3">
              {[
                { icon: '✅', text: 'Completed morning meditation', time: '2 hours ago', type: 'habit' },
                { icon: '📝', text: 'Journal entry created', time: '5 hours ago', type: 'journal' },
                { icon: '🎯', text: 'Goal milestone reached', time: '1 day ago', type: 'goal' },
                { icon: '💪', text: 'Habit streak: 7 days', time: '1 day ago', type: 'streak' },
                { icon: '⏰', text: 'Focus session: 45min', time: '2 days ago', type: 'focus' },
              ].map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 premium-card hover:scale-[1.02] transition-all duration-300 cursor-pointer">
                  <span className="text-xl flex-shrink-0">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium premium-text-primary">{activity.text}</p>
                    <p className="text-xs premium-text-muted">{activity.time}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    activity.type === 'habit' ? 'bg-green-400' :
                    activity.type === 'journal' ? 'bg-blue-400' :
                    activity.type === 'goal' ? 'bg-purple-400' :
                    activity.type === 'streak' ? 'bg-orange-400' :
                    'bg-yellow-400'
                  }`} />
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Reminders */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-5 h-5 text-red-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Upcoming Reminders</h3>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Evening reflection', time: '8:00 PM', type: 'daily', priority: 'medium' },
                { title: 'Weekly review', time: 'Tomorrow, 6:00 PM', type: 'weekly', priority: 'high' },
                { title: 'Goal deadline', time: 'In 3 days', type: 'goal', priority: 'high' },
                { title: 'Team meeting', time: 'Friday, 2:00 PM', type: 'meeting', priority: 'medium' },
              ].map((reminder, index) => (
                <div key={index} className="p-3 premium-card hover:scale-[1.02] transition-all duration-300 border-l-4 cursor-pointer"
                     style={{
                       borderLeftColor: reminder.type === 'daily' ? '#60A5FA' :
                                        reminder.type === 'weekly' ? '#F59E0B' :
                                        reminder.type === 'goal' ? '#8B5CF6' :
                                        '#EF4444'
                     }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm premium-text-primary truncate">{reminder.title}</p>
                      <p className="text-xs premium-text-muted">{reminder.time}</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        reminder.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {reminder.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="premium-card">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold premium-text-primary">Quick Actions</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button className="premium-button p-3 text-center text-sm hover:scale-[1.02] transition-all duration-300">
                <span className="block text-lg mb-1">📝</span>
                <span>New Entry</span>
              </button>
              <button className="premium-button p-3 text-center text-sm hover:scale-[1.02] transition-all duration-300">
                <span className="block text-lg mb-1">⏰</span>
                <span>Start Focus</span>
              </button>
              <button className="premium-button p-3 text-center text-sm hover:scale-[1.02] transition-all duration-300">
                <span className="block text-lg mb-1">📊</span>
                <span>View Stats</span>
              </button>
              <button className="premium-button p-3 text-center text-sm hover:scale-[1.02] transition-all duration-300">
                <span className="block text-lg mb-1">🎯</span>
                <span>Set Goals</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section - Insights & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Insights */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🤖</span>
            <h3 className="text-lg font-semibold premium-text-primary">AI Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
              <h4 className="font-medium premium-text-primary mb-2">Productivity Pattern</h4>
              <p className="text-sm premium-text-secondary">
                You're most productive between 9-11 AM. Consider scheduling important tasks during this window.
              </p>
            </div>
            <div className="p-4 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
              <h4 className="font-medium premium-text-primary mb-2">Mood Correlation</h4>
              <p className="text-sm premium-text-secondary">
                Your mood scores improve on days with journal entries. Keep up the great work!
              </p>
            </div>
          </div>
        </div>

        {/* Habit Tracker */}
        <div className="premium-card">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔥</span>
            <h3 className="text-lg font-semibold premium-text-primary">Habit Tracker</h3>
          </div>
          <div className="space-y-3">
            {[
              { name: 'Morning Meditation', streak: 7, color: 'text-purple-400' },
              { name: 'Journal Entry', streak: 5, color: 'text-blue-400' },
              { name: 'Exercise', streak: 3, color: 'text-green-400' },
              { name: 'Reading', streak: 12, color: 'text-orange-400' },
            ].map((habit, index) => (
              <div key={index} className="flex items-center justify-between p-3 premium-card hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{index === 0 ? '🧘' : index === 1 ? '📝' : index === 2 ? '💪' : '📚'}</span>
                  <div>
                    <p className="text-sm font-medium premium-text-primary">{habit.name}</p>
                    <p className="text-xs premium-text-muted">Current streak</p>
                  </div>
                </div>
                <div className={`text-2xl font-bold ${habit.color}`}>
                  {habit.streak}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};