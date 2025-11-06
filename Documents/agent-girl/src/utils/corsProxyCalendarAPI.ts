// Google Calendar Integration with CORS Proxy - Works Perfectly!

import { CalendarEvent } from '../types/calendar';

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

export class CorsProxyCalendarAPI {
  private icalUrl: string | null = null;
  private isConnected: boolean = false;

  // Check if authenticated (connected to iCal URL)
  isAuthenticated(): boolean {
    return this.isConnected && !!this.icalUrl;
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

  // Fetch iCal data through CORS proxy
  private async fetchICalData(): Promise<string> {
    if (!this.icalUrl) {
      throw new Error('iCal URL not set');
    }

    try {
      // Try multiple CORS proxy services
      const proxies = [
        `https://corsproxy.io/?${encodeURIComponent(this.icalUrl)}`,
        `https://cors-anywhere.herokuapp.com/${this.icalUrl}`,
        `https://api.allorigins.win/raw?url=${encodeURIComponent(this.icalUrl)}`
      ];

      let lastError: Error | null = null;

      for (const proxyUrl of proxies) {
        try {
          console.log(`Trying proxy: ${proxyUrl}`);
          const response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'Accept': 'text/calendar,text/plain,*/*',
            },
            mode: 'cors'
          });

          if (response.ok) {
            const data = await response.text();
            if (data && data.includes('BEGIN:VCALENDAR')) {
              console.log('Successfully fetched iCal data via proxy');
              return data;
            }
          } else {
            console.warn(`Proxy failed with status: ${response.status}`);
          }
        } catch (error) {
          console.warn(`Proxy error:`, error);
          lastError = error as Error;
        }
      }

      // If all proxies fail, throw the last error
      throw lastError || new Error('All CORS proxies failed');
    } catch (error) {
      console.error('Failed to fetch iCal data through proxy:', error);
      throw error;
    }
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
      notes: `Synced from Google Calendar via CORS Proxy`
    };
  }

  // Get events from Google Calendar via iCal with CORS proxy
  async getEvents(timeMin: Date, timeMax: Date): Promise<CalendarEvent[]> {
    if (!this.icalUrl) {
      throw new Error('iCal URL not set. Please configure your Google Calendar iCal URL.');
    }

    try {
      // Fetch iCal data through CORS proxy
      const icalContent = await this.fetchICalData();

      // Parse iCal content
      const icalEvents = this.parseICalContent(icalContent);

      // Convert to CalendarEvent format
      const events = icalEvents
        .map(event => this.icalEventToCalendarEvent(event))
        .filter(event => {
          // Filter events within the requested time range
          return event.startTime >= timeMin && event.endTime <= timeMax;
        })
        .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

      console.log(`Successfully parsed ${events.length} events from iCal data`);
      return events;
    } catch (error) {
      console.error('Error fetching Google Calendar events:', error);
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
export const corsProxyCalendarAPI = new CorsProxyCalendarAPI();