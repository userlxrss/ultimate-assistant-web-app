import React from 'react';
import { CalendarEvent } from '../../types/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from 'date-fns';

interface CalendarMonthProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

const WEEK_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarMonth: React.FC<CalendarMonthProps> = ({
  events,
  currentDate,
  onEventClick,
  onDayClick,
}) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days to complete the grid
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = Array(startDayOfWeek).fill(null);

  const getEventsForDay = (date: Date) => {
    return events.filter(event => isSameDay(event.startTime, date));
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'border-blue-500 text-blue-700 dark:text-blue-300',
      call: 'border-blue-500 text-blue-700 dark:text-blue-300',
      focus: 'border-purple-500 text-purple-700 dark:text-purple-300',
      break: 'border-green-500 text-green-700 dark:text-green-300',
      learning: 'border-amber-500 text-amber-700 dark:text-amber-300',
      exercise: 'border-red-500 text-red-700 dark:text-red-300',
      personal: 'border-green-500 text-green-700 dark:text-green-300',
      travel: 'border-cyan-500 text-cyan-700 dark:text-cyan-300',
      lunch: 'border-emerald-500 text-emerald-700 dark:text-emerald-300',
      review: 'border-orange-500 text-orange-700 dark:text-orange-300',
    };
    return colors[type] || colors.meeting;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-800">
        {WEEK_DAYS.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-600 dark:text-gray-400 py-2 bg-white dark:bg-gray-900">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-100 dark:bg-gray-800">
        {/* Padding days */}
        {paddingDays.map((_, index) => (
          <div key={`padding-${index}`} className="aspect-square bg-white dark:bg-gray-900 p-1" />
        ))}

        {/* Month days */}
        {monthDays.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isCurrentDay = isToday(day);
          const hasEvents = dayEvents.length > 0;

          return (
            <div
              key={day.toString()}
              className={`aspect-square bg-white dark:bg-gray-900 p-1 cursor-pointer transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/80 ${
                isCurrentMonth
                  ? isCurrentDay
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : ''
                  : 'opacity-40'
              }`}
              onClick={() => onDayClick(day)}
            >
              <div className="h-full flex flex-col">
                {/* Day number */}
                <div className={`text-xs font-medium mb-1 ${
                  isCurrentDay
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {format(day, 'd')}
                </div>

                {/* Events */}
                <div className="flex-1 overflow-hidden space-y-0.5">
                  {dayEvents.slice(0, 4).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 py-0.5 rounded truncate border-l-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 ${getEventColor(event.type.id)}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                      }}
                    >
                      {event.title}
                    </div>
                  ))}

                  {/* More events indicator */}
                  {dayEvents.length > 4 && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-medium px-1 py-0.5">
                      +{dayEvents.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};