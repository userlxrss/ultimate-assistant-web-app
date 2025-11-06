import React, { useState } from 'react';
import { CalendarEvent, TimeSlot, ConflictResolution } from '../../types/calendar';
import { format, addMinutes, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';

interface ConflictDetectorProps {
  events: CalendarEvent[];
  onResolveConflict: (resolution: ConflictResolution) => void;
}

export const ConflictDetector: React.FC<ConflictDetectorProps> = ({
  events,
  onResolveConflict,
}) => {
  const [detectedConflicts, setDetectedConflicts] = useState<ConflictResolution[]>([]);

  // Detect conflicts on mount and when events change
  React.useEffect(() => {
    const conflicts = detectConflicts(events);
    setDetectedConflicts(conflicts);
  }, [events]);

  const detectConflicts = (events: CalendarEvent[]): ConflictResolution[] => {
    const conflicts: ConflictResolution[] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const event1 = events[i];
        const event2 = events[j];

        // Check if events are on the same day and overlap
        if (
          event1.startTime.toDateString() === event2.startTime.toDateString() &&
          areIntervalsOverlapping(
            { start: event1.startTime, end: event1.endTime },
            { start: event2.startTime, end: event2.endTime }
          )
        ) {
          const resolution = generateConflictResolution(event1, event2);
          conflicts.push(resolution);
        }
      }
    }

    return conflicts;
  };

  const generateConflictResolution = (event1: CalendarEvent, event2: CalendarEvent): ConflictResolution => {
    // Determine which event to prioritize (based on attendee count, type, etc.)
    const priority1 = getEventPriority(event1);
    const priority2 = getEventPriority(event2);
    const originalEvent = priority1 >= priority2 ? event1 : event2;

    // Generate alternative time slots
    const suggestedSlots = generateAlternativeTimeSlots(originalEvent, [event1, event2]);

    return {
      originalEvent,
      suggestedSlots,
      resolutionType: 'reschedule',
      reason: `Conflicts with ${priority1 < priority2 ? event1.title : event2.title}`,
    };
  };

  const getEventPriority = (event: CalendarEvent): number => {
    let priority = 0;

    // Higher priority for meetings with more attendees
    priority += event.attendees.length * 10;

    // Higher priority for certain event types
    const typePriorities: Record<string, number> = {
      meeting: 100,
      call: 80,
      review: 70,
      learning: 60,
      focus: 50,
      personal: 40,
      break: 30,
      exercise: 20,
      lunch: 10,
    };
    priority += typePriorities[event.type.id] || 0;

    // Higher priority for confirmed events
    if (event.status === 'confirmed') priority += 50;
    if (event.status === 'tentative') priority += 25;

    // Higher priority for events in the near future
    const hoursUntilEvent = (event.startTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
    if (hoursUntilEvent < 24) priority += 100;
    else if (hoursUntilEvent < 72) priority += 50;

    return priority;
  };

  const generateAlternativeTimeSlots = (
    targetEvent: CalendarEvent,
    conflictingEvents: CalendarEvent[]
  ): TimeSlot[] => {
    const duration = targetEvent.endTime.getTime() - targetEvent.startTime.getTime();
    const slots: TimeSlot[] = [];

    // Generate slots for the next 7 days
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(targetEvent.startTime);
      date.setDate(date.getDate() + dayOffset);
      date.setHours(9, 0, 0, 0); // Start at 9 AM

      // Generate slots from 9 AM to 6 PM
      for (let hour = 9; hour < 18; hour++) {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);

        const slotEnd = new Date(slotStart.getTime() + duration);

        // Check if this slot conflicts with any events
        const conflicts = conflictingEvents.filter(event =>
          areIntervalsOverlapping(
            { start: slotStart, end: slotEnd },
            { start: event.startTime, end: event.endTime }
          )
        );

        const available = conflicts.length === 0;
        const score = calculateSlotScore(slotStart, slotEnd, targetEvent);

        slots.push({
          start: slotStart,
          end: slotEnd,
          available,
          conflicts: available ? [] : conflicts,
          score,
        });
      }
    }

    // Sort by availability and score
    return slots
      .filter(slot => slot.available)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5); // Return top 5 suggestions
  };

  const calculateSlotScore = (start: Date, end: Date, event: CalendarEvent): number => {
    let score = 100;

    // Prefer business hours (9 AM - 5 PM)
    const hour = start.getHours();
    if (hour >= 9 && hour <= 17) {
      score += 50;
    }

    // Prefer weekdays
    const dayOfWeek = start.getDay();
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      score += 30;
    }

    // Prefer times closer to original time
    const originalHour = event.startTime.getHours();
    const hourDiff = Math.abs(hour - originalHour);
    score -= hourDiff * 5;

    // Prefer earlier days if conflict is today
    const daysDiff = Math.floor((start.getTime() - event.startTime.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff === 0) score += 100;
    else if (daysDiff === 1) score += 50;
    else score -= daysDiff * 10;

    // Avoid lunch time (12 PM - 1 PM)
    if (hour >= 12 && hour < 13) {
      score -= 30;
    }

    return Math.max(0, score);
  };

  const handleAcceptSuggestion = (conflict: ConflictResolution, slot: TimeSlot) => {
    onResolveConflict({
      ...conflict,
      resolutionType: 'reschedule',
      suggestedSlots: [slot],
    });
  };

  if (detectedConflicts.length === 0) {
    return null;
  }

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-red-500">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Schedule Conflicts Detected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {detectedConflicts.length} conflict{detectedConflicts.length > 1 ? 's' : ''} found
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {detectedConflicts.map((conflict, index) => (
          <div key={index} className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="mb-3">
              <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                {conflict.originalEvent.title}
              </h4>
              <p className="text-sm text-red-600 dark:text-red-400">
                {conflict.reason}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Currently scheduled: {format(conflict.originalEvent.startTime, 'MMM d, h:mm a')} - {format(conflict.originalEvent.endTime, 'h:mm a')}
              </p>
            </div>

            <div className="space-y-2">
              <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">Suggested alternatives:</h5>
              {conflict.suggestedSlots.slice(0, 3).map((slot, slotIndex) => (
                <div
                  key={slotIndex}
                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {format(slot.start, 'EEEE, MMM d')}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {format(slot.start, 'h:mm a')} - {format(slot.end, 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAcceptSuggestion(conflict, slot)}
                    className="px-3 py-1 text-sm bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                  >
                    Accept
                  </button>
                </div>
              ))}
            </div>

            {/* Alternative resolution options */}
            <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800">
              <div className="flex gap-2">
                <button
                  onClick={() => onResolveConflict({ ...conflict, resolutionType: 'buffer' })}
                  className="text-xs px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 transition-colors"
                >
                  Add Buffer Time
                </button>
                <button
                  onClick={() => onResolveConflict({ ...conflict, resolutionType: 'skip' })}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Keep as Is
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {detectedConflicts.length} event{detectedConflicts.length > 1 ? 's' : ''} need rescheduling
          </span>
          <button
            onClick={() => {
              // Auto-resolve all conflicts with best suggestions
              detectedConflicts.forEach(conflict => {
                if (conflict.suggestedSlots.length > 0) {
                  handleAcceptSuggestion(conflict, conflict.suggestedSlots[0]);
                }
              });
            }}
            className="text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 font-medium"
          >
            Auto-resolve All
          </button>
        </div>
      </div>
    </div>
  );
};