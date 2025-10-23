import React from 'react';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { calculateMeetingLoad, getWeekData } from '../utils/helpers';
import { CalendarEvent } from '../types';

interface MeetingLoadProps {
  events: CalendarEvent[];
}

export const MeetingLoad: React.FC<MeetingLoadProps> = ({ events }) => {
  const meetingLoad = calculateMeetingLoad(events);
  const thisWeekEvents = getWeekData(events, 'date', 0);
  const totalMeetingHours = thisWeekEvents.reduce((sum, event) => sum + (event.duration / 60), 0);

  const getLoadStatus = (load: number) => {
    if (load >= 75) return {
      status: 'High',
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-500/20 border-red-500/30',
      icon: <AlertCircle className="w-5 h-5" />,
      message: 'Consider reducing meeting time'
    };
    if (load >= 50) return {
      status: 'Moderate',
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/20 border-yellow-500/30',
      icon: <Clock className="w-5 h-5" />,
      message: 'Meeting load is manageable'
    };
    return {
      status: 'Low',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/20 border-green-500/30',
      icon: <CheckCircle className="w-5 h-5" />,
      message: 'Great balance of meetings and focus time'
    };
  };

  const loadStatus = getLoadStatus(meetingLoad);

  const workDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const meetingsByDay = workDays.map(day => {
    const dayEvents = thisWeekEvents.filter(event => {
      const eventDay = event.date.toLocaleDateString('en-US', { weekday: 'long' });
      return eventDay === day;
    });
    return {
      day: day.slice(0, 3),
      hours: dayEvents.reduce((sum, event) => sum + (event.duration / 60), 0)
    };
  });

  const maxHours = Math.max(...meetingsByDay.map(d => d.hours), 1);

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Meeting Load</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${loadStatus.bgColor} ${loadStatus.color} border`}>
          {loadStatus.icon}
          <span className="ml-1">{loadStatus.status}</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {meetingLoad}%
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          of work hours spent in meetings
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {totalMeetingHours.toFixed(1)} hours this week
        </p>
      </div>

      <div className="space-y-3 mb-4">
        {meetingsByDay.map(({ day, hours }) => (
          <div key={day} className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300 w-12">
              {day}
            </span>
            <div className="flex-1 h-6 bg-white/20 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  hours >= 4 ? 'bg-red-500' :
                  hours >= 2 ? 'bg-yellow-500' :
                  'bg-sage-500'
                }`}
                style={{ width: `${(hours / maxHours) * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-300 w-12 text-right">
              {hours}h
            </span>
          </div>
        ))}
      </div>

      <div className={`p-3 rounded-lg ${loadStatus.bgColor} border`}>
        <div className="flex items-start gap-2">
          {loadStatus.icon}
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {loadStatus.message}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
              {meetingLoad >= 75 && 'Your calendar is quite packed. Consider blocking focus time or consolidating meetings.'}
              {meetingLoad >= 50 && meetingLoad < 75 && 'You have a good balance of collaborative time and individual work.'}
              {meetingLoad < 50 && 'You have plenty of time for deep work and focused tasks.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};