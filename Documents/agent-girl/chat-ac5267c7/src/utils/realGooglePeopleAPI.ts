// Real Google People API Integration for Gmail Contacts
import { authManager } from './authManager';

export interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName?: string;
    givenName?: string;
    familyName?: string;
    displayNameLastFirst?: string;
    unstructuredName?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  emailAddresses?: Array<{
    value: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      verified?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  phoneNumbers?: Array<{
    value: string;
    type?: string;
    formattedType?: string;
    canonicalForm?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  organizations?: Array<{
    name?: string;
    title?: string;
    department?: string;
    symbol?: string;
    location?: string;
    type?: string;
    formattedType?: string;
    primary?: boolean;
    current?: boolean;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  photos?: Array<{
    url: string;
    default?: boolean;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  addresses?: Array<{
    formattedValue?: string;
    type?: string;
    formattedType?: string;
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    countryCode?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  birthdays?: Array<{
    date?: {
      year?: number;
      month?: number;
      day?: number;
    };
    text?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
  urls?: Array<{
    value: string;
    type?: string;
    formattedType?: string;
    metadata?: {
      primary?: boolean;
      source?: {
        type?: string;
        id?: string;
      };
    };
  }>;
}

export interface PeopleAPIResponse {
  connections?: GoogleContact[];
  nextPageToken?: string;
  totalItems?: number;
  totalPeople?: number;
  syncToken?: string;
}

export class RealGooglePeopleAPI {
  private accessToken: string | null = null;
  private isConnected: boolean = false;

  constructor() {
    this.loadStoredTokens();
  }

  // Load tokens from AuthManager
  private loadStoredTokens(): void {
    try {
      const googleSession = authManager.getGoogleSession();
      if (googleSession?.accessToken) {
        this.accessToken = googleSession.accessToken;
        this.isConnected = true;
        console.log('📅 Google tokens loaded from AuthManager');
      } else {
        // Fallback to localStorage
        this.accessToken = localStorage.getItem('google_access_token');
        this.isConnected = !!this.accessToken;
        if (this.accessToken) {
          console.log('📅 Google tokens loaded from localStorage (fallback)');
        }
      }
    } catch (error) {
      console.error('Failed to load Google tokens:', error);
      this.isConnected = false;
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return this.isConnected && !!this.accessToken;
  }

  // Set access token
  setAccessToken(token: string): void {
    this.accessToken = token;
    this.isConnected = !!token;

    // Save to AuthManager if not already saved
    const currentSession = authManager.getGoogleSession();
    if (!currentSession || !currentSession.accessToken) {
      // This would need to email address - for now, just save the token
      authManager.saveGoogleSession(
        localStorage.getItem('google_account_email') || 'user@gmail.com',
        token
      );
    }
  }

  // Make API request to Google People API
  private async makeRequest(url: string, options: RequestInit = {}): Promise<any> {
    if (!this.accessToken) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, clear and throw error
        this.accessToken = null;
        this.isConnected = false;
        throw new Error('Access token expired. Please reconnect your Google account.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get real contacts from Google People API
  async getContacts(options: {
    pageSize = 50,
    pageToken,
    sortOrder = 'FIRST_NAME_ASCENDING',
    personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses,birthdays,urls'
  } = {}): Promise<PeopleAPIResponse> {
    try {
      console.log('📅 Fetching real Google contacts...');

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      const params = new URLSearchParams({
        personFields: options.personFields,
        pageSize: options.pageSize.toString(),
        sortOrder: options.sortOrder || 'FIRST_NAME_ASCENDING',
        ...(pageToken && { pageToken: options.pageToken })
      });

      const response = await this.makeRequest(`https://people.googleapis.com/v1/people/me/connections?${params}`);

      console.log(`📊 Successfully fetched ${response.connections?.length || 0} real Google contacts`);

      return {
        connections: response.connections || [],
        nextPageToken: response.nextPageToken,
        totalItems: response.totalItems,
        totalPeople: response.totalPeople,
        syncToken: response.syncToken
      };

    } catch (error) {
      console.error('Failed to fetch Google contacts:', error);
      throw error;
    }
  }

  // Create new contact in Google People API
  async createContact(contactData: Partial<GoogleContact>): Promise<GoogleContact> {
    try {
      console.log('👤 Creating contact in Google People API...');

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      const response = await this.makeRequest('https://people.googleapis.com/v1/people:createContact', {
        method: 'POST',
        body: JSON.stringify(contactData)
      });

      console.log('✅ Successfully created contact in Google People API');
      return response;

    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  // Update existing contact in Google People API
  async updateContact(resourceName: string, contactData: Partial<GoogleContact>, updatePersonFields: string): Promise<GoogleContact> {
    try {
      console.log('📝 Updating contact in Google People API:', resourceName);

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      const params = new URLSearchParams({ updatePersonFields });

      const response = await this.makeRequest(`https://people.googleapis.com/v1/${resourceName}:updateContact?${params}`, {
        method: 'PUT',
        body: JSON.stringify(contactData)
      });

      console.log('✅ Successfully updated contact in Google People API');
      return response;

    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  // Delete contact from Google People API
  async deleteContact(resourceName: string): Promise<void> {
    try {
      console.log('🗑️ Deleting contact from Google People API:', resourceName);

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      await this.makeRequest(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
        method: 'DELETE'
      });

      console.log('✅ Successfully deleted contact from Google People API');

    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  // Search contacts in Google People API
  async searchContacts(query: string, options: { pageSize = 25 } = {}): Promise<{ results: Array<{ person: GoogleContact }> }> {
    try {
      console.log('🔍 Searching Google contacts for:', query);

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      const readMask = options.personFields || 'names,emailAddresses,phoneNumbers,organizations,photos';
      const params = new URLSearchParams({
        query,
        readMask,
        pageSize: options.pageSize.toString()
      });

      const response = await this.makeRequest(`https://people.googleapis.com/v1/people/searchContacts?${params}`);

      console.log(`📊 Found ${response.results?.length || 0} results for search query: ${query}`);

      return response;

    } catch (error) {
      console.error('Failed to search contacts:', error);
      throw error;
    }
  }

  // Check OAuth setup status
  checkOAuthSetup(): {
    hasAccessToken: boolean;
    hasApiKey: boolean;
    hasClientId: boolean;
    setupComplete: boolean;
  } {
    const authStatus = authManager.getAuthStatus();
    const hasStoredToken = !!localStorage.getItem('google_access_token');

    return {
      hasAccessToken: authStatus.google || hasStoredToken,
      hasApiKey: !!localStorage.getItem('google_calendar_api_key'),
      hasClientId: !!localStorage.getItem('google_calendar_client_id'),
      setupComplete: authStatus.google || hasStoredToken
    };
  }

  // Sign out
  signOut(): void {
    this.accessToken = null;
    this.isConnected = false;
    authManager.clearGoogleSession();
    localStorage.removeItem('google_access_token');
    console.log('📅 Signed out from Google People API');
  }
}

// Export singleton instance
export const realGooglePeopleAPI = new RealGooglePeopleAPI();