import { CalendarEvent } from '../types/calendar';

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  colorId?: string;
  status?: string;
}

class MockGoogleCalendarAPI {
  private connected = false;
  private storedEvents: CalendarEvent[] = [];

  constructor() {
    // Load any previously stored events
    const stored = localStorage.getItem('mock_google_calendar_events');
    if (stored) {
      try {
        this.storedEvents = JSON.parse(stored);
      } catch (error) {
        console.error('Failed to load stored mock events:', error);
      }
    }
  }

  public async initializeGoogleAPI(clientId: string, apiKey: string): Promise<void> {
    console.log('Mock Google API initialization with:', { clientId, apiKey: apiKey.substring(0, 10) + '...' });

    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Mock Google API initialized successfully');
    this.connected = true;
  }

  public isAuthenticated(): boolean {
    return this.connected || localStorage.getItem('google_calendar_token') !== null;
  }

  public getStoredToken(): string | null {
    return localStorage.getItem('google_calendar_token') || 'mock_token';
  }

  public async signIn(): Promise<void> {
    console.log('Mock Google Sign In');
    localStorage.setItem('google_calendar_token', 'mock_token_' + Date.now());
    this.connected = true;
  }

  public signOut(): void {
    console.log('Mock Google Sign Out');
    this.connected = false;
    localStorage.removeItem('google_calendar_token');
  }

  public setSignInCallback(callback: (success: boolean) => void) {
    console.log('Mock sign-in callback set');
    setTimeout(() => callback(true), 1000);
  }

  public async getCalendarList(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    // Mock calendar list
    return [
      {
        id: 'primary',
        summary: 'Primary Calendar',
        accessRole: 'owner',
        backgroundColor: '#4285f4',
        foregroundColor: '#ffffff'
      }
    ];
  }

  public async getEvents(
    calendarId: string = 'primary',
    timeMin?: Date,
    timeMax?: Date,
    maxResults: number = 250
  ): Promise<GoogleCalendarEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    console.log('Mock: Fetching events for calendar:', calendarId);

    // Generate mock events
    const mockEvents: GoogleCalendarEvent[] = [];
    const now = new Date();

    // Generate some sample events for the next 30 days
    for (let i = 0; i < 10; i++) {
      const eventDate = new Date(now);
      eventDate.setDate(eventDate.getDate() + i);

      const startTime = new Date(eventDate);
      startTime.setHours(9 + (i % 8), 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      mockEvents.push({
        id: `mock_event_${i}`,
        summary: [
          'Team Meeting',
          'Project Review',
          'Client Call',
          'Focus Time',
          'Lunch Break',
          'Planning Session',
          'Code Review',
          'Standup Meeting',
          'Workshop',
          '1-on-1'
        ][i],
        description: `Mock event ${i + 1} for testing`,
        location: [
          'Conference Room A',
          'Virtual',
          'Office 201',
          'Home Office',
          'Zoom Meeting'
        ][i % 5],
        start: {
          dateTime: startTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        colorId: `${(i % 11) + 1}`,
        status: 'confirmed'
      });
    }

    return mockEvents;
  }

  public async createEvent(calendarId: string, eventData: Partial<CalendarEvent>): Promise<GoogleCalendarEvent> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    console.log('Mock: Creating event:', eventData.title);

    const newEvent: GoogleCalendarEvent = {
      id: `mock_event_${Date.now()}`,
      summary: eventData.title || 'New Event',
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startTime?.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventData.endTime?.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };

    return newEvent;
  }

  public async updateEvent(
    calendarId: string,
    eventId: string,
    eventData: Partial<CalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    console.log('Mock: Updating event:', eventId);
    return {
      id: eventId,
      summary: eventData.title || 'Updated Event',
      start: {
        dateTime: eventData.startTime?.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      },
      end: {
        dateTime: eventData.endTime?.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    };
  }

  public async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    console.log('Mock: Deleting event:', eventId);
  }

  public async syncEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    console.log('Mock: Syncing events');

    try {
      const googleEvents = await this.getEvents('primary', timeMin, timeMax);

      const convertedEvents = googleEvents.map(event => this.convertFromGoogleEvent(event));

      // Store mock events
      this.storedEvents = convertedEvents;
      localStorage.setItem('mock_google_calendar_events', JSON.stringify(convertedEvents));

      return convertedEvents;
    } catch (error) {
      console.error('Mock sync failed:', error);
      throw error;
    }
  }

  private convertFromGoogleEvent(googleEvent: GoogleCalendarEvent): CalendarEvent {
    const startTime = googleEvent.start?.dateTime
      ? new Date(googleEvent.start.dateTime)
      : googleEvent.start?.date
      ? new Date(googleEvent.start.date)
      : new Date();

    const endTime = googleEvent.end?.dateTime
      ? new Date(googleEvent.end.dateTime)
      : googleEvent.end?.date
      ? new Date(googleEvent.end.date)
      : new Date(startTime.getTime() + 60 * 60 * 1000);

    return {
      id: googleEvent.id,
      title: googleEvent.summary || 'Untitled Event',
      startTime,
      endTime,
      description: googleEvent.description,
      location: googleEvent.location,
      attendees: googleEvent.attendees?.map(attendee => ({
        name: attendee.displayName || attendee.email,
        email: attendee.email,
        responseStatus: attendee.responseStatus as any,
      })) || [],
      color: this.getHexFromColorId(googleEvent.colorId),
      status: googleEvent.status === 'cancelled' ? 'cancelled' : 'confirmed',
      creator: {
        email: 'user@example.com',
        name: 'Current User',
        responseStatus: 'accepted',
      },
      organizer: {
        email: 'user@example.com',
        name: 'Current User',
      },
      type: { id: 'meeting', name: 'Meeting', color: '#69b491', icon: '🤝', defaultDuration: 60 },
      isRecurring: false,
      recurrenceRule: '',
      reminders: [],
      timezone: googleEvent.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      visibility: 'public',
      bufferTime: 0,
      notes: '',
    };
  }

  private getHexFromColorId(colorId?: string): string {
    // Google Calendar color mapping
    const colorMap: { [key: string]: string } = {
      '1': '#4285F4',
      '2': '#0B8043',
      '3': '#F6BF26',
      '4': '#AB47BC',
      '5': '#F4511E',
      '6': '#039BE5',
      '7': '#8E24AA',
      '8': '#D81B60',
      '9': '#FB8C00',
      '10': '#0F9D58',
      '11': '#E67C73',
    };

    return colorMap[colorId || ''] || '#4285F4';
  }
}

// Create singleton instance
export const mockGoogleCalendarAPI = new MockGoogleCalendarAPI();