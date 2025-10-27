import React from 'react';

const CalendarApp: React.FC = () => {
  return (
    <div className="glass-card rounded-xl p-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Calendar</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-7 gap-2 text-center">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }, (_, i) => {
            const day = i - 2; // Start from appropriate day
            const isToday = day === 24; // Today is 24th
            const isCurrentMonth = day >= 1 && day <= 31;

            return (
              <div
                key={i}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm
                  ${isToday ? 'bg-blue-500 text-white font-bold' : ''}
                  ${isCurrentMonth ? 'text-gray-900 dark:text-white hover:bg-white/10' : 'text-gray-400'}
                  transition-colors cursor-pointer`}
              >
                {isCurrentMonth ? day : ''}
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Today's Events</h3>
          <div className="space-y-2">
            <div className="glass-card rounded-lg p-3 border-l-4 border-blue-500">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Team Meeting</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">10:00 AM - 11:00 AM</div>
            </div>
            <div className="glass-card rounded-lg p-3 border-l-4 border-green-500">
              <div className="text-sm font-semibold text-gray-900 dark:text-white">Code Review</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">2:00 PM - 2:30 PM</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarApp;