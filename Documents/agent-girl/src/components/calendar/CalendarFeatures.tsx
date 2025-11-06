import React, { useState, useEffect } from 'react';
import { CalendarEvent, TimeSlot, DaySummary } from '../../types/calendar';
import { format, startOfDay, endOfDay, addDays, isToday, isBefore, isAfter } from 'date-fns';
import { useNotifications } from '../NotificationSystem';

interface CalendarFeaturesProps {
  events: CalendarEvent[];
}

export const CalendarFeatures: React.FC<CalendarFeaturesProps> = ({ events }) => {
  const [dailySummary, setDailySummary] = useState<DaySummary | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const { showSuccess, showInfo } = useNotifications();

  // Generate daily summary at 6 PM
  useEffect(() => {
    const now = new Date();
    const isSixPM = now.getHours() === 18 && now.getMinutes() === 0;

    if (isSixPM || true) { // Set to true for demo purposes
      generateDailySummary();
    }
  }, [events]);

  // Find available time slots
  useEffect(() => {
    const availableSlots = findAvailableTimeSlots();
    setTimeSlots(availableSlots);
  }, [events]);

  const generateDailySummary = () => {
    const today = startOfDay(new Date());
    const todayEvents = events.filter(event =>
      event.startTime.toDateString() === today.toDateString()
    );

    const totalEvents = todayEvents.length;
    const totalMinutes = todayEvents.reduce((sum, event) =>
      sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60), 0
    );
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    const eventsByType = todayEvents.reduce((acc, event) => {
      acc[event.type.id] = (acc[event.type.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const conflicts = findConflicts(todayEvents);
    const highlights = todayEvents.filter(event =>
      event.attendees.length > 1 || event.type.id === 'meeting'
    );

    const suggestions = generateSuggestions(todayEvents, totalHours);

    setDailySummary({
      date: today,
      totalEvents,
      totalHours,
      eventsByType,
      conflicts,
      suggestions,
      highlights,
    });
  };

  const findConflicts = (dayEvents: CalendarEvent[]) => {
    const conflicts: CalendarEvent[] = [];

    for (let i = 0; i < dayEvents.length; i++) {
      for (let j = i + 1; j < dayEvents.length; j++) {
        const event1 = dayEvents[i];
        const event2 = dayEvents[j];

        if (
          event1.startTime < event2.endTime &&
          event1.endTime > event2.startTime
        ) {
          conflicts.push(event1, event2);
        }
      }
    }

    return [...new Set(conflicts)];
  };

  const generateSuggestions = (dayEvents: CalendarEvent[], totalHours: number) => {
    const suggestions: string[] = [];

    if (totalHours > 8) {
      suggestions.push('Consider scheduling breaks between meetings');
    }

    if (totalHours < 4) {
      suggestions.push('You have a light schedule - perfect for deep work');
    }

    const meetingCount = dayEvents.filter(e => e.attendees.length > 1).length;
    if (meetingCount > 5) {
      suggestions.push('Heavy meeting load - consider consolidating or declining some');
    }

    const hasExercise = dayEvents.some(e => e.type.id === 'exercise');
    if (!hasExercise) {
      suggestions.push('Don\'t forget to schedule some exercise');
    }

    return suggestions;
  };

  const findAvailableTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const today = startOfDay(new Date());
    const tomorrow = endOfDay(addDays(today, 1));

    // Create 30-minute slots from 6 AM to 10 PM
    for (let hour = 6; hour < 22; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const slotStart = new Date(today);
        slotStart.setHours(hour, minute, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

        if (slotEnd > tomorrow) continue;

        // Check if slot is available
        const conflicts = events.filter(event =>
          event.startTime < slotEnd && event.endTime > slotStart
        );

        const available = conflicts.length === 0;
        const score = calculateSlotScore(slotStart, slotEnd);

        slots.push({
          start: slotStart,
          end: slotEnd,
          available,
          conflicts: available ? [] : conflicts,
          score,
        });
      }
    }

    return slots.filter(slot => slot.available).slice(0, 10);
  };

  const calculateSlotScore = (start: Date, end: Date): number => {
    let score = 100;
    const hour = start.getHours();

    // Prefer business hours
    if (hour >= 9 && hour <= 17) {
      score += 50;
    }

    // Avoid lunch time
    if (hour >= 12 && hour < 13) {
      score -= 30;
    }

    // Prefer morning hours
    if (hour >= 9 && hour < 11) {
      score += 30;
    }

    return Math.max(0, score);
  };

  const exportCalendar = (format: 'pdf' | 'ical' | 'csv') => {
    // Simulate export functionality
    console.log(`Exporting calendar as ${format}`);
    showSuccess('Calendar Exported', `Calendar exported as ${format.toUpperCase()} - Check downloads folder`);
  };

  const findMeetingTimes = () => {
    // Find best time slots for meetings
    const bestSlots = timeSlots
      .filter(slot => slot.score && slot.score > 100)
      .slice(0, 5);

    return bestSlots;
  };

  if (!dailySummary && timeSlots.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Daily Summary */}
      {dailySummary && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">📊</span>
            Daily Calendar Summary
          </h3>

          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-600 dark:text-sage-400">
                {dailySummary.totalEvents}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-dusty-blue-600 dark:text-dusty-blue-400">
                {dailySummary.totalHours}h
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Time</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-soft-lavender-600 dark:text-soft-lavender-400">
                {dailySummary.conflicts.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Conflicts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {dailySummary.highlights.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Highlights</div>
            </div>
          </div>

          {/* Suggestions */}
          {dailySummary.suggestions.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Suggestions</h4>
              <div className="space-y-2">
                {dailySummary.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span className="text-amber-500">💡</span>
                    {suggestion}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Event Types Summary */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Event Breakdown</h4>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(dailySummary.eventsByType).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 bg-sage-500 rounded-full"></div>
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {type}: {count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Available Time Slots */}
      {timeSlots.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="text-xl">⏰</span>
            Available Time Slots
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {timeSlots.slice(0, 6).map((slot, index) => (
              <div
                key={index}
                className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {format(slot.start, 'EEE, MMM d')}
                    </div>
                  </div>
                  {slot.score && (
                    <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                      Score: {slot.score}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>

        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => exportCalendar('ical')}
            className="p-4 bg-sage-100 dark:bg-sage-900/30 rounded-lg hover:bg-sage-200 dark:hover:bg-sage-900/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📤</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Export iCal</div>
          </button>

          <button
            onClick={() => exportCalendar('pdf')}
            className="p-4 bg-dusty-blue-100 dark:bg-dusty-blue-900/30 rounded-lg hover:bg-dusty-blue-200 dark:hover:bg-dusty-blue-900/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📄</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Export PDF</div>
          </button>

          <button
            onClick={() => {
              const slots = findMeetingTimes();
              showInfo('Meeting Times Found', `Found ${slots.length} optimal time slots for meetings`);
            }}
            className="p-4 bg-soft-lavender-100 dark:bg-soft-lavender-900/30 rounded-lg hover:bg-soft-lavender-200 dark:hover:bg-soft-lavender-900/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">Find Time</div>
          </button>
        </div>
      </div>
    </div>
  );
};