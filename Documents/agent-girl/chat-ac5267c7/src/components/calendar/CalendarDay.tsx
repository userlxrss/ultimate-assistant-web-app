import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CalendarEvent } from '../../types/calendar';
import { format, setHours, setMinutes, addMinutes, isToday, areIntervalsOverlapping } from 'date-fns';

interface CalendarDayProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  onEventDrop: (eventId: string, newStartTime: Date) => void;
  onEventResize: (eventId: string, newDuration: number) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export const CalendarDay: React.FC<CalendarDayProps> = ({
  events,
  currentDate,
  onEventClick,
  onTimeSlotClick,
  onEventDrop,
  onEventResize,
}) => {
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  const [resizingEvent, setResizingEvent] = useState<string | null>(null);
  const [initialEventData, setInitialEventData] = useState<{ eventId: string; initialY: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const dayEvents = events.filter(event =>
    event.startTime.toDateString() === currentDate.toDateString()
  );

  const getEventPosition = (event: CalendarEvent, allEvents: CalendarEvent[]) => {
    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
    const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;

    const top = (startHour / 24) * 100;
    const height = ((endHour - startHour) / 24) * 100;

    // Find available column for overlapping events
    const overlappingEvents = allEvents.filter(e =>
      e.id !== event.id && areIntervalsOverlapping(
        { start: e.startTime, end: e.endTime },
        { start: event.startTime, end: event.endTime }
      )
    );

    const column = overlappingEvents.length;
    const width = 100 / (overlappingEvents.length + 1);
    const left = column * width;

    return { top, height, width, left };
  };

  const handleMouseDown = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();

    setDraggedEvent(eventId);
    setInitialEventData({ eventId, initialY: e.clientY });
  };

  const handleResizeMouseDown = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingEvent(eventId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggedEvent || !gridRef.current || !initialEventData) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const deltaY = e.clientY - initialEventData.initialY;
    const hoursDelta = deltaY / (gridRect.height / 24);

    // Visual feedback only
  }, [draggedEvent, initialEventData]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggedEvent || !gridRef.current || !initialEventData) {
      setDraggedEvent(null);
      setResizingEvent(null);
      setInitialEventData(null);
      return;
    }

    const gridRect = gridRef.current.getBoundingClientRect();
    const deltaY = e.clientY - initialEventData.initialY;
    const hoursDelta = deltaY / (gridRect.height / 24);
    const event = dayEvents.find(ev => ev.id === draggedEvent);

    if (event) {
      const newStartTime = addMinutes(event.startTime, hoursDelta * 60);
      onEventDrop(draggedEvent, newStartTime);
    }

    setDraggedEvent(null);
    setResizingEvent(null);
    setInitialEventData(null);
  }, [draggedEvent, initialEventData, dayEvents, onEventDrop]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingEvent || !gridRef.current) return;

    // Visual feedback only
  }, [resizingEvent]);

  const handleResizeMouseUp = useCallback((e: MouseEvent) => {
    if (!resizingEvent || !gridRef.current) {
      setResizingEvent(null);
      return;
    }

    const event = dayEvents.find(ev => ev.id === resizingEvent);
    if (!event) return;

    const eventElement = document.getElementById(`event-${resizingEvent}`);
    if (!eventElement) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const eventRect = eventElement.getBoundingClientRect();
    const newHeight = e.clientY - eventRect.top;
    const hoursDelta = newHeight / (gridRect.height / 24);
    const newDuration = Math.max(15, Math.round(hoursDelta * 60));

    onEventResize(resizingEvent, newDuration);
    setResizingEvent(null);
  }, [resizingEvent, dayEvents, onEventResize]);

  useEffect(() => {
    if (draggedEvent) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggedEvent, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    if (resizingEvent) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleResizeMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleResizeMouseMove);
        document.removeEventListener('mouseup', handleResizeMouseUp);
      };
    }
  }, [resizingEvent, handleResizeMouseMove, handleResizeMouseUp]);

  const handleTimeSlotClick = (hour: number) => {
    const slotDate = setMinutes(setHours(currentDate, hour), 0);
    onTimeSlotClick(slotDate);
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'bg-sage-500/20 border-sage-500 text-sage-700 dark:text-sage-300',
      call: 'bg-dusty-blue-500/20 border-dusty-blue-500 text-dusty-blue-700 dark:text-dusty-blue-300',
      focus: 'bg-soft-lavender-500/20 border-soft-lavender-500 text-soft-lavender-700 dark:text-soft-lavender-300',
      break: 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300',
      learning: 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300',
      exercise: 'bg-red-500/20 border-red-500 text-red-700 dark:text-red-300',
      personal: 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300',
      travel: 'bg-cyan-500/20 border-cyan-500 text-cyan-700 dark:text-cyan-300',
      lunch: 'bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300',
      review: 'bg-orange-500/20 border-orange-500 text-orange-700 dark:text-orange-300',
    };
    return colors[type] || colors.meeting;
  };

  const isCurrentDay = isToday(currentDate);

  return (
    <div className="glass-card rounded-2xl p-6">
      {/* Day header */}
      <div className={`mb-4 p-4 rounded-xl text-center ${
        isCurrentDay ? 'bg-sage-100 dark:bg-sage-900/30' : 'bg-white/50 dark:bg-black/20'
      }`}>
        <h3 className={`text-2xl font-bold ${
          isCurrentDay ? 'text-sage-600 dark:text-sage-400' : 'text-gray-900 dark:text-white'
        }`}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        {isCurrentDay && (
          <p className="text-sm text-sage-600 dark:text-sage-400 mt-1">Today</p>
        )}
      </div>

      {/* Day summary */}
      <div className="mb-4 p-4 glass-card rounded-xl">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-sage-600 dark:text-sage-400">{dayEvents.length}</div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Events</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-dusty-blue-600 dark:text-dusty-blue-400">
              {Math.round(dayEvents.reduce((sum, event) =>
                sum + (event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60 * 60), 0
              ))}h
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-soft-lavender-600 dark:text-soft-lavender-400">
              {dayEvents.filter(e => e.attendees.length > 1).length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Meetings</div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Time labels */}
        <div className="pr-2">
          {HOURS.map(hour => (
            <div
              key={hour}
              className="h-20 flex items-start justify-end text-xs text-gray-500 dark:text-gray-400 font-medium pr-2"
            >
              {format(setMinutes(setHours(new Date(), hour), 0), 'h:mm a')}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="flex-1 relative">
          <div
            ref={gridRef}
            className="relative border border-gray-200 dark:border-gray-700 rounded-lg"
            style={{ height: `${HOURS.length * 80}px` }}
          >
            {/* Hour slots */}
            {HOURS.map(hour => (
              <div
                key={hour}
                className="absolute w-full border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 cursor-pointer transition-colors"
                style={{
                  top: `${(hour / 24) * 100}%`,
                  height: `${(1 / 24) * 100}%`,
                }}
                onClick={() => handleTimeSlotClick(hour)}
              />
            ))}

            {/* Events */}
            {dayEvents.map((event, eventIndex) => {
              const position = getEventPosition(event, dayEvents);
              const isBeingDragged = draggedEvent === event.id;
              const isBeingResized = resizingEvent === event.id;

              return (
                <div
                  key={`${event.id}-${eventIndex}`}
                  id={`event-${event.id}`}
                  className={`absolute glass-card rounded-lg p-3 cursor-move transition-all duration-200 border-l-4 ${getEventColor(event.type.id)} ${
                    isBeingDragged ? 'opacity-50 shadow-2xl scale-105 z-50' : ''
                  } ${isBeingResized ? 'ring-2 ring-sage-400 z-50' : ''} hover:shadow-lg hover:z-40`}
                  style={{
                    top: `${position.top}%`,
                    height: `${position.height}%`,
                    left: `${position.left}%`,
                    width: `${position.width}%`,
                    minHeight: '40px',
                  }}
                  onMouseDown={(e) => handleMouseDown(e, event.id)}
                  onClick={() => !isBeingDragged && onEventClick(event)}
                >
                  <div className="flex flex-col h-full justify-between">
                    <div>
                      <div className="font-semibold text-sm truncate">{event.title}</div>
                      <div className="text-xs opacity-75 mt-1">
                        {format(event.startTime, 'h:mm')} - {format(event.endTime, 'h:mm')}
                      </div>
                      {event.location && (
                        <div className="text-xs opacity-60 truncate mt-1">📍 {event.location}</div>
                      )}
                      {event.attendees.length > 1 && (
                        <div className="text-xs opacity-60 mt-1">
                          👥 {event.attendees.length} attendees
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resize handle */}
                  <div
                    className="absolute bottom-0 right-0 w-3 h-3 bg-sage-400 cursor-se-resize opacity-0 hover:opacity-100 rounded-full"
                    onMouseDown={(e) => handleResizeMouseDown(e, event.id)}
                  />
                </div>
              );
            })}
          </div>

          {/* Current time indicator */}
          {isCurrentDay && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-red-500 pointer-events-none z-30"
              style={{
                top: `${((new Date().getHours() + new Date().getMinutes() / 60) / 24) * 100}%`,
              }}
            >
              <div className="absolute -left-2 w-4 h-4 bg-red-500 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};