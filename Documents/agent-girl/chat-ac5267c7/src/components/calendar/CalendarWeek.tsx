import React, { useState, useCallback, useRef, useEffect } from 'react';
import { CalendarEvent, TimeSlot } from '../../types/calendar';
import { format, startOfWeek, addDays, addMinutes, setHours, setMinutes, isSameDay, isToday, isWithinInterval, areIntervalsOverlapping } from 'date-fns';

interface CalendarWeekProps {
  events: CalendarEvent[];
  currentDate: Date;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date) => void;
  onEventDrop: (eventId: string, newStartTime: Date) => void;
  onEventResize: (eventId: string, newDuration: number) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6); // 6 AM to 8 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarWeek: React.FC<CalendarWeekProps> = ({
  events,
  currentDate,
  onEventClick,
  onTimeSlotClick,
  onEventDrop,
  onEventResize,
}) => {
  const [draggedEvent, setDraggedEvent] = useState<string | null>(null);
  const [resizingEvent, setResizingEvent] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [initialEventData, setInitialEventData] = useState<{ eventId: string; initialY: number } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Group events by day
  const eventsByDay = useCallback(() => {
    const grouped = new Map<number, CalendarEvent[]>();

    weekDays.forEach((day, dayIndex) => {
      grouped.set(dayIndex, events.filter(event => isSameDay(event.startTime, day)));
    });

    return grouped;
  }, [events, weekDays]);

  const getEventPosition = (event: CalendarEvent, dayIndex: number) => {
    const startHour = event.startTime.getHours() + event.startTime.getMinutes() / 60;
    const endHour = event.endTime.getHours() + event.endTime.getMinutes() / 60;

    const top = ((startHour - 6) / 15) * 100; // 6 AM to 8 PM = 15 hours
    const height = ((endHour - startHour) / 15) * 100;

    // Find available column (side-by-side events)
    const dayEvents = eventsByDay().get(dayIndex) || [];
    const overlappingEvents = dayEvents.filter(e =>
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

    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });

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
    const hoursDelta = deltaY / (gridRect.height / 15); // 15 hours visible
    const newStartTime = addMinutes(events.find(ev => ev.id === draggedEvent)!.startTime, hoursDelta * 60);

    // Visual feedback only - actual update happens on mouse up
  }, [draggedEvent, initialEventData, events]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!draggedEvent || !gridRef.current || !initialEventData) {
      setDraggedEvent(null);
      setResizingEvent(null);
      setInitialEventData(null);
      return;
    }

    const gridRect = gridRef.current.getBoundingClientRect();
    const deltaY = e.clientY - initialEventData.initialY;
    const hoursDelta = deltaY / (gridRect.height / 15);
    const event = events.find(ev => ev.id === draggedEvent);

    if (event) {
      const newStartTime = addMinutes(event.startTime, hoursDelta * 60);
      onEventDrop(draggedEvent, newStartTime);
    }

    setDraggedEvent(null);
    setResizingEvent(null);
    setInitialEventData(null);
  }, [draggedEvent, initialEventData, events, onEventDrop]);

  const handleResizeMouseMove = useCallback((e: MouseEvent) => {
    if (!resizingEvent || !gridRef.current) return;

    const event = events.find(ev => ev.id === resizingEvent);
    if (!event) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const eventElement = document.getElementById(`event-${resizingEvent}`);
    if (!eventElement) return;

    const eventRect = eventElement.getBoundingClientRect();
    const newHeight = e.clientY - eventRect.top;
    const hoursDelta = newHeight / (gridRect.height / 15);
    const newDuration = Math.max(15, Math.round(hoursDelta * 60)); // Min 15 minutes

    // Visual feedback only
  }, [resizingEvent, events]);

  const handleResizeMouseUp = useCallback((e: MouseEvent) => {
    if (!resizingEvent || !gridRef.current) {
      setResizingEvent(null);
      return;
    }

    const event = events.find(ev => ev.id === resizingEvent);
    if (!event) return;

    const eventElement = document.getElementById(`event-${resizingEvent}`);
    if (!eventElement) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const eventRect = eventElement.getBoundingClientRect();
    const newHeight = e.clientY - eventRect.top;
    const hoursDelta = newHeight / (gridRect.height / 15);
    const newDuration = Math.max(15, Math.round(hoursDelta * 60));

    onEventResize(resizingEvent, newDuration);
    setResizingEvent(null);
  }, [resizingEvent, events, onEventResize]);

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

  const handleTimeSlotClick = (dayIndex: number, hour: number) => {
    const slotDate = setMinutes(setHours(weekDays[dayIndex], hour), 0);
    onTimeSlotClick(slotDate);
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      meeting: 'border-blue-500 hover:bg-blue-500/5',
      call: 'border-blue-500 hover:bg-blue-500/5',
      focus: 'border-purple-500 hover:bg-purple-500/5',
      break: 'border-green-500 hover:bg-green-500/5',
      learning: 'border-amber-500 hover:bg-amber-500/5',
      exercise: 'border-red-500 hover:bg-red-500/5',
      personal: 'border-green-500 hover:bg-green-500/5',
      travel: 'border-cyan-500 hover:bg-cyan-500/5',
      lunch: 'border-emerald-500 hover:bg-emerald-500/5',
      review: 'border-orange-500 hover:bg-orange-500/5',
    };
    return colors[type] || colors.meeting;
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="grid grid-cols-8 gap-0">
        {/* Time labels */}
        <div className="pr-2">
          {HOURS.map(hour => (
            <div
              key={hour}
              className="h-9 flex items-start justify-end text-xs text-gray-500 dark:text-gray-400 font-medium pr-1"
            >
              {format(setMinutes(setHours(new Date(), hour), 0), 'h:mm')}
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day, dayIndex) => {
          const dayEvents = eventsByDay().get(dayIndex) || [];
          const isCurrentDay = isToday(day);

          return (
            <div key={dayIndex} className="relative border-l border-gray-100 dark:border-gray-800">
              {/* Day header */}
              <div className={`sticky top-0 z-10 px-1 py-1 text-center border-b border-gray-100 dark:border-gray-800 ${
                isCurrentDay ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-gray-50 dark:bg-gray-800/50'
              }`}>
                <div className="text-xs text-gray-500 dark:text-gray-400">{DAYS[day.getDay()]}</div>
                <div className={`text-sm font-medium ${
                  isCurrentDay ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'
                }`}>
                  {format(day, 'd')}
                </div>
              </div>

              {/* Time slots */}
              <div
                ref={gridRef}
                className="relative"
                style={{ height: `${HOURS.length * 36}px` }}
              >
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="absolute w-full border-b border-gray-50 dark:border-gray-900 hover:bg-gray-50/30 dark:hover:bg-gray-800/20 cursor-pointer transition-colors"
                    style={{
                      top: `${((hour - 6) / 15) * 100}%`,
                      height: `${(1 / 15) * 100}%`,
                    }}
                    onClick={() => handleTimeSlotClick(dayIndex, hour)}
                  />
                ))}

                {/* Events */}
                {dayEvents.map((event, eventIndex) => {
                  const position = getEventPosition(event, dayIndex);
                  const isBeingDragged = draggedEvent === event.id;
                  const isBeingResized = resizingEvent === event.id;

                  return (
                    <div
                      key={`${event.id}-${dayIndex}-${eventIndex}`}
                      id={`event-${event.id}`}
                      className={`absolute cursor-move transition-all duration-200 border-l-2 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md hover:z-40 ${getEventColor(event.type.id)} ${
                        isBeingDragged ? 'opacity-50 shadow-lg scale-105 z-50' : ''
                      } ${isBeingResized ? 'ring-1 ring-blue-400 z-50' : ''} hover:bg-gray-50 dark:hover:bg-gray-800/80`}
                      style={{
                        top: `${position.top}%`,
                        height: `${position.height}%`,
                        left: `${position.left}%`,
                        width: `${position.width}%`,
                        minHeight: '20px',
                        margin: '1px',
                      }}
                      onMouseDown={(e) => handleMouseDown(e, event.id)}
                      onClick={() => !isBeingDragged && onEventClick(event)}
                    >
                      <div className="flex items-center justify-between px-2 py-1 h-full">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          <div className="text-xs font-medium truncate text-gray-900 dark:text-white">
                            {event.title}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1">
                          {format(event.startTime, 'h:mm')}
                        </div>
                      </div>

                      {/* Resize handle */}
                      <div
                        className="absolute bottom-0 right-0 w-2 h-2 bg-gray-400 cursor-se-resize opacity-0 hover:opacity-60"
                        onMouseDown={(e) => handleResizeMouseDown(e, event.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Current time indicator */}
      <div
        className="absolute left-16 right-0 h-0.5 bg-red-500 pointer-events-none z-30"
        style={{
          top: `${((new Date().getHours() + new Date().getMinutes() / 60 - 6) / 15) * 100}%`,
        }}
      >
        <div className="absolute -left-2 w-3 h-3 bg-red-500 rounded-full" />
      </div>
    </div>
  );
};