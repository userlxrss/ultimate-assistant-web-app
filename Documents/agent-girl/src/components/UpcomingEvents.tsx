import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { getCountdown, formatDateTime, formatTime } from '../utils/helpers';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';

interface UpcomingEventsProps {
  events: CalendarEvent[];
}

const getEventIcon = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'meeting': return <Users className="w-4 h-4" />;
    case 'personal': return <Clock className="w-4 h-4" />;
    case 'work': return <Calendar className="w-4 h-4" />;
    case 'learning': return <Calendar className="w-4 h-4" />;
    case 'health': return <Calendar className="w-4 h-4" />;
    default: return <Calendar className="w-4 h-4" />;
  }
};

const getEventColor = (type: CalendarEvent['type']) => {
  switch (type) {
    case 'meeting': return 'bg-dusty-blue-500/20 text-dusty-blue-600 dark:text-dusty-blue-400 border-dusty-blue-500/30';
    case 'personal': return 'bg-soft-lavender-500/20 text-soft-lavender-600 dark:text-soft-lavender-400 border-soft-lavender-500/30';
    case 'work': return 'bg-sage-500/20 text-sage-600 dark:text-sage-400 border-sage-500/30';
    case 'learning': return 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30';
    case 'health': return 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30';
    default: return 'bg-gray-500/20 text-gray-600 dark:text-gray-400 border-gray-500/30';
  }
};

export const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const upcomingEvents = events
    .filter(event => event.date > currentTime)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5);

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Events</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">Next 5 events</span>
      </div>

      <div className="space-y-3">
        {upcomingEvents.map((event, index) => {
          const countdown = getCountdown(event.date);
          const isToday = event.date.toDateString() === currentTime.toDateString();
          const isPast = event.date < currentTime;

          return (
            <div
              key={event.id}
              className={`glass p-4 rounded-xl border-l-4 ${getEventColor(event.type)} hover:scale-[1.02] transition-all duration-300 animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-2 rounded-lg ${getEventColor(event.type)}`}>
                      {getEventIcon(event.type)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                        {event.type}
                      </p>
                    </div>
                  </div>

                  <div className="ml-10 space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDateTime(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Clock className="w-3 h-3" />
                      <span>{event.duration} minutes</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    isPast ? 'text-red-500' :
                    isToday ? 'text-orange-500' :
                    'text-sage-600 dark:text-sage-400'
                  }`}>
                    {countdown}
                  </div>
                  {isToday && (
                    <span className="text-xs text-orange-500 font-medium">Today</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {upcomingEvents.length === 0 && (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Your calendar is clear for now
            </p>
          </div>
        )}
      </div>

      {events.filter(event => event.date > currentTime).length > 5 && (
        <div className="mt-4 pt-4 border-t border-white/10 dark:border-white/5">
          <button className="w-full text-center text-sm text-sage-600 dark:text-sage-400 hover:text-sage-500 dark:hover:text-sage-300 transition-colors duration-200">
            View all events ({events.filter(event => event.date > currentTime).length} total) →
          </button>
        </div>
      )}
    </div>
  );
};