import React from 'react';
import { useTheme } from '../../../index';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

export const QuickStartButtons: React.FC = () => {
  const { theme } = useTheme();

  const quickActions: QuickAction[] = [
    {
      id: 'journal',
      title: 'Write Journal',
      description: 'Record your thoughts and feelings',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: 'from-primary to-blue-600',
      action: () => console.log('Opening journal...'),
    },
    {
      id: 'tasks',
      title: 'Add Task',
      description: 'Create a new task or reminder',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      color: 'from-success to-emerald-600',
      action: () => console.log('Adding new task...'),
    },
    {
      id: 'meditation',
      title: 'Start Meditation',
      description: 'Begin a mindfulness session',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-purple-500 to-purple-700',
      action: () => console.log('Starting meditation...'),
    },
    {
      id: 'goals',
      title: 'Track Goal',
      description: 'Update your goal progress',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'from-warning to-amber-600',
      action: () => console.log('Tracking goal...'),
    },
    {
      id: 'habits',
      title: 'Log Habit',
      description: 'Mark habit completion',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      color: 'from-info to-cyan-600',
      action: () => console.log('Logging habit...'),
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'Check your progress and insights',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'from-secondary to-gray-600',
      action: () => console.log('Opening analytics...'),
    },
  ];

  return (
    <div className="glass glass-blur-16 glass-shadow-lg rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4">Quick Start</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className={`
              group relative overflow-hidden
              glass glass-blur-8 rounded-lg p-4
              text-left transition-all duration-300
              hover:glass-blur-16 hover:scale-105 hover:shadow-lg
              border border-light/50 hover:border-accent-primary/50
              active:scale-95
            `}
          >
            {/* Gradient Background Overlay */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${action.color} opacity-0
              group-hover:opacity-10 transition-opacity duration-300
            `} />

            {/* Content */}
            <div className="relative z-10">
              <div className={`
                w-12 h-12 rounded-lg glass glass-blur-16
                flex items-center justify-center mb-3
                group-hover:scale-110 transition-transform duration-300
                bg-gradient-to-br ${action.color} text-white
              `}>
                {action.icon}
              </div>

              <h4 className="font-semibold text-text-primary mb-1 group-hover:text-accent-primary transition-colors">
                {action.title}
              </h4>

              <p className="text-sm text-text-secondary opacity-80">
                {action.description}
              </p>

              {/* Hover Arrow */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <svg className="w-5 h-5 text-accent-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Ripple Effect */}
            <div className="absolute inset-0 -z-10">
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          </button>
        ))}
      </div>

      {/* Bottom Action */}
      <div className="mt-6 pt-6 border-t border-light/50">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-text-primary">Need help getting started?</h4>
            <p className="text-sm text-text-secondary opacity-70">
              Take a guided tour of all features
            </p>
          </div>
          <button className="glass-button glass-button-primary">
            Start Tour
          </button>
        </div>
      </div>
    </div>
  );
};