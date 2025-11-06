import React, { useState, useEffect } from 'react';
import { CalendarEvent, EventType, Attendee, Reminder, RecurrenceRule } from '../../types/calendar';
import { eventTypes } from '../../data/calendarData';
import { format, addMinutes } from 'date-fns';

interface EventFormProps {
  event?: CalendarEvent;
  startTime?: Date;
  onSubmit: (event: Partial<CalendarEvent>) => void;
  onCancel: () => void;
  attendees?: Attendee[];
}

export const EventForm: React.FC<EventFormProps> = ({
  event,
  startTime,
  onSubmit,
  onCancel,
  attendees = [],
}) => {
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    startTime: event?.startTime || startTime || new Date(),
    endTime: event?.endTime || addMinutes(startTime || new Date(), 60),
    location: event?.location || '',
    type: event?.type.id || 'meeting',
    visibility: event?.visibility || 'public',
    status: event?.status || 'confirmed',
    bufferTime: event?.bufferTime || 15,
    notes: event?.notes || '',
  });

  const [selectedAttendees, setSelectedAttendees] = useState<Attendee[]>(event?.attendees || []);
  const [reminders, setReminders] = useState<Reminder[]>(event?.reminders || [
    { id: '1', type: 'popup', minutesBefore: 15, enabled: true },
  ]);
  const [isRecurring, setIsRecurring] = useState(!!event?.isRecurring);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>(
    event?.recurrenceRule || {
      frequency: 'WEEKLY',
      interval: 1,
      byWeekDay: [new Date().getDay()],
    }
  );

  const [attendeeInput, setAttendeeInput] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedType = eventTypes.find(t => t.id === formData.type) || eventTypes[0];

  useEffect(() => {
    if (!event && startTime) {
      setFormData(prev => ({
        ...prev,
        startTime,
        endTime: addMinutes(startTime, selectedType.defaultDuration),
      }));
    }
  }, [startTime, selectedType.defaultDuration, event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const eventData: Partial<CalendarEvent> = {
      ...formData,
      type: selectedType,
      color: selectedType.color,
      attendees: selectedAttendees,
      reminders,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule : undefined,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      creator: attendees[0] || { email: 'user@example.com', name: 'Current User', responseStatus: 'accepted' },
      organizer: attendees[0] || { email: 'user@example.com', name: 'Current User', responseStatus: 'accepted' },
    };

    if (event?.id) {
      eventData.id = event.id;
    }

    onSubmit(eventData);
  };

  const addAttendee = () => {
    if (attendeeInput.trim()) {
      const newAttendee: Attendee = {
        email: attendeeInput.trim(),
        name: attendeeInput.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        responseStatus: 'needsAction',
      };
      setSelectedAttendees([...selectedAttendees, newAttendee]);
      setAttendeeInput('');
    }
  };

  const removeAttendee = (email: string) => {
    setSelectedAttendees(selectedAttendees.filter(a => a.email !== email));
  };

  const addReminder = () => {
    const newReminder: Reminder = {
      id: Date.now().toString(),
      type: 'popup',
      minutesBefore: 15,
      enabled: true,
    };
    setReminders([...reminders, newReminder]);
  };

  const updateReminder = (id: string, updates: Partial<Reminder>) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const removeReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-card">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {event ? 'Edit Event' : 'New Event'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Event Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  placeholder="Add title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Event Type
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({ ...formData, type: newType });
                      const type = eventTypes.find(t => t.id === newType);
                      if (type) {
                        setFormData(prev => ({
                          ...prev,
                          endTime: addMinutes(prev.startTime, type.defaultDuration),
                        }));
                      }
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  >
                    {eventTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="Add location"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={format(formData.startTime, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => {
                      const newStart = new Date(e.target.value);
                      const duration = formData.endTime.getTime() - formData.startTime.getTime();
                      setFormData({
                        ...formData,
                        startTime: newStart,
                        endTime: addMinutes(newStart, Math.round(duration / 60000)),
                      });
                    }}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Time *
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={format(formData.endTime, "yyyy-MM-dd'T'HH:mm")}
                    onChange={(e) => setFormData({ ...formData, endTime: new Date(e.target.value) })}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Attendees */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attendees
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={attendeeInput}
                    onChange={(e) => setAttendeeInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    placeholder="Add attendee email"
                  />
                  <button
                    type="button"
                    onClick={addAttendee}
                    className="px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {selectedAttendees.map(attendee => (
                  <div key={attendee.email} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-sage-200 dark:bg-sage-700 flex items-center justify-center text-sm font-medium text-sage-700 dark:text-sage-300">
                        {attendee.name ? attendee.name.charAt(0).toUpperCase() : attendee.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {attendee.name || attendee.email}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {attendee.name && attendee.email}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttendee(attendee.email)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="checkbox"
                  id="recurring"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-gray-300 text-sage-500 focus:ring-sage-500"
                />
                <label htmlFor="recurring" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurring Event
                </label>
              </div>

              {isRecurring && (
                <div className="ml-6 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repeat
                      </label>
                      <select
                        value={recurrenceRule.frequency}
                        onChange={(e) => setRecurrenceRule({
                          ...recurrenceRule,
                          frequency: e.target.value as RecurrenceRule['frequency'],
                        })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      >
                        <option value="DAILY">Daily</option>
                        <option value="WEEKLY">Weekly</option>
                        <option value="MONTHLY">Monthly</option>
                        <option value="YEARLY">Yearly</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Every
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={recurrenceRule.interval}
                        onChange={(e) => setRecurrenceRule({
                          ...recurrenceRule,
                          interval: parseInt(e.target.value) || 1,
                        })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {recurrenceRule.frequency === 'WEEKLY' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Repeat on
                      </label>
                      <div className="flex gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <label key={day} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={recurrenceRule.byWeekDay?.includes(index) || false}
                              onChange={(e) => {
                                const days = recurrenceRule.byWeekDay || [];
                                if (e.target.checked) {
                                  setRecurrenceRule({
                                    ...recurrenceRule,
                                    byWeekDay: [...days, index],
                                  });
                                } else {
                                  setRecurrenceRule({
                                    ...recurrenceRule,
                                    byWeekDay: days.filter(d => d !== index),
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-sage-500 focus:ring-sage-500"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Reminders */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reminders
              </label>
              <div className="space-y-2">
                {reminders.map(reminder => (
                  <div key={reminder.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={reminder.enabled}
                      onChange={(e) => updateReminder(reminder.id, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-sage-500 focus:ring-sage-500"
                    />
                    <select
                      value={reminder.type}
                      onChange={(e) => updateReminder(reminder.id, { type: e.target.value as Reminder['type'] })}
                      className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    >
                      <option value="popup">Popup</option>
                      <option value="email">Email</option>
                      <option value="sms">SMS</option>
                    </select>
                    <input
                      type="number"
                      min="0"
                      value={reminder.minutesBefore}
                      onChange={(e) => updateReminder(reminder.id, { minutesBefore: parseInt(e.target.value) || 0 })}
                      className="w-20 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">minutes before</span>
                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addReminder}
                  className="text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 text-sm font-medium transition-colors"
                >
                  + Add Reminder
                </button>
              </div>
            </div>

            {/* Advanced Options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sage-600 dark:text-sage-400 hover:text-sage-700 dark:hover:text-sage-300 text-sm font-medium transition-colors"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Visibility
                      </label>
                      <select
                        value={formData.visibility}
                        onChange={(e) => setFormData({ ...formData, visibility: e.target.value as CalendarEvent['visibility'] })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      >
                        <option value="public">Public</option>
                        <option value="private">Private</option>
                        <option value="confidential">Confidential</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as CalendarEvent['status'] })}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      >
                        <option value="confirmed">Confirmed</option>
                        <option value="tentative">Tentative</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Buffer Time (minutes)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.bufferTime}
                      onChange={(e) => setFormData({ ...formData, bufferTime: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-sage-500 focus:border-transparent"
                      rows={3}
                      placeholder="Add private notes"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors"
              >
                {event ? 'Update Event' : 'Create Event'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};