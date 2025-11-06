import React, { useState, useMemo } from 'react';
import { Sun, Moon, Menu, X, Search, Bell, User } from 'lucide-react';
import { DashboardStatsComponent } from './DashboardStats';
import { MoodAnalytics } from './MoodAnalytics';
import { LearningInsights } from './LearningInsights';
import { ProductivityMetrics } from './ProductivityMetrics';
import { RecentActivity } from './RecentActivity';
import { UpcomingEvents } from './UpcomingEvents';
import { QuickActions } from './QuickActions';
import { AIInsights } from './AIInsights';
import { WeeklyComparisonComponent } from './WeeklyComparison';
import { ProductivityScoreComponent } from './ProductivityScore';
import { MeetingLoad } from './MeetingLoad';
import { SettingsPanel } from './Settings';
import {
  DashboardStats,
  Task,
  JournalEntry,
  CalendarEvent,
  Email,
  Contact,
  Activity,
  AIInsight as AIInsightType,
  WeeklyComparison
} from '../types';
import {
  generateMoodData,
  generateTasks,
  generateCalendarEvents,
  generateEmails,
  generateContacts,
  generateActivities,
  generateAIInsights,
  generateWeeklyComparison,
  generateJournalEntries
} from '../utils/dataGenerator';
import {
  calculateProductivityScore,
  calculateTrend,
  subDays
} from '../utils/helpers';

const Dashboard: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  // Use real data from localStorage instead of mock data
  const [data] = useState(() => ({
    moodData: generateMoodData(60),
    tasks: generateTasks(60),
    journalEntries: generateJournalEntries(30), // Generate some mock entries for functionality
    events: generateCalendarEvents(60),
    emails: generateEmails(60),
    contacts: generateContacts(60),
    activities: generateActivities(7),
    aiInsights: generateAIInsights(),
    weeklyComparison: generateWeeklyComparison()
  }));

  // Calculate dashboard stats
  const dashboardStats = useMemo((): DashboardStats => {
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);

    const filteredTasks = data.tasks.filter(task => task.createdAt >= cutoffDate);
    const completedTasks = filteredTasks.filter(task => task.completed);
    const journalEntries = data.journalEntries.filter(entry => entry.date >= cutoffDate);
    const emails = data.emails.filter(email => email.date >= cutoffDate);
    const events = data.events.filter(event => event.date >= cutoffDate);
    const contacts = data.contacts.filter(contact => contact.createdAt >= cutoffDate);

    const recentMoodData = data.moodData.slice(-days);
    const averageMood = recentMoodData.reduce((sum, entry) => sum + entry.mood, 0) / recentMoodData.length;
    const averageEnergy = recentMoodData.reduce((sum, entry) => sum + entry.energy, 0) / recentMoodData.length;

    return {
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      totalJournalEntries: journalEntries.length,
      totalEmails: emails.length,
      totalEvents: events.length,
      totalContacts: contacts.length,
      averageMood: Math.round(averageMood * 10) / 10,
      averageEnergy: Math.round(averageEnergy * 10) / 10,
      productivityScore: calculateProductivityScore(
        completedTasks.length,
        filteredTasks.length,
        averageMood,
        journalEntries.length,
        days
      )
    };
  }, [data, dateRange]);

  // Previous period stats for comparison
  const previousStats = useMemo(() => {
    const days = parseInt(dateRange);
    const startDate = subDays(new Date(), days * 2);
    const endDate = subDays(new Date(), days);

    const filteredTasks = data.tasks.filter(task => task.createdAt >= startDate && task.createdAt < endDate);
    const journalEntries = data.journalEntries.filter(entry => entry.date >= startDate && entry.date < endDate);
    const emails = data.emails.filter(email => email.date >= startDate && email.date < endDate);
    const contacts = data.contacts.filter(contact => contact.createdAt >= startDate && contact.createdAt < endDate);

    return {
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(task => task.completed).length,
      totalJournalEntries: journalEntries.length,
      totalEmails: emails.length,
      totalContacts: contacts.length
    };
  }, [data, dateRange]);

  const productivityTrend = calculateTrend(dashboardStats.productivityScore, dashboardStats.productivityScore - 5);

  const handleQuickAction = (action: string) => {
    console.log('Quick action:', action);
    // Handle quick actions here
  };

  const handleExport = () => {
    console.log('Exporting dashboard data...');
    // Handle export functionality
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <div className="flex h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} glass-card m-4 rounded-2xl transition-all duration-300 overflow-hidden`}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-8">
              <h1 className={`font-bold text-xl text-gray-900 dark:text-white ${!sidebarOpen && 'hidden'}`}>
                Analytics Hub
              </h1>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>

            {sidebarOpen && (
              <nav className="space-y-2">
                {[
                  { icon: '📊', label: 'Dashboard', active: true },
                  { icon: '📝', label: 'Journal', active: false },
                  { icon: '✅', label: 'Tasks', active: false },
                  { icon: '📅', label: 'Calendar', active: false },
                  { icon: '📧', label: 'Email', active: false },
                  { icon: '👥', label: 'Contacts', active: false },
                  { icon: '⚙️', label: 'Settings', active: false }
                ].map((item) => (
                  <button
                    key={item.label}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      item.active
                        ? 'bg-sage-500/20 text-sage-600 dark:text-sage-400 border border-sage-500/30'
                        : 'hover:bg-white/10 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </nav>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Header */}
          <header className="glass-card m-4 rounded-2xl">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Welcome back! 👋
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    Here's your productivity overview for the last {dateRange} days
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 rounded-xl glass-button text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                    />
                  </div>

                  <button className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200 relative">
                    <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  </button>

                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                  >
                    {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                  </button>

                  <button className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          {/* Dashboard Grid */}
          <div className="p-4 space-y-6">
            {/* Stats Cards */}
            <DashboardStatsComponent stats={dashboardStats} previousStats={previousStats} />

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="xl:col-span-2 space-y-6">
                {/* Mood Analytics */}
                <MoodAnalytics moodData={data.moodData} days={parseInt(dateRange)} />

                {/* Productivity Metrics */}
                <ProductivityMetrics
                  tasks={data.tasks}
                  events={data.events}
                  emails={data.emails}
                  contacts={data.contacts}
                />

                {/* Recent Activity */}
                <RecentActivity activities={data.activities} />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Productivity Score */}
                <ProductivityScoreComponent
                  score={dashboardStats.productivityScore}
                  trend={productivityTrend}
                  previousScore={dashboardStats.productivityScore - 5}
                />

                {/* Meeting Load */}
                <MeetingLoad events={data.events} />

                {/* Upcoming Events */}
                <UpcomingEvents events={data.events} />

                {/* Weekly Comparison */}
                <WeeklyComparisonComponent comparison={data.weeklyComparison} />
              </div>
            </div>

            {/* Secondary Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Insights */}
              <LearningInsights journalEntries={data.journalEntries} />

              {/* AI Insights */}
              <AIInsights insights={data.aiInsights} />
            </div>

            {/* Quick Actions */}
            <QuickActions onAction={handleQuickAction} />

            {/* Settings */}
            <SettingsPanel
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onExport={handleExport}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;