import React from 'react';
import { X, BookOpen, Sun, Moon, Heart, Target } from 'lucide-react';

interface EntryTemplatesProps {
  onSelectTemplate: (template: string) => void;
  onClose: () => void;
}

const EntryTemplates: React.FC<EntryTemplatesProps> = ({ onSelectTemplate, onClose }) => {
  const templates = [
    {
      id: 'Morning Pages',
      name: 'Morning Pages',
      icon: Sun,
      description: 'Start your day with intention and reflection',
      color: 'text-yellow-500',
      preview: 'Good morning! Today I\'m feeling...\n\nMy intentions for today are...\n\nI\'m grateful for...'
    },
    {
      id: 'Evening Reflection',
      name: 'Evening Reflection',
      icon: Moon,
      description: 'Reflect on your day and prepare for tomorrow',
      color: 'text-blue-500',
      preview: 'Today I accomplished...\n\nWhat went well...\n\nWhat could have been better...'
    },
    {
      id: 'Gratitude',
      name: 'Gratitude',
      icon: Heart,
      description: 'Focus on appreciation and positive aspects',
      color: 'text-pink-500',
      preview: 'Today I\'m grateful for...\n\nThree things that brought me joy:\n1. \n2. \n3. '
    },
    {
      id: 'Goal Review',
      name: 'Goal Review',
      icon: Target,
      description: 'Track progress and plan next steps',
      color: 'text-green-500',
      preview: 'Progress on my goals:\n\nWhat worked well:\n\nChallenges faced:\n\nNext steps:'
    }
  ];

  return (
    <div className="mb-4 p-4 bg-white/10 dark:bg-white/5 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sage-600 dark:text-sage-400" />
          <h4 className="font-medium text-gray-900 dark:text-white">Choose a Template</h4>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors duration-200"
        >
          <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {templates.map(template => {
          const IconComponent = template.icon;
          return (
            <button
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className="text-left p-3 rounded-lg glass hover:bg-white/20 transition-all duration-200 group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-white/10 dark:bg-white/5 ${template.color}`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h5 className="font-medium text-gray-900 dark:text-white group-hover:text-sage-600 dark:group-hover:text-sage-400 transition-colors duration-200">
                    {template.name}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {template.description}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate">
                    {template.preview}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EntryTemplates;