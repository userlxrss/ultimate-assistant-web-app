// Simple Google Calendar iCal Integration - No API Keys Required!

import { CalendarEvent } from '../types/calendar';
import { authManager } from './authManager';

interface ICSEvent {
  summary: string;
  description?: string;
  location?: string;
  dtstart: string;
  dtend: string;
  status?: string;
  created?: string;
  lastModified?: string;
  uid: string;
}

export class ICalGoogleCalendarAPI {
  private icalUrl: string | null = null;
  private isConnected: boolean = false;

  // Check if authenticated (connected to iCal URL)
  isAuthenticated(): boolean {
    // Check multiple authentication methods
    if (this.isConnected && !!this.icalUrl) {
      return true;
    }

    // Check for iCal URL in localStorage
    const storedICalUrl = localStorage.getItem('google_calendar_ical_url');
    if (storedICalUrl) {
      this.icalUrl = storedICalUrl;
      return true;
    }

    // Check for Google session in AuthManager
    try {
      const authStatus = authManager.getAuthStatus();
      if (authStatus.google) {
        return true;
      }
    } catch (error) {
      console.log('AuthManager not available:', error);
    }

    return false;
  }

  // Set iCal URL
  setICalUrl(url: string): void {
    this.icalUrl = url;
    this.isConnected = !!url;
  }

  // Get calendar list (mock for iCal - single calendar)
  async getCalendarList(): Promise<any[]> {
    if (!this.icalUrl) {
      throw new Error('iCal URL not set');
    }

    return [{
      id: 'primary',
      summary: 'Google Calendar',
      description: 'Your Google Calendar via iCal',
      accessRole: 'owner',
      primary: true
    }];
  }

  // Parse iCal date to JavaScript Date
  private parseICalDate(dateStr: string): Date {
    // Handle iCal date format: 20241022T140000Z
    const cleanDate = dateStr.replace(/[^0-9TZ]/g, '');

    if (cleanDate.includes('T')) {
      // DateTime format
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1; // JS months are 0-indexed
      const day = parseInt(cleanDate.substring(6, 8));
      const hours = parseInt(cleanDate.substring(9, 11));
      const minutes = parseInt(cleanDate.substring(11, 13));
      const seconds = parseInt(cleanDate.substring(13, 15)) || 0;

      const date = new Date(year, month, day, hours, minutes, seconds);
      return date;
    } else {
      // Date only format
      const year = parseInt(cleanDate.substring(0, 4));
      const month = parseInt(cleanDate.substring(4, 6)) - 1;
      const day = parseInt(cleanDate.substring(6, 8));

      return new Date(year, month, day);
    }
  }

  // Parse iCal content to events
  private parseICalContent(icalContent: string): ICSEvent[] {
    const events: ICSEvent[] = [];
    const eventBlocks = icalContent.split('BEGIN:VEVENT').slice(1); // Skip first empty block

    eventBlocks.forEach(block => {
      const event: Partial<ICSEvent> = {};

      // Parse each line
      const lines = block.split('\n');
      lines.forEach(line => {
        if (line.startsWith('SUMMARY:')) {
          event.summary = line.substring(8).replace(/\\n/g, '\n');
        } else if (line.startsWith('DESCRIPTION:')) {
          event.description = line.substring(12).replace(/\\n/g, '\n');
        } else if (line.startsWith('LOCATION:')) {
          event.location = line.substring(9).replace(/\\n/g, '\n');
        } else if (line.startsWith('DTSTART:')) {
          event.dtstart = line.substring(8);
        } else if (line.startsWith('DTEND:')) {
          event.dtend = line.substring(6);
        } else if (line.startsWith('STATUS:')) {
          event.status = line.substring(7);
        } else if (line.startsWith('CREATED:')) {
          event.created = line.substring(8);
        } else if (line.startsWith('LAST-MODIFIED:')) {
          event.lastModified = line.substring(13);
        } else if (line.startsWith('UID:')) {
          event.uid = line.substring(4);
        }
      });

      // Only add events that have required fields
      if (event.summary && event.dtstart && event.dtend && event.uid) {
        events.push(event as ICSEvent);
      }
    });

    return events;
  }

  // Convert iCal event to CalendarEvent
  private icalEventToCalendarEvent(icalEvent: ICSEvent): CalendarEvent {
    return {
      id: icalEvent.uid,
      title: icalEvent.summary,
      description: icalEvent.description,
      location: icalEvent.location,
      startTime: this.parseICalDate(icalEvent.dtstart),
      endTime: this.parseICalDate(icalEvent.dtend),
      type: {
        id: 'google-event',
        name: 'Google Calendar',
        color: '#4285F4',
        icon: '📅',
        defaultDuration: 60
      },
      attendees: [],
      color: '#4285F4',
      isRecurring: false,
      reminders: [],
      bufferTime: 0,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      visibility: 'public',
      status: icalEvent.status === 'CANCELLED' ? 'cancelled' : 'confirmed',
      creator: {
        email: 'you@gmail.com',
        name: 'You',
        responseStatus: 'accepted'
      },
      organizer: {
        email: 'you@gmail.com',
        name: 'You',
        responseStatus: 'accepted'
      },
      notes: `Synced from Google Calendar via iCal`
    };
  }

  // Get events from Google Calendar via iCal (using proxy to avoid CORS)
  async getEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    try {
      console.log('📅 Fetching Google Calendar events via proxy...');

      // Use the proxy endpoint to avoid CORS issues
      const response = await fetch('http://localhost:3012/api/calendar/events');

      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events via proxy: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched ${data.events?.length || 0} events from Google Calendar proxy`);

      if (!data.success || !data.events) {
        throw new Error('Invalid response from calendar proxy');
      }

      // Convert and filter events within the requested time range
      const events = data.events
        .map((event: any) => ({
          ...event,
          startTime: new Date(event.startTime),
          endTime: new Date(event.endTime),
        }))
        .filter((event: CalendarEvent) => {
          // Event should start before timeMax and end after timeMin to be in range
          return event.startTime <= timeMax && event.endTime >= timeMin;
        })
        .sort((a: CalendarEvent, b: CalendarEvent) => a.startTime.getTime() - b.startTime.getTime());

      console.log(`✅ Returning ${events.length} events within requested time range`);
      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events via proxy:', error);
      throw new Error(`Failed to fetch calendar events: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Sync events (alias for getEvents)
  async syncEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    return this.getEvents(timeMin, timeMax);
  }

  // Sign out (clear iCal URL)
  signOut(): void {
    this.icalUrl = null;
    this.isConnected = false;
  }

  // Generate instructions for user to get their iCal URL
  static getICalUrlInstructions(): string[] {
    return [
      "1. Open Google Calendar (https://calendar.google.com)",
      "2. Find your calendar in the left sidebar under 'My calendars'",
      "3. Click the three dots (⋮) next to your calendar name",
      "4. Select 'Settings and sharing'",
      "5. Scroll down to 'Integrate calendar'",
      "6. Copy the 'Public address in iCal format' URL",
      "7. Paste the URL below and click 'Connect'",
      "8. Your calendar events will sync automatically!"
    ];
  }

  // Validate iCal URL format
  static isValidICalUrl(url: string): boolean {
    return url.includes('calendar.google.com') &&
           (url.includes('.ics') || url.includes('/ical/'));
  }
}

// Export singleton instance
export const icalGoogleCalendarAPI = new ICalGoogleCalendarAPI();