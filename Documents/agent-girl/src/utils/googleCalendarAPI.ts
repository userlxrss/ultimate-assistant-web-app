import { CalendarEvent } from '../types/calendar';

// Google Calendar API configuration
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

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
  creator?: {
    email: string;
    displayName?: string;
  };
  organizer?: {
    email: string;
    displayName?: string;
  };
  recurrence?: string[];
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface GoogleCalendarResponse {
  items: GoogleCalendarEvent[];
  nextPageToken?: string;
}

class GoogleCalendarAPI {
  private tokenClient: any = null;
  private gapiInited = false;
  private gisInited = false;
  private accessToken: string | null = null;

  constructor() {
    // Don't auto-initialize - wait for user to connect
  }

  public async initializeGoogleAPI(clientId: string, apiKey: string): Promise<void> {
    // Update the configuration with user-provided credentials
    (this as any).GOOGLE_CLIENT_ID = clientId;
    (this as any).GOOGLE_API_KEY = apiKey;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Google API initialization timeout'));
      }, 15000); // 15 second timeout

      const checkReady = () => {
        if (this.gapiInited && this.gisInited) {
          clearTimeout(timeout);
          resolve();
        }
      };

      // Load Google API script
      if (typeof window !== 'undefined' && !window.gapi) {
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/api.js';
        script.onload = () => {
          this.gapiLoaded();
          checkReady();
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load Google API script'));
        };
        document.body.appendChild(script);
      } else if (window.gapi) {
        this.gapiLoaded();
        checkReady();
      }

      // Load Google Identity Services
      if (typeof window !== 'undefined' && !window.google) {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.onload = () => {
          this.gisLoaded();
          checkReady();
        };
        script.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('Failed to load Google Identity Services'));
        };
        document.body.appendChild(script);
      } else if (window.google) {
        this.gisLoaded();
        checkReady();
      }
    });
  }

  private gapiLoaded() {
    window.gapi.load('client', () => {
      this.initializeGapiClient();
    });
  }

  private gisLoaded() {
    const clientId = (this as any).GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error('Google Client ID not provided');
      return;
    }

    this.tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          this.accessToken = tokenResponse.access_token;
          localStorage.setItem('google_calendar_token', tokenResponse.access_token);
          this.onSignInCallback?.(true);
        }
      },
    });
    this.gisInited = true;
  }

  private async initializeGapiClient() {
    try {
      const apiKey = (this as any).GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('Google API Key not provided');
        return;
      }

      await window.gapi.client.init({
        apiKey: apiKey,
        discoveryDocs: [GOOGLE_DISCOVERY_DOC],
      });
      this.gapiInited = true;
      console.log('Google API client initialized successfully');
    } catch (error) {
      console.error('Error initializing Google API client:', error);
      throw error;
    }
  }

  private onSignInCallback?: (success: boolean) => void;

  public setSignInCallback(callback: (success: boolean) => void) {
    this.onSignInCallback = callback;
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken || !!localStorage.getItem('google_calendar_token');
  }

  public getStoredToken(): string | null {
    return this.accessToken || localStorage.getItem('google_calendar_token');
  }

  public async signIn(): Promise<void> {
    if (!this.gisInited || !this.tokenClient) {
      throw new Error('Google Identity Services not initialized');
    }

    const token = this.getStoredToken();
    if (token) {
      this.accessToken = token;
      this.onSignInCallback?.(true);
      return;
    }

    this.tokenClient.requestAccessToken();
  }

  public signOut(): void {
    this.accessToken = null;
    localStorage.removeItem('google_calendar_token');
    if (window.gapi) {
      window.gapi.client.setToken(null);
    }
  }

  public async getCalendarList(): Promise<any[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not initialized');
    }

    try {
      const token = this.getStoredToken();
      if (token) {
        window.gapi.client.setToken({ access_token: token });
      }

      const response = await window.gapi.client.calendar.calendarList.list({
        minAccessRole: 'writer',
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar list:', error);
      throw error;
    }
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

    if (!window.gapi || !window.gapi.client) {
      throw new Error('Google API client not initialized');
    }

    try {
      const token = this.getStoredToken();
      if (token) {
        window.gapi.client.setToken({ access_token: token });
      }

      const params: any = {
        calendarId,
        maxResults,
        singleEvents: true,
        orderBy: 'startTime',
      };

      if (timeMin) {
        params.timeMin = timeMin.toISOString();
      }

      if (timeMax) {
        params.timeMax = timeMax.toISOString();
      }

      const response = await window.gapi.client.calendar.events.list(params);
      return response.result.items || [];
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      throw error;
    }
  }

  public async createEvent(calendarId: string, eventData: Partial<CalendarEvent>): Promise<GoogleCalendarEvent> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = this.getStoredToken();
      if (token && window.gapi) {
        window.gapi.client.setToken({ access_token: token });
      }

      const googleEventData = this.convertToGoogleEvent(eventData);

      const response = await window.gapi.client.calendar.events.insert({
        calendarId,
        resource: googleEventData,
      });

      return response.result;
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  public async updateEvent(
    calendarId: string,
    eventId: string,
    eventData: Partial<CalendarEvent>
  ): Promise<GoogleCalendarEvent> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = this.getStoredToken();
      if (token && window.gapi) {
        window.gapi.client.setToken({ access_token: token });
      }

      const googleEventData = this.convertToGoogleEvent(eventData);

      const response = await window.gapi.client.calendar.events.update({
        calendarId,
        eventId,
        resource: googleEventData,
      });

      return response.result;
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  public async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Not authenticated');
    }

    try {
      const token = this.getStoredToken();
      if (token && window.gapi) {
        window.gapi.client.setToken({ access_token: token });
      }

      await window.gapi.client.calendar.events.delete({
        calendarId,
        eventId,
      });
    } catch (error) {
      console.error('Error deleting calendar event:', error);
      throw error;
    }
  }

  private convertToGoogleEvent(eventData: Partial<CalendarEvent>): any {
    const googleEvent: any = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.location,
    };

    if (eventData.startTime) {
      googleEvent.start = {
        dateTime: eventData.startTime.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    if (eventData.endTime) {
      googleEvent.end = {
        dateTime: eventData.endTime.toISOString(),
        timeZone: eventData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    if (eventData.attendees && eventData.attendees.length > 0) {
      googleEvent.attendees = eventData.attendees.map(attendee => ({
        email: attendee.email,
        displayName: attendee.name,
      }));
    }

    if (eventData.color) {
      googleEvent.colorId = this.getColorIdFromHex(eventData.color);
    }

    if (eventData.reminders && eventData.reminders.length > 0) {
      googleEvent.reminders = {
        useDefault: false,
        overrides: eventData.reminders.map(reminder => ({
          method: reminder.type === 'popup' ? 'popup' : 'email',
          minutes: reminder.minutesBefore,
        })),
      };
    }

    if (eventData.isRecurring && eventData.recurrenceRule) {
      googleEvent.recurrence = [this.convertRecurrenceRule(eventData.recurrenceRule)];
    }

    return googleEvent;
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
      : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour

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
      creator: googleEvent.creator ? {
        email: googleEvent.creator.email,
        name: googleEvent.creator.displayName || googleEvent.creator.email,
        responseStatus: 'accepted',
      } : undefined,
      organizer: googleEvent.organizer ? {
        email: googleEvent.organizer.email,
        name: googleEvent.organizer.displayName || googleEvent.organizer.email,
      } : undefined,
      type: { id: 'meeting', name: 'Meeting', color: '#69b491', icon: '🤝', defaultDuration: 60 },
      isRecurring: !!googleEvent.recurrence && googleEvent.recurrence.length > 0,
      recurrenceRule: googleEvent.recurrence?.[0],
      reminders: googleEvent.reminders?.overrides?.map(reminder => ({
        type: reminder.method === 'popup' ? 'popup' : 'email',
        minutesBefore: reminder.minutes,
      })) || [],
      timezone: googleEvent.start?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      visibility: 'public',
      bufferTime: 0,
      notes: '',
    };
  }

  private getColorIdFromHex(hexColor?: string): string {
    // Google Calendar color mapping (basic implementation)
    const colorMap: { [key: string]: string } = {
      '#4285F4': '1', // Blue
      '#0B8043': '2', // Green
      '#F6BF26': '3', // Yellow
      '#AB47BC': '4', // Purple
      '#F4511E': '5', // Orange
      '#039BE5': '6', // Light Blue
      '#8E24AA': '7', // Dark Purple
      '#D81B60': '8', // Pink
      '#FB8C00': '9', // Amber
      '#0F9D58': '10', // Emerald
      '#E67C73': '11', // Red
    };

    return colorMap[hexColor || ''] || '1';
  }

  private getHexFromColorId(colorId?: string): string {
    // Reverse mapping for Google Calendar colors
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

  private convertRecurrenceRule(rule: string): string {
    // Basic recurrence rule conversion
    // This is a simplified implementation - in a real app, you'd want more robust parsing
    return rule;
  }

  public async syncEvents(timeMin?: Date, timeMax?: Date): Promise<CalendarEvent[]> {
    try {
      const googleEvents = await this.getEvents('primary', timeMin, timeMax);
      return googleEvents.map(event => this.convertFromGoogleEvent(event));
    } catch (error) {
      console.error('Error syncing events:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const googleCalendarAPI = new GoogleCalendarAPI();

// Type declarations for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}