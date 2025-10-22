import React, { useState, useMemo, useEffect } from 'react';
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
import { useTimer } from '../contexts/TimerContext';
import { formatMinutesDisplay, calculateDailyFocusTime, formatTimerDisplay } from '../utils/timerUtils';
import { Timer, Plus, Play, Pause, RotateCcw } from 'lucide-react';
import TimeUpNotification from './tasks/TimeUpNotification';
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
  generateJournalEntries,
  generateCalendarEvents,
  generateEmails,
  generateContacts,
  generateActivities,
  generateAIInsights,
  generateWeeklyComparison
} from '../utils/dataGenerator';
import {
  calculateProductivityScore,
  calculateTrend,
  subDays
} from '../utils/helpers';

// Dashboard Timer Component
const DashboardTimer: React.FC = () => {
  const { timerState, pauseTimer, resumeTimer, stopTimer, addTimeToTimer, markTaskComplete } = useTimer();
  const [showTimeUpNotification, setShowTimeUpNotification] = useState(false);

  // Get some active tasks for quick timer start
  const activeTasks = useMemo(() => {
    const tasks = generateTasks(10);
    return tasks.filter(task => !task.completed && task.estimatedTime).slice(0, 3);
  }, []);

  const dailyFocusTime = calculateDailyFocusTime(generateTasks(60));
  const currentSessionTime = timerState.elapsedTime;
  const totalFocusTime = dailyFocusTime + currentSessionTime;

  // Show time-up notification when timer reaches zero
  useEffect(() => {
    if (timerState.hasReachedZero && timerState.taskId && !showTimeUpNotification) {
      setShowTimeUpNotification(true);
    }
  }, [timerState.hasReachedZero, timerState.taskId, showTimeUpNotification]);

  const handleMarkCompleteFromNotification = () => {
    markTaskComplete();
    setShowTimeUpNotification(false);
  };

  const handleAddTimeFromNotification = () => {
    addTimeToTimer(15);
    setShowTimeUpNotification(false);
  };

  const handleCloseTimeUpNotification = () => {
    setShowTimeUpNotification(false);
  };

  const getTimerDisplay = () => {
    if (!timerState.isRunning) {
      return {
        text: '⏱️ Start a task timer',
        color: 'text-gray-600 dark:text-gray-400',
        bgColor: 'bg-gray-100 dark:bg-gray-700'
      };
    }

    if (timerState.isPaused) {
      return {
        text: `⏸️ PAUSED ${formatTimerDisplay((timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime)}`,
        color: 'text-yellow-600 dark:text-yellow-400',
        bgColor: 'bg-yellow-50 dark:bg-yellow-950/30'
      };
    }

    const remainingTime = (timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime;
    const isOvertime = timerState.hasReachedZero || remainingTime < 0;

    if (isOvertime) {
      return {
        text: `⏱️ +${formatTimerDisplay(timerState.overtimeTime, true)}`,
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-50 dark:bg-red-950/30'
      };
    }

    return {
      text: `⏱️ ${formatTimerDisplay(remainingTime)}`,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-950/30'
    };
  };

  return (
    <div className="mb-6">
      {/* Clean Timer Widget */}
      {timerState.isRunning ? (
        // Active Timer Display
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-4 px-6 py-4 rounded-2xl ${getTimerDisplay().bgColor} backdrop-blur-sm border border-white/20 dark:border-gray-700/20 shadow-lg`}>
            {/* Main Timer Display */}
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${timerState.isPaused ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-green-100 dark:bg-green-900/30'} transition-all duration-200`}>
                {timerState.isPaused ? (
                  <Pause className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                ) : (
                  <Timer className="w-6 h-6 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div>
                <div className={`text-2xl font-bold ${getTimerDisplay().color} font-mono`}>
                  {getTimerDisplay().text}
                </div>
                <div className={`text-xs ${getTimerDisplay().color} opacity-75`}>
                  {timerState.isPaused ? 'Timer Paused' : 'Timer Running'}
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={timerState.isPaused ? resumeTimer : pauseTimer}
                className="p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 shadow-sm"
              >
                {timerState.isPaused ? <Play className="w-5 h-5 text-green-500" /> : <Pause className="w-5 h-5 text-yellow-500" />}
              </button>
              <button
                onClick={() => addTimeToTimer(15)}
                className="p-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 transition-all duration-200 shadow-sm"
                title="Add 15 minutes"
              >
                <Plus className="w-5 h-5" />
              </button>
              <button
                onClick={stopTimer}
                className="p-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-all duration-200 shadow-sm"
                title="Stop timer"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        // Inactive Timer State
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gray-200 dark:bg-gray-700">
                <Timer className="w-6 h-6 text-gray-500 dark:text-gray-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-400 font-mono">
                  ⏱️ --:--
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500">
                  No Active Timer
                </div>
              </div>
            </div>

            {/* Quick Task Start */}
            {activeTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Quick start:</span>
                {activeTasks.slice(0, 2).map(task => (
                  <button
                    key={task.id}
                    className="px-3 py-2 rounded-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white/90 dark:hover:bg-gray-800/90 transition-all duration-200 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Time Up Notification */}
      {timerState.taskId && (
        <TimeUpNotification
          task={generateTasks(1)[0]} // Mock task for now
          isVisible={showTimeUpNotification}
          onClose={handleCloseTimeUpNotification}
          onMarkComplete={handleMarkCompleteFromNotification}
          onAddTime={handleAddTimeFromNotification}
          onContinueWorking={handleCloseTimeUpNotification}
        />
      )}
    </div>
  );
};

const DashboardSimple: React.FC = () => {
  const [dateRange, setDateRange] = useState('30');

  // Generate mock data
  const [data] = useState(() => ({
    moodData: generateMoodData(60),
    tasks: generateTasks(60),
    journalEntries: generateJournalEntries(60),
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

  return (
    <div className="space-y-6">
      {/* Dashboard Timer */}
      <DashboardTimer />

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

      {/* AI Insights */}
      <AIInsights insights={data.aiInsights} />

      {/* Quick Actions */}
      <QuickActions
        actions={[
          { label: 'Create Journal Entry', icon: '📝', action: () => console.log('Journal') },
          { label: 'Add Task', icon: '✅', action: () => console.log('Task') },
          { label: 'Schedule Event', icon: '📅', action: () => console.log('Event') },
        ]}
        onAction={(action) => console.log('Action:', action)}
      />
    </div>
  );
};

export default DashboardSimple;