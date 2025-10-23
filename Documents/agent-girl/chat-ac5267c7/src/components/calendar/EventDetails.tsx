import React, { useState } from 'react';
import { CalendarEvent, Attendee, Reminder } from '../../types/calendar';
import { format, formatDistanceToNow, isPast, isToday } from 'date-fns';

interface EventDetailsProps {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onDuplicate: (event: CalendarEvent) => void;
}

export const EventDetails: React.FC<EventDetailsProps> = ({
  event,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    onDelete(event.id);
    onClose();
  };

  const formatEventDuration = (event: CalendarEvent) => {
    const duration = Math.round((event.endTime.getTime() - event.startTime.getTime()) / (1000 * 60));
    if (duration < 60) {
      return `${duration} minutes`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    return minutes > 0 ? `${hours}h ${minutes}min` : `${hours} hours`;
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

  const getAttendeeStatusColor = (status: Attendee['responseStatus']) => {
    const colors: Record<string, string> = {
      accepted: 'text-green-600 dark:text-green-400',
      declined: 'text-red-600 dark:text-red-400',
      tentative: 'text-yellow-600 dark:text-yellow-400',
      needsAction: 'text-gray-600 dark:text-gray-400',
    };
    return colors[status] || colors.needsAction;
  };

  const getAttendeeStatusText = (status: Attendee['responseStatus']) => {
    const texts: Record<string, string> = {
      accepted: 'Accepted',
      declined: 'Declined',
      tentative: 'Tentative',
      needsAction: 'No response',
    };
    return texts[status] || texts.needsAction;
  };

  const isEventPast = isPast(event.endTime);
  const isEventToday = isToday(event.startTime);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{getEventIcon(event.type.id)}</span>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {event.title}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full"
                  style={{ backgroundColor: event.color }}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {event.type.name}
                </span>
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
                {isEventToday && !isEventPast && (
                  <span className="text-xs bg-sage-100 text-sage-700 px-2 py-1 rounded">
                    Today
                  </span>
                )}
                {isEventPast && (
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                    Past
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Time & Duration */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Time</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>
                  {format(event.startTime, 'EEEE, MMMM d, yyyy')}
                </span>
              </div>
              <div className="flex items-center gap-4 text-gray-700 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {format(event.startTime, 'h:mm a')} - {format(event.endTime, 'h:mm a')}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  ({formatEventDuration(event)})
                </span>
              </div>
              {event.bufferTime && event.bufferTime > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{event.bufferTime} minutes buffer time</span>
                </div>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Location</h3>
              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{event.location}</span>
              </div>
            </div>
          )}

          {/* Conference Data */}
          {event.conferenceData && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Video Call</h3>
              <div className="p-3 bg-sage-50 dark:bg-sage-900/20 rounded-lg">
                <div className="flex items-center gap-2 text-sage-700 dark:text-sage-300 mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">{event.conferenceData.conferenceSolution.name}</span>
                </div>
                <a
                  href={event.conferenceData.entryPoints[0]?.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sage-600 dark:text-sage-400 hover:underline"
                >
                  {event.conferenceData.entryPoints[0]?.uri}
                </a>
              </div>
            </div>
          )}

          {/* Attendees */}
          {event.attendees.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Attendees ({event.attendees.length})
              </h3>
              <div className="space-y-2">
                {event.attendees.map(attendee => (
                  <div key={attendee.email} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-sage-200 dark:bg-sage-700 flex items-center justify-center text-sm font-medium text-sage-700 dark:text-sage-300">
                        {attendee.name ? attendee.name.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {attendee.name || attendee.email}
                        </div>
                        {attendee.name && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {attendee.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${getAttendeeStatusColor(attendee.responseStatus)}`}>
                        {getAttendeeStatusText(attendee.responseStatus)}
                      </span>
                      {attendee.isOrganizer && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          Organizer
                        </span>
                      )}
                      {attendee.optional && (
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Description</h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.description}
              </div>
            </div>
          )}

          {/* Notes */}
          {event.notes && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Private Notes</h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {event.notes}
              </div>
            </div>
          )}

          {/* Reminders */}
          {event.reminders.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Reminders</h3>
              <div className="space-y-2">
                {event.reminders.filter(r => r.enabled).map(reminder => (
                  <div key={reminder.id} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span>
                      {reminder.type === 'popup' ? 'Popup' : reminder.type === 'email' ? 'Email' : 'SMS'} notification{' '}
                      {reminder.minutesBefore === 0 ? 'at event time' : `${reminder.minutesBefore} minutes before`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {event.isRecurring && event.recurrenceRule && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Recurrence</h3>
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>
                  Repeats {event.recurrenceRule.frequency.toLowerCase()}
                  {event.recurrenceRule.interval > 1 && ` every ${event.recurrenceRule.interval}`}
                  {event.recurrenceRule.until && ` until ${format(event.recurrenceRule.until, 'MMM d, yyyy')}`}
                  {event.recurrenceRule.count && ` for ${event.recurrenceRule.count} occurrences`}
                </span>
              </div>
            </div>
          )}

          {/* Event Metadata */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Visibility:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{event.visibility}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="ml-2 text-gray-900 dark:text-white capitalize">{event.status}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Timezone:</span>
                <span className="ml-2 text-gray-900 dark:text-white">{event.timezone}</span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {formatDistanceToNow(event.startTime, { addSuffix: true })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(event)}
                className="px-4 py-2 text-sm font-medium text-sage-600 dark:text-sage-400 hover:bg-sage-50 dark:hover:bg-sage-900/20 rounded-lg transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDuplicate(event)}
                className="px-4 py-2 text-sm font-medium text-dusty-blue-600 dark:text-dusty-blue-400 hover:bg-dusty-blue-50 dark:hover:bg-dusty-blue-900/20 rounded-lg transition-colors"
              >
                Duplicate
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50 p-4 rounded-2xl">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Delete Event
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete "{event.title}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};