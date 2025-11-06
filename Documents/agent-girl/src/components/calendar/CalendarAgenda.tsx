import React, { useState } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { format, startOfDay, endOfDay, isSameDay, addDays } from 'date-fns';

interface CalendarAgendaProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onDayClick: (date: Date) => void;
}

export const CalendarAgenda: React.FC<CalendarAgendaProps> = ({
  events,
  currentDate,
  onEventClick,
  onDayClick,
}) => {
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());

  // Group events by day and sort
  const eventsByDay = React.useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>();

    events.forEach(event => {
      const dayKey = format(event.startTime, 'yyyy-MM-dd');
      if (!grouped.has(dayKey)) {
        grouped.set(dayKey, []);
      }
      grouped.get(dayKey)!.push(event);
    });

    // Sort events within each day
    grouped.forEach(dayEvents => {
      dayEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    });

    return grouped;
  }, [events]);

  const toggleDayExpansion = (dayKey: string) => {
    setExpandedDays(prev => {
      const newSet = new Set(prev);
      if (newSet.has(dayKey)) {
        newSet.delete(dayKey);
      } else {
        newSet.add(dayKey);
      }
      return newSet;
    });
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-sage-100 border-sage-300 text-sage-700 dark:bg-sage-900/30 dark:border-sage-700 dark:text-sage-300',
      call: 'bg-dusty-blue-100 border-dusty-blue-300 text-dusty-blue-700 dark:bg-dusty-blue-900/30 dark:border-dusty-blue-700 dark:text-dusty-blue-300',
      focus: 'bg-soft-lavender-100 border-soft-lavender-300 text-soft-lavender-700 dark:bg-soft-lavender-900/30 dark:border-soft-lavender-700 dark:text-soft-lavender-300',
      break: 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300',
      learning: 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-300',
      exercise: 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-300',
      personal: 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300',
      travel: 'bg-cyan-100 border-cyan-300 text-cyan-700 dark:bg-cyan-900/30 dark:border-cyan-700 dark:text-cyan-300',
      lunch: 'bg-emerald-100 border-emerald-300 text-emerald-700 dark:bg-emerald-900/30 dark:border-emerald-700 dark:text-emerald-300',
      review: 'bg-orange-100 border-orange-300 text-orange-700 dark:bg-orange-900/30 dark:border-orange-700 dark:text-orange-300',
    };
    return colors[type] || colors.meeting;
  };

  const getEventIcon = (type: string) => {
    const icons: Record<string, string> = {
      meeting: '🤝',
      call: '📞',
      focus: '🎯',
      break: '☕',
      learning: '📚',
      exercise: '🏃',
      personal: '👤',
      travel: '✈️',
      lunch: '🍽️',
      review: '📋',
    };
    return icons[type] || '📅';
  };

  const formatEventDuration = (event: CalendarEvent) => {
    const duration = Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60));
    if (duration < 60) {
      return `${duration}min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
  };

  const getDayStats = (dayEvents: CalendarEvent[]) => {
    const totalMinutes = dayEvents.reduce((sum, event) =>
      sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60), 0
    );
    const meetingCount = dayEvents.filter(e => e.attendees.length > 1).length;
    const focusCount = dayEvents.filter(e => e.type.id === 'focus').length;

    return {
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      meetingCount,
      focusCount,
      eventCount: dayEvents.length
    };
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Agenda</h2>

      <div className="space-y-4">
        {Array.from(eventsByDay.entries())
          .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
          .map(([dayKey, dayEvents]) => {
            const dayDate = new Date(dayKey);
            const isToday = isSameDay(dayDate, new Date());
            const isExpanded = expandedDays.has(dayKey);
            const stats = getDayStats(dayEvents);

            return (
              <div key={dayKey} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                {/* Day header */}
                <div
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isToday ? 'bg-sage-50 dark:bg-sage-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
                  } hover:bg-gray-100 dark:hover:bg-gray-800`}
                  onClick={() => toggleDayExpansion(dayKey)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className={`font-semibold text-lg ${
                          isToday ? 'text-sage-600 dark:text-sage-400' : 'text-gray-900 dark:text-white'
                        }`}>
                          {format(dayDate, 'EEEE')}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {format(dayDate, 'MMMM d, yyyy')}
                          {isToday && ' • Today'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Day stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.eventCount} events
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          {stats.totalHours}h
                        </span>
                        {stats.meetingCount > 0 && (
                          <span className="text-dusty-blue-600 dark:text-dusty-blue-400">
                            {stats.meetingCount} meetings
                          </span>
                        )}
                      </div>

                      {/* Expand/collapse icon */}
                      <button className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-white/10 transition-colors">
                        <svg
                          className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${
                            isExpanded ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Events list */}
                {isExpanded && (
                  <div className="p-4 space-y-3 bg-white dark:bg-gray-900/50">
                    {dayEvents.map((event, eventIndex) => (
                      <div
                        key={`${event.id}-${eventIndex}`}
                        className={`p-4 rounded-lg border-l-4 cursor-pointer transition-all duration-200 hover:shadow-md ${getEventColor(event.type.id)}`}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-lg">{getEventIcon(event.type.id)}</span>
                              <h4 className="font-semibold text-gray-900 dark:text-white">
                                {event.title}
                              </h4>
                              {event.status === 'tentative' && (
                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                  Tentative
                                </span>
                              )}
                              {event.status === 'cancelled' && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  Cancelled
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-2">
                              <span className="flex items-center gap-1">
                                🕐 {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                              </span>
                              <span>{formatEventDuration(event)}</span>
                            </div>

                            {event.location && (
                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                📍 {event.location}
                              </div>
                            )}

                            {event.description && (
                              <div className="text-sm text-gray-700 dark:text-gray-300 mb-2 line-clamp-2">
                                {event.description}
                              </div>
                            )}

                            {event.attendees.length > 1 && (
                              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <span>👥</span>
                                <span>{event.attendees.length} attendees</span>
                                <div className="flex -space-x-2">
                                  {event.attendees.slice(0, 3).map((attendee, index) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 rounded-full bg-sage-200 dark:bg-sage-700 flex items-center justify-center text-xs font-medium text-sage-700 dark:text-sage-300 border border-white dark:border-gray-800"
                                    >
                                      {attendee.name ? attendee.name.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                                    </div>
                                  ))}
                                  {event.attendees.length > 3 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-400 border border-white dark:border-gray-800">
                                      +{event.attendees.length - 3}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {event.conferenceData && (
                              <div className="text-sm text-sage-600 dark:text-sage-400 mt-2">
                                🔗 {event.conferenceData.conferenceSolution.name} available
                              </div>
                            )}
                          </div>

                          <div className="ml-4">
                            <button className="p-2 rounded-lg hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
                              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Empty state for day */}
                    {dayEvents.length === 0 && (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        No events scheduled
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

        {/* Empty state */}
        {eventsByDay.size === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No events scheduled
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Click on a time slot to create your first event
            </p>
          </div>
        )}
      </div>
    </div>
  );
};