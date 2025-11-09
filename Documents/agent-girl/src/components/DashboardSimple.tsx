import React, { useState, useMemo, useEffect } from 'react';
import { DashboardStatsComponent } from './DashboardStats';
import { useTimer } from '../contexts/TimerContext';
import { formatMinutesDisplay, calculateDailyFocusTime, formatTimerDisplay } from '../utils/timerUtils';
import { Timer, Plus, Play, Pause, RotateCcw } from 'lucide-react';
import TimeUpNotification from './tasks/TimeUpNotification';
import PremiumProductivityCoach from './PremiumProductivityCoach';
import {
  DashboardStats,
  Task,
  JournalEntry,
  CalendarEvent,
  Email
} from '../types';
import {
  generateTasks
} from '../utils/dataGenerator';
import {
  calculateProductivityScore,
  calculateTrend,
  subDays
} from '../utils/helpers';

// Real Data Integration Utilities
const fetchRealJournalEntries = (): JournalEntry[] => {
  try {
    const savedEntries = localStorage.getItem('journalEntries');
    return savedEntries ? JSON.parse(savedEntries) : [];
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    return [];
  }
};

const fetchRealTasks = (): Task[] => {
  try {
    const savedTasks = localStorage.getItem('tasks');
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

const fetchRealEmails = (): Email[] => {
  try {
    const savedEmails = localStorage.getItem('emails');
    return savedEmails ? JSON.parse(savedEmails) : [];
  } catch (error) {
    console.error('Error fetching emails:', error);
    return [];
  }
};

const fetchRealEvents = (): CalendarEvent[] => {
  try {
    const savedEvents = localStorage.getItem('calendarEvents');
    return savedEvents ? JSON.parse(savedEvents) : [];
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

const fetchRealMoodData = (journalEntries: JournalEntry[]) => {
  return journalEntries.map(entry => ({
    date: new Date(entry.date),
    mood: entry.mood || 5,
    energy: entry.energy || 5
  }));
};

const calculatePeriodComparison = (current: number, previous: number) => {
  if (previous === 0) return { value: 0, trend: 'up' as const };
  const change = ((current - previous) / previous) * 100;
  return {
    value: Math.abs(Math.round(change)),
    trend: change >= 0 ? 'up' as const : 'down' as const
  };
};

// Productivity Coach Article Types
interface ProductivityArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  readTime: string;
  category: 'focus' | 'time-management' | 'habits' | 'wellness' | 'goals' | 'energy' | 'mindfulness' | 'tasks' | 'procrastination';
  icon: string;
  personalizations: string[];
  relevanceScore: number;
  content?: string;
}

interface UserProfile {
  pendingTasks: number;
  completedTasks: number;
  avgMood: number;
  avgEnergy: number;
  journalStreak: number;
  upcomingMeetings: number;
  hasHighPriorityTasks: boolean;
  hasOverdueTasks: boolean;
  recentEnergyTrend: 'low' | 'medium' | 'high';
  recentMoodTrend: 'low' | 'medium' | 'high';
}

// Productivity Coach System
const createUserProfile = (journalEntries: JournalEntry[], tasks: Task[]): UserProfile => {
  const completedTasks = tasks.filter(task => task.completed);
  const pendingTasks = tasks.filter(task => !task.completed);
  const overdueTasks = tasks.filter(task => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  });
  const highPriorityTasks = tasks.filter(task =>
    !task.completed && (task.priority === 'high' || task.priority === 'urgent')
  );

  // Calculate journaling streak
  let journalStreak = 0;
  if (journalEntries.length > 0) {
    const sortedEntries = [...journalEntries]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (let i = 0; i < sortedEntries.length; i++) {
      const entryDate = new Date(sortedEntries[i].date);
      const expectedDate = subDays(new Date(), i);

      if (entryDate.toDateString() === expectedDate.toDateString()) {
        journalStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate mood and energy trends
  let avgMood = 5, avgEnergy = 5, recentMoodTrend: 'low' | 'medium' | 'high' = 'medium', recentEnergyTrend: 'low' | 'medium' | 'high' = 'medium';

  if (journalEntries.length > 0) {
    const recentEntries = journalEntries.slice(-7);
    avgMood = recentEntries.reduce((sum, entry) => sum + (entry.mood || 5), 0) / recentEntries.length;
    avgEnergy = recentEntries.reduce((sum, entry) => sum + (entry.energy || 5), 0) / recentEntries.length;

    recentMoodTrend = avgMood >= 7 ? 'high' : avgMood <= 4 ? 'low' : 'medium';
    recentEnergyTrend = avgEnergy >= 7 ? 'high' : avgEnergy <= 4 ? 'low' : 'medium';
  }

  return {
    pendingTasks: pendingTasks.length,
    completedTasks: completedTasks.length,
    avgMood: Math.round(avgMood * 10) / 10,
    avgEnergy: Math.round(avgEnergy * 10) / 10,
    journalStreak,
    upcomingMeetings: 0, // Would calculate from calendar events
    hasHighPriorityTasks: highPriorityTasks.length > 0,
    hasOverdueTasks: overdueTasks.length > 0,
    recentEnergyTrend,
    recentMoodTrend
  };
};

// Curated productivity articles as fallback when web search is unavailable
const getCuratedProductivityArticles = (category: string): ProductivityArticle[] => {
  const curatedArticles = {
    'focus': [
      {
        id: 'focus-1',
        title: 'The Science of Deep Work: How to Focus in a Distracted World',
        summary: 'Research-backed techniques for achieving deep focus and producing high-quality work in an age of constant distraction.',
        source: 'Cal Newport Blog',
        sourceUrl: 'https://calnewport.com/blog/deep-work/',
        readTime: '5 min read',
        category: 'focus' as const,
        icon: '🎯',
        personalizations: [],
        relevanceScore: 9.2,
        content: `
# The Science of Deep Work

In today's hyper-connected world, the ability to focus without distraction on a cognitively demanding task is becoming increasingly rare and valuable. This ability is what Cal Newport calls "Deep Work."

## What is Deep Work?

Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time.

## Key Principles:

### 1. Embrace Boredom
Your brain needs to get comfortable with being bored to achieve deep focus. Constant stimulation from social media and notifications fragments your attention.

### 2. Practice Productive Meditation
Use your downtime (walking, commuting) to focus on a single professional problem. This trains your brain to concentrate deeply.

### 3. Execute a 4-Discipline Process:
- **Focus on the Wildly Important**: Choose one or two ambitious goals
- **Act on the Lead Measures**: Track actions that drive success
- **Keep a Compelling Scoreboard**: Make progress visible
- **Create a Cadence of Accountability**: Regular review of progress

## Practical Implementation:

1. **Time Blocking**: Schedule deep work sessions in your calendar
2. **Create Rituals**: Build routines that signal to your brain it's time to focus
3. **Work Deeply**: Push your cognitive limits during these sessions
4. **Shutdown Complete**: Have a clear end to your workday

The quality of your work is directly proportional to the intensity of your focus. By practicing deep work regularly, you'll not only produce better results but also find more satisfaction in your work.
        `.trim()
      },
      {
        id: 'focus-2',
        title: 'Pomodoro Technique: Why It Works Better Than You Think',
        summary: 'The psychology behind the Pomodoro Technique and how to optimize it for your specific work style.',
        source: 'Francesco Cirillo',
        sourceUrl: 'https://francescocirillo.com/pages/pomodoro-technique',
        readTime: '4 min read',
        category: 'focus' as const,
        icon: '🎯',
        personalizations: [],
        relevanceScore: 8.8
      }
    ],
    'time-management': [
      {
        id: 'time-1',
        title: 'The Eisenhower Matrix: Master Urgent vs Important Tasks',
        summary: 'A practical guide to prioritizing tasks based on urgency and importance to maximize your impact.',
        source: 'Eisenhower.me',
        sourceUrl: 'https://www.eisenhower.me/eisenhower-matrix/',
        readTime: '6 min read',
        category: 'time-management' as const,
        icon: '⏰',
        personalizations: [],
        relevanceScore: 9.5
      },
      {
        id: 'time-2',
        title: 'Time Blocking: The Secret to Ultra-Productive Days',
        summary: 'How elite performers use time blocking to protect their focus and achieve extraordinary results.',
        source: 'Productivity Weekly',
        sourceUrl: '#',
        readTime: '7 min read',
        category: 'time-management' as const,
        icon: '⏰',
        personalizations: [],
        relevanceScore: 8.9
      }
    ],
    'habits': [
      {
        id: 'habits-1',
        title: 'Atomic Habits: The Science of Small Changes',
        summary: 'How tiny 1% improvements compound over time to create remarkable personal and professional transformations.',
        source: 'James Clear',
        sourceUrl: 'https://jamesclear.com/atomic-habits',
        readTime: '8 min read',
        category: 'habits' as const,
        icon: '✨',
        personalizations: [],
        relevanceScore: 9.7
      },
      {
        id: 'habits-2',
        title: 'Habit Stacking: Build Better Routines Effortlessly',
        summary: 'The psychology of linking new habits to existing ones for sustainable behavior change.',
        source: 'James Clear',
        sourceUrl: 'https://jamesclear.com/habit-stacking',
        readTime: '5 min read',
        category: 'habits' as const,
        icon: '✨',
        personalizations: [],
        relevanceScore: 8.6
      }
    ],
    'wellness': [
      {
        id: 'wellness-1',
        title: 'Burnout Prevention: Signs and Solutions',
        summary: 'Recognizing early warning signs of burnout and evidence-based strategies to maintain long-term productivity.',
        source: 'Harvard Business Review',
        sourceUrl: 'https://hbr.org/topic/subject/burnout',
        readTime: '6 min read',
        category: 'wellness' as const,
        icon: '🌱',
        personalizations: [],
        relevanceScore: 9.3
      },
      {
        id: 'wellness-2',
        title: 'The Power of Micro-Breaks for Productivity',
        summary: 'How strategic 2-minute breaks throughout the day can boost focus and prevent mental fatigue.',
        source: 'Productivity & Wellness',
        sourceUrl: '#',
        readTime: '4 min read',
        category: 'wellness' as const,
        icon: '🌱',
        personalizations: [],
        relevanceScore: 8.7
      }
    ],
    'goals': [
      {
        id: 'goals-1',
        title: 'OKRs vs SMART Goals: Which Framework Wins?',
        summary: 'A comprehensive comparison of the most effective goal-setting frameworks for different scenarios.',
        source: 'Goal Achievement Quarterly',
        sourceUrl: '#',
        readTime: '7 min read',
        category: 'goals' as const,
        icon: '🚀',
        personalizations: [],
        relevanceScore: 9.1
      },
      {
        id: 'goals-2',
        title: 'The Psychology of Goal Achievement',
        summary: 'Understanding the mental barriers that prevent goal completion and strategies to overcome them.',
        source: 'Performance Psychology',
        sourceUrl: '#',
        readTime: '6 min read',
        category: 'goals' as const,
        icon: '🚀',
        personalizations: [],
        relevanceScore: 8.8
      }
    ],
    'energy': [
      {
        id: 'energy-1',
        title: 'Managing Your Energy, Not Your Time',
        summary: 'Why managing energy levels throughout the day is more effective than traditional time management.',
        source: 'Energy Management Institute',
        sourceUrl: '#',
        readTime: '5 min read',
        category: 'energy' as const,
        icon: '⚡',
        personalizations: [],
        relevanceScore: 9.0
      },
      {
        id: 'energy-2',
        title: 'Ultradian Rhythms: Your Natural Productivity Cycles',
        summary: 'Working with your body\'s natural energy cycles to maximize performance and prevent burnout.',
        source: 'Bio-Hacking Today',
        sourceUrl: '#',
        readTime: '6 min read',
        category: 'energy' as const,
        icon: '⚡',
        personalizations: [],
        relevanceScore: 8.5
      }
    ],
    'mindfulness': [
      {
        id: 'mindful-1',
        title: 'Mindfulness for Productivity: A Practical Guide',
        summary: 'Simple mindfulness techniques you can use at your desk to improve focus and reduce stress.',
        source: 'Mindful Productivity Magazine',
        sourceUrl: '#',
        readTime: '5 min read',
        category: 'mindfulness' as const,
        icon: '🧘',
        personalizations: [],
        relevanceScore: 8.9
      },
      {
        id: 'mindful-2',
        title: 'The 5-Minute Meditation That Boosts Focus',
        summary: 'A simple breathing technique that can dramatically improve your concentration throughout the day.',
        source: 'Workplace Wellness Today',
        sourceUrl: '#',
        readTime: '3 min read',
        category: 'mindfulness' as const,
        icon: '🧘',
        personalizations: [],
        relevanceScore: 8.4
      }
    ],
    'tasks': [
      {
        id: 'tasks-1',
        title: 'The Getting Things Done Method for Modern Work',
        summary: 'How to adapt David Allen\'s classic productivity system for today\'s digital workplace.',
        source: 'Task Management Quarterly',
        sourceUrl: '#',
        readTime: '7 min read',
        category: 'tasks' as const,
        icon: '📋',
        personalizations: [],
        relevanceScore: 9.2
      },
      {
        id: 'tasks-2',
        title: 'Eat That Frog: Overcoming Procrastination',
        summary: 'Brian Tracy\'s classic method for tackling your most important tasks first thing in the morning.',
        source: 'Productivity Digest',
        sourceUrl: '#',
        readTime: '4 min read',
        category: 'tasks' as const,
        icon: '📋',
        personalizations: [],
        relevanceScore: 8.7
      }
    ],
    'procrastination': [
      {
        id: 'proc-1',
        title: 'The Psychology Behind Procrastination',
        summary: 'Understanding why we procrastinate and the science-backed strategies to overcome it.',
        source: 'Psychology Today',
        sourceUrl: 'https://www.psychologytoday.com/us/basics/procrastination',
        readTime: '6 min read',
        category: 'procrastination' as const,
        icon: '🎯',
        personalizations: [],
        relevanceScore: 9.4
      },
      {
        id: 'proc-2',
        title: 'The 2-Minute Rule for Overcoming Resistance',
        summary: 'How David Allen\'s simple rule can help you beat procrastination and build momentum.',
        source: 'Habit & Productivity Blog',
        sourceUrl: '#',
        readTime: '3 min read',
        category: 'procrastination' as const,
        icon: '🎯',
        personalizations: [],
        relevanceScore: 8.8
      }
    ]
  };

  return curatedArticles[category as keyof typeof curatedArticles] || [];
};

// Fetch productivity articles (web search with curated fallback)
const fetchProductivityArticles = async (category: string): Promise<ProductivityArticle[]> => {
  try {
    // For now, return curated articles since web search API is not available
    // In the future, you can integrate web search here
    return getCuratedProductivityArticles(category);
  } catch (error) {
    console.error('Error fetching articles, using curated content:', error);
    return getCuratedProductivityArticles(category);
  }
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    'focus': '📚',
    'time-management': '⏰',
    'habits': '🔄',
    'wellness': '🧘',
    'goals': '🎯',
    'energy': '⚡',
    'mindfulness': '🧠',
    'tasks': '✅',
    'procrastination': '🚀'
  };
  return icons[category] || '📖';
};

// Generate personalized article recommendations
const generatePersonalizedArticles = async (profile: UserProfile): Promise<ProductivityArticle[]> => {
  const categories: ProductivityArticle['category'][] = [];

  // Smart category selection based on user profile
  if (profile.pendingTasks > 10) {
    categories.push('tasks', 'time-management', 'procrastination');
  }

  if (profile.avgMood < 6 || profile.avgEnergy < 6) {
    categories.push('wellness', 'energy', 'mindfulness');
  }

  if (profile.journalStreak >= 5) {
    categories.push('habits', 'goals');
  }

  if (profile.hasOverdueTasks) {
    categories.push('procrastination', 'focus');
  }

  if (profile.hasHighPriorityTasks) {
    categories.push('time-management', 'focus');
  }

  // Add default categories if none selected
  if (categories.length === 0) {
    categories.push('focus', 'habits', 'wellness', 'goals');
  }

  // Fetch articles for selected categories
  const allArticles: ProductivityArticle[] = [];
  for (const category of categories.slice(0, 3)) { // Limit to 3 categories
    const articles = await fetchProductivityArticles(category);
    allArticles.push(...articles);
  }

  // Add personalizations to articles
  return allArticles.slice(0, 5).map(article => ({
    ...article,
    personalizations: generatePersonalizations(article, profile),
    relevanceScore: calculateRelevanceScore(article, profile)
  })).sort((a, b) => b.relevanceScore - a.relevanceScore);
};

const generatePersonalizations = (article: ProductivityArticle, profile: UserProfile): string[] => {
  const personalizations: string[] = [];

  switch (article.category) {
    case 'focus':
      if (profile.pendingTasks > 10) {
        personalizations.push(`You have ${profile.pendingTasks} pending tasks - deep work can help you complete them faster`);
      }
      if (profile.avgEnergy < 6) {
        personalizations.push(`Your energy has been low lately - these focus techniques can help you work more efficiently`);
      }
      break;

    case 'time-management':
      if (profile.hasHighPriorityTasks) {
        personalizations.push(`You have high-priority tasks - better time management can help you tackle them effectively`);
      }
      break;

    case 'habits':
      if (profile.journalStreak >= 5) {
        personalizations.push(`You're on a ${profile.journalStreak}-day streak - amplify your momentum with these habit strategies`);
      }
      break;

    case 'wellness':
      if (profile.avgMood < 6) {
        personalizations.push(`Your mood could use a boost - these wellness techniques can help improve your mental clarity`);
      }
      break;

    case 'goals':
      if (profile.journalStreak >= 5) {
        personalizations.push(`Your consistency is impressive - goal-setting strategies can help you achieve even more`);
      }
      break;

    case 'energy':
      if (profile.avgEnergy < 6) {
        personalizations.push(`Your energy levels have been low - these tips can help you maintain peak performance`);
      }
      break;

    case 'mindfulness':
      if (profile.journalStreak > 0) {
        personalizations.push(`Your journaling practice shows mindfulness is important to you - enhance it with these techniques`);
      }
      break;

    case 'tasks':
      if (profile.pendingTasks > 5) {
        personalizations.push(`You have ${profile.pendingTasks} tasks to complete - these strategies can help you stay organized`);
      }
      break;

    case 'procrastination':
      if (profile.hasOverdueTasks) {
        personalizations.push(`You have overdue tasks - overcome procrastination with these proven techniques`);
      }
      break;
  }

  // Add a general personalization if none specific
  if (personalizations.length === 0) {
    personalizations.push('Based on your productivity patterns, this content can help you achieve better results');
  }

  return personalizations.slice(0, 3);
};

const calculateRelevanceScore = (article: ProductivityArticle, profile: UserProfile): number => {
  let score = 50; // Base score

  // Boost score based on personalizations
  score += article.personalizations.length * 15;

  // Category-specific scoring
  if (article.category === 'tasks' && profile.pendingTasks > 5) score += 20;
  if (article.category === 'wellness' && profile.avgMood < 6) score += 20;
  if (article.category === 'habits' && profile.journalStreak > 0) score += 20;
  if (article.category === 'procrastination' && profile.hasOverdueTasks) score += 25;

  return Math.min(100, score);
};

// Productivity Articles caching
const getCachedArticles = (): ProductivityArticle[] | null => {
  try {
    const cached = localStorage.getItem('productivityArticles');
    if (cached) {
      const { articles, lastUpdated } = JSON.parse(cached);
      const now = new Date();
      const lastUpdate = new Date(lastUpdated);

      // Check if cache is still valid (same day)
      if (lastUpdate.toDateString() === now.toDateString()) {
        return articles;
      }
    }
  } catch (error) {
    console.error('Error reading cached articles:', error);
  }
  return null;
};

const setCachedArticles = (articles: ProductivityArticle[]): void => {
  try {
    const cacheData = {
      articles,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('productivityArticles', JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching articles:', error);
  }
};

// Compact, Sophisticated Dashboard Timer Component
const DashboardTimer: React.FC = () => {
  const { timerState, pauseTimer, resumeTimer, stopTimer, addTimeToTimer, markTaskComplete, resetTimeUpNotification } = useTimer();
  const [showTimeUpNotification, setShowTimeUpNotification] = useState(false);

  // Get some active tasks for quick timer start
  const activeTasks = useMemo(() => {
    const tasks = fetchRealTasks();
    return tasks.filter(task => !task.completed && task.estimatedTime).slice(0, 3);
  }, []);

  const dailyFocusTime = useMemo(() => calculateDailyFocusTime(fetchRealTasks()), []);
  const currentSessionTime = timerState.elapsedTime;
  const totalFocusTime = dailyFocusTime + currentSessionTime;

  // Show time-up notification when timer reaches zero
  useEffect(() => {
    if (timerState.hasReachedZero && timerState.taskId && !showTimeUpNotification) {
      setShowTimeUpNotification(true);
    }
  }, [timerState.hasReachedZero, timerState.taskId, showTimeUpNotification]);

  // Add global ESC key listener as backup close mechanism
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showTimeUpNotification) {
        handleCloseTimeUpNotification();
      }
    };

    // Add global emergency close with Ctrl+Shift+X
    const handleEmergencyClose = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'X' && showTimeUpNotification) {
        console.warn('Emergency close triggered via Ctrl+Shift+X');
        handleCloseTimeUpNotification();
      }
    };

    if (showTimeUpNotification) {
      document.addEventListener('keydown', handleEscKey);
      document.addEventListener('keydown', handleEmergencyClose);
      return () => {
        document.removeEventListener('keydown', handleEscKey);
        document.removeEventListener('keydown', handleEmergencyClose);
      };
    }
  }, [showTimeUpNotification]);

  const handleMarkCompleteFromNotification = () => {
    markTaskComplete();
    setShowTimeUpNotification(false);
    resetTimeUpNotification();
  };

  const handleAddTimeFromNotification = () => {
    addTimeToTimer(15);
    setShowTimeUpNotification(false);
    resetTimeUpNotification();
  };

  const handleCloseTimeUpNotification = () => {
    // Reset both local state and timer context state
    setShowTimeUpNotification(false);
    resetTimeUpNotification();
  };

  const getTimerState = () => {
    if (!timerState.isRunning) {
      return {
        text: 'Start a task timer',
        displayTime: '--:--',
        color: 'text-gray-600',
        bgColor: 'premium-glass-bg',
        borderColor: 'border-gray-200/10',
        iconBg: 'bg-gray-50',
        iconColor: 'text-gray-400',
        status: 'READY',
        statusColor: 'text-gray-400'
      };
    }

    if (timerState.isPaused) {
      const remainingTime = (timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime;
      return {
        text: 'Timer Paused',
        displayTime: formatTimerDisplay(remainingTime),
        color: 'text-amber-600',
        bgColor: 'premium-glass-bg',
        borderColor: 'border-amber-200/30',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        status: 'PAUSED',
        statusColor: 'text-amber-500'
      };
    }

    const remainingTime = (timerState.estimatedDuration * 60 * 1000) - timerState.elapsedTime;
    const isOvertime = timerState.hasReachedZero || remainingTime < 0;

    if (isOvertime) {
      return {
        text: 'Overtime',
        displayTime: `+${formatTimerDisplay(timerState.overtimeTime, true)}`,
        color: 'text-red-600',
        bgColor: 'premium-glass-bg',
        borderColor: 'border-red-200/30',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500',
        status: 'OVERTIME',
        statusColor: 'text-red-500'
      };
    }

    return {
      text: 'Timer Running',
      displayTime: formatTimerDisplay(remainingTime),
      color: 'text-emerald-600',
      bgColor: 'premium-glass-bg',
      borderColor: 'border-emerald-200/30',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-500',
      status: 'ACTIVE',
      statusColor: 'text-emerald-500'
    };
  };

  const state = getTimerState();

  return (
    <div className="mb-6">
      {/* Compact Timer Widget */}
      <div className="relative">
        <div className={`flex items-center justify-between px-6 py-4 rounded-xl ${state.bgColor} border ${state.borderColor} shadow-sm transition-all duration-200 hover:shadow-md`}>

          {/* Status Badge */}
          <div className="flex items-center gap-3">
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${state.statusColor} ${state.iconBg}`}>
              {state.status}
            </span>
          </div>

          {/* Timer Display */}
          <div className="flex-1 text-center">
            <div className={`text-4xl font-mono font-medium ${state.color} tracking-tight transition-all duration-150`}>
              {state.displayTime}
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center gap-1">
            {timerState.isRunning && (
              <>
                <button
                  onClick={() => addTimeToTimer(15)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150 hover:scale-110"
                  title="Add 15 minutes"
                >
                  <Plus className="w-4 h-4" />
                </button>

                <button
                  onClick={stopTimer}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/20 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-150 hover:scale-110"
                  title="Stop timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Play/Pause Button */}
            <button
              onClick={timerState.isRunning ? (timerState.isPaused ? resumeTimer : pauseTimer) : undefined}
              disabled={!timerState.isRunning}
              className={`p-2.5 rounded-lg transition-colors duration-150 hover:scale-110 ${
                !timerState.isRunning
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : timerState.isPaused
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                    : 'bg-amber-500 text-white hover:bg-amber-600'
              }`}
              title={timerState.isRunning ? (timerState.isPaused ? 'Resume timer' : 'Pause timer') : 'No active timer'}
            >
              {timerState.isRunning ? (
                timerState.isPaused ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <Pause className="w-4 h-4" />
                )
              ) : (
                <Timer className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Focus Stats - Subtle Display */}
        {timerState.isRunning && (
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="font-medium">Session:</span>
              <span className="font-mono">{formatTimerDisplay(timerState.elapsedTime)}</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium">Daily:</span>
              <span className="font-mono">{formatMinutesDisplay(totalFocusTime)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Quick Task Start - Minimal Design */}
      {!timerState.isRunning && activeTasks.length > 0 && (
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Quick start:</span>
            {activeTasks.map((task, index) => (
              <button
                key={task.id}
                onClick={() => {/* Handle task start */}}
                className="px-3 py-1.5 rounded-lg premium-glass-bg hover:premium-glass-hover text-gray-700 dark:text-gray-300 transition-colors duration-150 border border-gray-200/10 dark:border-gray-700/30 hover:scale-105"
              >
                {task.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Time Up Notification */}
      {timerState.taskId && (
        <TimeUpNotification
          task={fetchRealTasks().find(task => task.id === timerState.taskId) || fetchRealTasks()[0] || generateTasks(1)[0]}
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

  // Fetch real data with state for reactivity
  const [data, setData] = useState(() => {
    const realJournalEntries = fetchRealJournalEntries();
    const realTasks = fetchRealTasks();
    const realEmails = fetchRealEmails();
    const realEvents = fetchRealEvents();

    return {
      tasks: realTasks,
      journalEntries: realJournalEntries,
      events: realEvents,
      emails: realEmails
    };
  });

  // User profile for personalization
  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    const journalEntries = fetchRealJournalEntries();
    const tasks = fetchRealTasks();
    return createUserProfile(journalEntries, tasks);
  });

  // Productivity articles state with caching
  const [productivityArticles, setProductivityArticles] = useState<ProductivityArticle[]>(() => {
    const cached = getCachedArticles();
    if (cached) {
      return cached;
    }
    // Generate empty array initially, will be populated asynchronously
    return [];
  });

  // State for handling async article loading
  const [isArticleLoading, setIsArticleLoading] = useState(true);

  // State for article modal
  const [selectedArticle, setSelectedArticle] = useState<ProductivityArticle | null>(null);

  // Fetch articles on component mount and when profile changes
  useEffect(() => {
    const fetchArticles = async () => {
      setIsArticleLoading(true);
      try {
        const articles = await generatePersonalizedArticles(userProfile);
        setProductivityArticles(articles);
        setCachedArticles(articles);
      } catch (error) {
        console.error('Error fetching productivity articles:', error);
        // Fallback to empty array if fetch fails
        setProductivityArticles([]);
      } finally {
        setIsArticleLoading(false);
      }
    };

    fetchArticles();
  }, [userProfile]);

  // Refresh data when localStorage might change
  useEffect(() => {
    const handleStorageChange = () => {
      const realJournalEntries = fetchRealJournalEntries();
      const realTasks = fetchRealTasks();
      const realEmails = fetchRealEmails();
      const realEvents = fetchRealEvents();

      setData(prev => ({
        ...prev,
        tasks: realTasks,
        journalEntries: realJournalEntries,
        events: realEvents,
        emails: realEmails
      }));

      // Update user profile
      const newProfile = createUserProfile(realJournalEntries, realTasks);
      setUserProfile(newProfile);

      // Refresh articles if cache is expired
      const cached = getCachedArticles();
      if (!cached) {
        // Articles will be refetched by the effect above when userProfile changes
        console.log('Article cache expired, will fetch new articles');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleStorageChange);
    };
  }, []);

  // Calculate dashboard stats
  const dashboardStats = useMemo((): DashboardStats => {
    const days = parseInt(dateRange);
    const cutoffDate = subDays(new Date(), days);

    const filteredTasks = data.tasks.filter(task => new Date(task.createdAt || task.date || Date.now()) >= cutoffDate);
    const completedTasks = filteredTasks.filter(task => task.completed);
    const journalEntries = data.journalEntries.filter(entry => new Date(entry.date) >= cutoffDate);
    const emails = data.emails.filter(email => new Date(email.date || email.createdAt || Date.now()) >= cutoffDate);
    const events = data.events.filter(event => new Date(event.date || event.start || Date.now()) >= cutoffDate);

    return {
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      totalJournalEntries: journalEntries.length,
      totalEmails: emails.length,
      totalEvents: events.length,
      totalContacts: 0, // Contacts unavailable
      averageMood: 0,
      averageEnergy: 0,
      productivityScore: calculateProductivityScore(
        completedTasks.length,
        filteredTasks.length,
        5, // Default mood
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

    const filteredTasks = data.tasks.filter(task => {
      const taskDate = new Date(task.createdAt || task.date || Date.now());
      return taskDate >= startDate && taskDate < endDate;
    });
    const journalEntries = data.journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= startDate && entryDate < endDate;
    });
    const emails = data.emails.filter(email => {
      const emailDate = new Date(email.date || email.createdAt || Date.now());
      return emailDate >= startDate && emailDate < endDate;
    });

    return {
      totalTasks: filteredTasks.length,
      completedTasks: filteredTasks.filter(task => task.completed).length,
      totalJournalEntries: journalEntries.length,
      totalEmails: emails.length,
      totalContacts: 0
    };
  }, [data, dateRange]);

  // Calculate period comparisons with enhanced data
  const periodComparisons = useMemo(() => {
    return {
      taskCompletion: calculatePeriodComparison(
        dashboardStats.totalTasks > 0 ? Math.round((dashboardStats.completedTasks / dashboardStats.totalTasks) * 100) : 0,
        previousStats.totalTasks > 0 ? Math.round((previousStats.completedTasks / previousStats.totalTasks) * 100) : 0
      ),
      journalEntries: calculatePeriodComparison(dashboardStats.totalJournalEntries, previousStats.totalJournalEntries),
      emailActivity: calculatePeriodComparison(dashboardStats.totalEmails, previousStats.totalEmails),
      events: { value: 0, trend: 'up' as const },
      contacts: { value: 0, trend: 'up' as const }
    };
  }, [dashboardStats, previousStats]);

  // Calculate productivity trend
  const productivityTrend = calculateTrend(dashboardStats.productivityScore, dashboardStats.productivityScore - 5);

  // Productivity Coach refresh handler
  const handleRefreshArticles = async () => {
    setIsArticleLoading(true);
    try {
      const newProfile = createUserProfile(data.journalEntries, data.tasks);
      setUserProfile(newProfile);

      const articles = await generatePersonalizedArticles(newProfile);
      setProductivityArticles(articles);
      setCachedArticles(articles);
    } catch (error) {
      console.error('Error refreshing articles:', error);
    } finally {
      setIsArticleLoading(false);
    }
  };

  // Article click handler
  const handleReadArticle = (article: ProductivityArticle) => {
    if (article.content) {
      // Show modal for articles with full content
      setSelectedArticle(article);
    } else if (article.sourceUrl && article.sourceUrl !== '#') {
      // Open external URL for articles without full content
      window.open(article.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6 p-6 theme-bg-primary">
      {/* Timer moved to Tasks tab only - removed from Dashboard */}

      {/* Premium Stats Cards */}
      <DashboardStatsComponent
        stats={dashboardStats}
        previousStats={previousStats}
        periodComparisons={periodComparisons}
        dateRange={dateRange}
      />

      {/* Premium Productivity Coach */}
      <PremiumProductivityCoach
        articles={productivityArticles}
        userProfile={userProfile}
        onRefresh={handleRefreshArticles}
        onArticleClick={handleReadArticle}
      />

      {/* Article Modal */}
      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </div>
  );
};

// Article Modal Component
const ArticleModal: React.FC<{
  article: ProductivityArticle;
  onClose: () => void;
}> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="premium-glass-bg rounded-2xl max-w-4xl max-h-[90vh] w-full overflow-hidden shadow-2xl border border-gray-200/10 dark:border-gray-700/30">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200/10 dark:border-gray-700/30">
          <div className="flex items-center gap-4">
            <div className="text-4xl">{article.icon}</div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{article.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">{article.source}</span>
                <span className="text-gray-400">•</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">{article.readTime}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 premium-glass-bg rounded-full transition-all duration-200 hover:scale-110 border border-gray-200/10 dark:border-gray-700/30"
          >
            <svg className="w-6 h-6 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {article.content ? (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              {article.content.split('\n').map((line, index) => {
                if (line.startsWith('# ')) {
                  return <h1 key={index} className="text-3xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">{line.slice(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={index} className="text-2xl font-semibold mt-5 mb-3 text-gray-900 dark:text-white">{line.slice(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={index} className="text-xl font-semibold mt-4 mb-2 text-gray-900 dark:text-white">{line.slice(4)}</h3>;
                } else if (line.startsWith('- **')) {
                  const parts = line.split('**: ');
                  return (
                    <li key={index} className="ml-4 mt-2">
                      <strong className="text-gray-900 dark:text-white">{parts[0].slice(3)}</strong>
                      {parts[1] && <span className="text-gray-700 dark:text-gray-300">{parts[1]}</span>}
                    </li>
                  );
                } else if (line.startsWith('- ')) {
                  return <li key={index} className="ml-4 mt-1 text-gray-700 dark:text-gray-300">{line.slice(2)}</li>;
                } else if (line.startsWith('**') && line.endsWith('**')) {
                  return <p key={index} className="font-semibold text-gray-900 dark:text-white mt-3 mb-2">{line.slice(2, -2)}</p>;
                } else if (line.trim() === '') {
                  return <br key={index} />;
                } else {
                  return <p key={index} className="mt-2 mb-2 text-gray-700 dark:text-gray-300 leading-relaxed">{line}</p>;
                }
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">This article is available on the external source.</p>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500/80 to-purple-600/80 hover:from-blue-500 hover:to-purple-600 text-white rounded-xl transition-all duration-200 hover:scale-105 shadow-lg"
                onClick={onClose}
              >
                Read Full Article
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;