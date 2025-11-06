import React from 'react';
import { PenTool, PlusSquare, Calendar, Mail, UserPlus } from 'lucide-react';

interface QuickActionsProps {
  onAction: (action: string) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const quickActions: QuickAction[] = [
  {
    id: 'journal',
    label: 'Write Journal',
    icon: <PenTool className="w-5 h-5" />,
    color: 'from-soft-lavender-500 to-soft-lavender-600',
    description: 'Record thoughts and reflections'
  },
  {
    id: 'task',
    label: 'Create Task',
    icon: <PlusSquare className="w-5 h-5" />,
    color: 'from-sage-500 to-sage-600',
    description: 'Add new task to your list'
  },
  {
    id: 'event',
    label: 'Schedule Event',
    icon: <Calendar className="w-5 h-5" />,
    color: 'from-dusty-blue-500 to-dusty-blue-600',
    description: 'Plan calendar events'
  },
  {
    id: 'email',
    label: 'Compose Email',
    icon: <Mail className="w-5 h-5" />,
    color: 'from-purple-500 to-purple-600',
    description: 'Write and send emails'
  },
  {
    id: 'contact',
    label: 'Add Contact',
    icon: <UserPlus className="w-5 h-5" />,
    color: 'from-pink-500 to-pink-600',
    description: 'Expand your network'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  return (
    <div className="glass-card">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onAction(action.id)}
            className="group relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 hover:scale-105"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>

            <div className="relative">
              <div className={`inline-flex p-2 rounded-lg bg-gradient-to-br ${action.color} text-white mb-3 group-hover:scale-110 transition-transform duration-300`}>
                {action.icon}
              </div>

              <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                {action.label}
              </h4>

              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                {action.description}
              </p>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-sage-500/10 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-300 text-center">
          💡 <span className="font-medium">Pro tip:</span> Press <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl</kbd> + <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">K</kbd> for quick actions
        </p>
      </div>
    </div>
  );
};