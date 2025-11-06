import React, { useState, useEffect, useCallback } from 'react';
import { CalendarEvent, ConflictResolution } from '../../types/calendar';
import { generateSampleEvents } from '../../data/calendarData';
import { useNotifications } from '../NotificationSystem';
import { authManager } from '../../utils/authManager';
import { CalendarMonth } from './CalendarMonth';
import { CalendarDay } from './CalendarDay';
import { CalendarAgenda } from './CalendarAgenda';
import { EventForm } from './EventForm';
import { EventDetails } from './EventDetails';
import { ConflictDetector } from './ConflictDetector';
import { mockGoogleCalendarAPI } from '../../utils/mockGoogleCalendarAPI';
import { googleCalendarAPI } from '../../utils/googleCalendarAPI';
import { icalGoogleCalendarAPI } from '../../utils/icalGoogleCalendarAPI';
import { format, addDays, startOfMonth, endOfMonth, isToday } from 'date-fns';

type CalendarView = 'month' | 'day' | 'agenda';

const CalendarApp: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [showEventForm, setShowEventForm] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>();
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<Date | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { showSuccess, showError, showInfo } = useNotifications();

  // Determine which API to use based on available credentials
  const getCalendarAPI = () => {
    // First, try to use iCal API with your configured URL
    const icalUrl = localStorage.getItem('google_calendar_ical_url');
    if (icalUrl) {
      icalGoogleCalendarAPI.setICalUrl(icalUrl);
      return icalGoogleCalendarAPI;
    }

    // Set your iCal URL if not already stored
    const yourICalUrl = 'https://calendar.google.com/calendar/ical/tuescalarina3%40gmail.com/private-c6f3fb37bc8b117cb68a077d05d24cb1/basic.ics';
    if (!localStorage.getItem('google_calendar_ical_url')) {
      localStorage.setItem('google_calendar_ical_url', yourICalUrl);
      icalGoogleCalendarAPI.setICalUrl(yourICalUrl);
      return icalGoogleCalendarAPI;
    }

    // Check if real credentials are available in localStorage
    const savedApiKey = localStorage.getItem('google_calendar_api_key');
    const savedClientId = localStorage.getItem('google_calendar_client_id');

    // Use real Google Calendar API if both API key and client ID are provided
    if (savedApiKey && savedClientId) {
      return googleCalendarAPI;
    }

    // Fall back to mock API for testing
    return mockGoogleCalendarAPI;
  };

  // Handle Google Calendar events sync
  const handleGoogleEventsSynced = useCallback((googleEvents: CalendarEvent[]) => {
    setEvents(prevEvents => {
      // Remove existing Google Calendar events and add new ones
      const nonGoogleEvents = prevEvents.filter(event => !event.id.startsWith('google-'));
      const googleEventsWithPrefix = googleEvents.map(event => ({
        ...event,
        id: `google-${event.id}`,
      }));

      // Store in localStorage for persistence
      localStorage.setItem('google_calendar_events', JSON.stringify(googleEventsWithPrefix));

      return [...nonGoogleEvents, ...googleEventsWithPrefix];
    });
    showSuccess('Calendar Synced', `Successfully synced ${googleEvents.length} events from Google Calendar`);
  }, [showSuccess]);

  // Sync with Google Calendar
  const syncWithGoogleCalendar = useCallback(async () => {
    console.log('📅 Starting Google Calendar sync, current auth status:', isGoogleConnected);

    // Allow sync even if not "connected" since we have multiple auth methods
    if (!getCalendarAPI().isAuthenticated()) {
      console.log('📅 Calendar API not authenticated, but attempting sync anyway...');
    }

    setIsSyncing(true);
    try {
      const timeMin = new Date();
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date();
      timeMax.setDate(timeMax.getDate() + 30);

      const currentAPI = getCalendarAPI();
      const googleEvents = await currentAPI.syncEvents(timeMin, timeMax);
      handleGoogleEventsSynced(googleEvents);
    } catch (error) {
      console.error('Failed to sync with Google Calendar:', error);
      showError('Sync Failed', 'Failed to sync with Google Calendar. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  }, [isGoogleConnected, handleGoogleEventsSynced, showError]);

  // Check Google Calendar connection on mount
  useEffect(() => {
    // Check AuthManager first
    const authStatus = authManager.getAuthStatus();
    console.log('📅 CalendarApp auth check:', authStatus);

    // Priority 1: Check AuthManager for Google session
    let isConnected = authStatus.google;

    // Priority 2: Check for iCal URL (alternative authentication)
    if (!isConnected) {
      const icalUrl = localStorage.getItem('google_calendar_ical_url');
      if (icalUrl) {
        isConnected = true;
        console.log('📅 Using iCal URL authentication');
      }
    }

    // Priority 3: Check individual tokens (fallback)
    if (!isConnected) {
      const googleToken = localStorage.getItem('google_access_token');
      if (googleToken) {
        isConnected = true;
        console.log('📅 Using individual token authentication');
      }
    }

    console.log('📅 Final Google Calendar connection status:', isConnected);
    setIsGoogleConnected(isConnected);

    // Listen for Google Calendar sync events from Settings
    const handleSyncEvent = (event: CustomEvent) => {
      const googleEvents = event.detail;
      handleGoogleEventsSynced(googleEvents);
    };

    window.addEventListener('googleCalendarEventsSynced', handleSyncEvent as EventListener);

    // Load any previously synced Google Calendar events
    const storedGoogleEvents = localStorage.getItem('google_calendar_events');
    if (storedGoogleEvents) {
      try {
        const googleEvents = JSON.parse(storedGoogleEvents);
        const googleEventsWithDates = googleEvents.map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
        }));
        console.log('Loading Google Calendar events from storage:', googleEventsWithDates.length);

        // Clear old empty events and force fresh sync
        if (googleEventsWithDates.length === 0) {
          console.log('Clearing empty stored events - will force fresh sync');
          localStorage.removeItem('google_calendar_events');
        } else {
          setEvents(googleEventsWithDates);
        }
      } catch (error) {
        console.error('Failed to load stored Google Calendar events:', error);
        localStorage.removeItem('google_calendar_events');
      }
    }

    return () => {
      window.removeEventListener('googleCalendarEventsSynced', handleSyncEvent as EventListener);
    };
  }, [handleGoogleEventsSynced]);

  // Auto-sync on mount if using iCal API
  useEffect(() => {
    const currentAPI = getCalendarAPI();
    if (currentAPI.isAuthenticated() && events.length === 0) {
      console.log('Auto-syncing Google Calendar on mount...');
      syncWithGoogleCalendar();
    }
  }, [events.length, syncWithGoogleCalendar]);

  // Load sample data on mount (only if no events exist and no Google Calendar events are stored)
  useEffect(() => {
    const storedGoogleEvents = localStorage.getItem('google_calendar_events');
    console.log('Sample data check - storedGoogleEvents:', !!storedGoogleEvents, 'events.length:', events.length);
    if (!storedGoogleEvents && events.length === 0) {
      console.log('Loading sample events...');
      const sampleEvents = generateSampleEvents();
      setEvents(sampleEvents);
    }
  }, [events.length]);

  // Navigation functions
  const navigatePrevious = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, -1));
        break;
      case 'agenda':
        setCurrentDate(prev => addDays(prev, -7));
        break;
    }
  };

  const navigateNext = () => {
    switch (view) {
      case 'month':
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
        break;
      case 'day':
        setCurrentDate(prev => addDays(prev, 1));
        break;
      case 'agenda':
        setCurrentDate(prev => addDays(prev, 7));
        break;
    }
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events based on search and filters
  const filteredEvents = events.filter(event => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        event.title.toLowerCase().includes(query) ||
        event.description?.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query) ||
        event.attendees.some(a => a.name?.toLowerCase().includes(query) || a.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;
    }

    // Event type filter
    if (selectedEventType !== 'all' && event.type.id !== selectedEventType) {
      return false;
    }

    // Date range filter based on view
    let startDate: Date;
    let endDate: Date;

    switch (view) {
      case 'month':
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
        break;
      case 'day':
        startDate = new Date(currentDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(currentDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'agenda':
        startDate = new Date(currentDate);
        startDate.setDate(startDate.getDate() - 7);
        endDate = new Date(currentDate);
        endDate.setDate(endDate.getDate() + 30);
        break;
      default:
        startDate = new Date(0);
        endDate = new Date(8640000000000000); // Max date
    }

    const eventInDateRange = event.startTime >= startDate && event.startTime <= endDate;
    if (!eventInDateRange) return false;

    return true;
  });

  // Event handlers
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedTimeSlot(date);
    setShowEventForm(true);
  };

  const handleEventCreate = (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: eventData.title || 'New Event',
      startTime: eventData.startTime || new Date(),
      endTime: eventData.endTime || new Date(),
      type: eventData.type || { id: 'meeting', name: 'Meeting', color: '#69b491', icon: '🤝', defaultDuration: 60 },
      attendees: eventData.attendees || [],
      description: eventData.description,
      location: eventData.location,
      color: eventData.color,
      isRecurring: eventData.isRecurring,
      recurrenceRule: eventData.recurrenceRule,
      reminders: eventData.reminders || [],
      bufferTime: eventData.bufferTime,
      timezone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      visibility: eventData.visibility || 'public',
      status: eventData.status || 'confirmed',
      creator: eventData.creator || { email: 'user@example.com', name: 'Current User', responseStatus: 'accepted' },
      organizer: eventData.organizer,
      notes: eventData.notes,
    };

    setEvents(prev => [...prev, newEvent]);
    setShowEventForm(false);
    setSelectedTimeSlot(undefined);
  };

  const handleEventUpdate = (updatedEvent: Partial<CalendarEvent>) => {
    if (!selectedEvent) return;

    setEvents(prev => prev.map(event =>
      event.id === selectedEvent.id
        ? { ...event, ...updatedEvent }
        : event
    ));

    setShowEventForm(false);
    setSelectedEvent(undefined);
  };

  const handleEventDelete = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
    setSelectedEvent(undefined);
  };

  const handleEventDuplicate = (event: CalendarEvent) => {
    const duplicatedEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}`,
      title: `${event.title} (Copy)`,
      startTime: new Date(event.startTime.getTime() + 60 * 60 * 1000), // 1 hour later
      endTime: new Date(event.endTime.getTime() + 60 * 60 * 1000), // 1 hour later
    };

    setEvents(prev => [...prev, duplicatedEvent]);
  };

  const handleEventDrop = (eventId: string, newStartTime: Date) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        const duration = event.endTime.getTime() - event.startTime.getTime();
        return {
          ...event,
          startTime: newStartTime,
          endTime: new Date(newStartTime.getTime() + duration),
        };
      }
      return event;
    }));
  };

  const handleEventResize = (eventId: string, newDuration: number) => {
    setEvents(prev => prev.map(event => {
      if (event.id === eventId) {
        return {
          ...event,
          endTime: new Date(event.startTime.getTime() + newDuration * 60 * 1000),
        };
      }
      return event;
    }));
  };

  const handleConflictResolution = (resolution: ConflictResolution) => {
    const { originalEvent, suggestedSlots, resolutionType } = resolution;

    if (resolutionType === 'reschedule' && suggestedSlots.length > 0) {
      const newSlot = suggestedSlots[0];
      setEvents(prev => prev.map(event => {
        if (event.id === originalEvent.id) {
          const duration = event.endTime.getTime() - event.startTime.getTime();
          return {
            ...event,
            startTime: newSlot.start,
            endTime: new Date(newSlot.start.getTime() + duration),
          };
        }
        return event;
      }));
    } else if (resolutionType === 'buffer') {
      // Add buffer time between conflicting events
      setEvents(prev => prev.map(event => {
        if (event.id === originalEvent.id) {
          return {
            ...event,
            bufferTime: (event.bufferTime || 0) + 15,
          };
        }
        return event;
      }));
    }
  };

  // Export functions
  const handleExport = (format: 'pdf' | 'ical' | 'csv') => {
    // In a real implementation, this would generate and download the file
    console.log(`Exporting calendar as ${format}`);
    showInfo('Calendar Export', `Export functionality would download calendar as ${format.toUpperCase()}`);
  };

  const getViewTitle = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy');
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy');
      case 'agenda':
        return 'Agenda';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="p-6">
        {/* Header */}
        <div className="glass-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
            <div className="flex items-center gap-3">
              {/* Google Calendar Sync Button */}
              <button
                onClick={syncWithGoogleCalendar}
                disabled={isSyncing}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isGoogleConnected
                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                } ${isSyncing ? 'opacity-75 cursor-wait' : ''}`}
                title={isGoogleConnected ? 'Sync with Google Calendar' : 'Connect Google Calendar in Settings'}
              >
                {isSyncing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                )}
                {isSyncing ? 'Syncing...' : isGoogleConnected ? 'Sync Google' : 'Connect Google'}
              </button>

              <button
                onClick={() => setShowEventForm(true)}
                className="px-4 py-2 bg-sage-500 text-white rounded-lg hover:bg-sage-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Event
              </button>
            </div>
          </div>

          {/* Navigation and View Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={navigatePrevious}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={navigateToday}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isToday(currentDate)
                    ? 'bg-sage-500 text-white'
                    : 'hover:bg-white/10 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400'
                }`}
              >
                Today
              </button>
              <button
                onClick={navigateNext}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white ml-4">
                {getViewTitle()}
              </h2>
            </div>

            {/* View Switcher */}
            <div className="flex items-center gap-2 bg-white/20 dark:bg-white/10 rounded-lg p-1">
              {(['month', 'day', 'agenda'] as CalendarView[]).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-4 py-2 rounded-md transition-colors capitalize ${
                    view === viewType
                      ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {viewType}
                </button>
              ))}
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4 mt-4">
            <div className="flex-1 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg glass-button text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
              />
            </div>

            <select
              value={selectedEventType}
              onChange={(e) => setSelectedEventType(e.target.value)}
              className="px-4 py-2 rounded-lg glass-button text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
            >
              <option value="all">All Types</option>
              <option value="meeting">Meetings</option>
              <option value="call">Calls</option>
              <option value="focus">Focus Time</option>
              <option value="learning">Learning</option>
              <option value="personal">Personal</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleExport('ical')}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                title="Export as iCal"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors"
                title="Export as PDF"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Conflict Detector - Temporarily disabled */}
        {/* <ConflictDetector
          events={filteredEvents}
          onResolveConflict={handleConflictResolution}
        /> */}

        {/* Calendar View */}
        <div className="glass-card rounded-2xl p-6">
          {view === 'month' && (
            <CalendarMonth
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={handleEventClick}
              onDayClick={handleTimeSlotClick}
            />
          )}
          {view === 'day' && (
            <CalendarDay
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={handleEventClick}
              onTimeSlotClick={handleTimeSlotClick}
              onEventDrop={handleEventDrop}
              onEventResize={handleEventResize}
            />
          )}
          {view === 'agenda' && (
            <CalendarAgenda
              events={filteredEvents}
              currentDate={currentDate}
              onEventClick={handleEventClick}
              onDayClick={handleTimeSlotClick}
            />
          )}
        </div>
      </div>

      {/* Event Form Modal */}
      {(showEventForm || selectedEvent) && (
        <EventForm
          event={selectedEvent}
          startTime={selectedTimeSlot}
          onSubmit={selectedEvent ? handleEventUpdate : handleEventCreate}
          onCancel={() => {
            setShowEventForm(false);
            setSelectedEvent(undefined);
            setSelectedTimeSlot(undefined);
          }}
        />
      )}

      {/* Event Details Modal */}
      {selectedEvent && !showEventForm && (
        <EventDetails
          event={selectedEvent}
          onClose={() => setSelectedEvent(undefined)}
          onEdit={(event) => {
            setSelectedEvent(event);
            setShowEventForm(true);
          }}
          onDelete={handleEventDelete}
          onDuplicate={handleEventDuplicate}
        />
      )}
    </div>
  );
};

export default CalendarApp;