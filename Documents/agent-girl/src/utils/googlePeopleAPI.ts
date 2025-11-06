// Google People API Client for Gmail Contacts
import { authManager } from './authManager';

export interface GoogleContact {
  resourceName: string;
  etag: string;
  names?: Array<{
    displayName?: string;
    familyName?: string;
    givenName?: string;
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

interface PeopleAPIResponse {
  connections?: GoogleContact[];
  nextPageToken?: string;
  totalItems?: number;
  totalPeople?: number;
  syncToken?: string;
}

export class GooglePeopleAPI {
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
        // Fallback to individual token storage
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
    localStorage.setItem('google_access_token', token);
  }

  // Sign out
  signOut(): void {
    this.accessToken = null;
    this.isConnected = false;
    localStorage.removeItem('google_access_token');
  }

  // Make API request
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
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`);
    }

    return response.json();
  }

  // Get list of contacts
  async getContacts(options: {
    pageSize?: number;
    pageToken?: string;
    sortOrder?: string;
    personFields?: string;
  } = {}): Promise<PeopleAPIResponse> {
    const {
      pageSize = 50,
      pageToken,
      sortOrder = 'FIRST_NAME_ASCENDING',
      personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses,birthdays,urls'
    } = options;

    const params = new URLSearchParams({
      resourceName: 'people/me',
      personFields,
      pageSize: pageSize.toString(),
      sortOrder,
      ...(pageToken && { pageToken })
    });

    try {
      // For now, return mock data since we don't have full OAuth setup
      const mockContacts: GoogleContact[] = [
        {
          resourceName: 'people/c1',
          etag: 'etag1',
          names: [{
            displayName: 'Alice Johnson',
            givenName: 'Alice',
            familyName: 'Johnson',
            metadata: { primary: true }
          }],
          emailAddresses: [{
            value: 'alice.johnson@example.com',
            type: 'work',
            metadata: { primary: true, verified: true }
          }],
          phoneNumbers: [{
            value: '+15551234567',
            type: 'mobile',
            metadata: { primary: true }
          }],
          organizations: [{
            name: 'Tech Solutions Inc.',
            title: 'Software Engineer',
            current: true,
            metadata: { primary: true }
          }],
          photos: [{
            url: 'https://ui-avatars.com/api/?name=Alice+Johnson&background=random',
            metadata: { primary: true }
          }]
        },
        {
          resourceName: 'people/c2',
          etag: 'etag2',
          names: [{
            displayName: 'Bob Smith',
            givenName: 'Bob',
            familyName: 'Smith',
            metadata: { primary: true }
          }],
          emailAddresses: [{
            value: 'bob.smith@example.com',
            type: 'home',
            metadata: { primary: true, verified: true }
          }],
          phoneNumbers: [{
            value: '+15559876543',
            type: 'home',
            metadata: { primary: true }
          }],
          organizations: [{
            name: 'Design Agency',
            title: 'UX Designer',
            current: true,
            metadata: { primary: true }
          }],
          photos: [{
            url: 'https://ui-avatars.com/api/?name=Bob+Smith&background=random',
            metadata: { primary: true }
          }]
        },
        {
          resourceName: 'people/c3',
          etag: 'etag3',
          names: [{
            displayName: 'Carol Williams',
            givenName: 'Carol',
            familyName: 'Williams',
            metadata: { primary: true }
          }],
          emailAddresses: [{
            value: 'carol.williams@example.com',
            type: 'work',
            metadata: { primary: true, verified: true }
          }, {
            value: 'carol.personal@example.com',
            type: 'home',
            metadata: { verified: true }
          }],
          phoneNumbers: [{
            value: '+15551112233',
            type: 'work',
            metadata: { primary: true }
          }],
          organizations: [{
            name: 'Marketing Corp',
            title: 'Marketing Manager',
            current: true,
            metadata: { primary: true }
          }],
          photos: [{
            url: 'https://ui-avatars.com/api/?name=Carol+Williams&background=random',
            metadata: { primary: true }
          }]
        },
        {
          resourceName: 'people/c4',
          etag: 'etag4',
          names: [{
            displayName: 'David Brown',
            givenName: 'David',
            familyName: 'Brown',
            metadata: { primary: true }
          }],
          emailAddresses: [{
            value: 'david.brown@example.com',
            type: 'work',
            metadata: { primary: true, verified: true }
          }],
          phoneNumbers: [{
            value: '+15553334455',
            type: 'work',
            metadata: { primary: true }
          }],
          organizations: [{
            name: 'Financial Services',
            title: 'Financial Analyst',
            current: true,
            metadata: { primary: true }
          }],
          photos: [{
            url: 'https://ui-avatars.com/api/?name=David+Brown&background=random',
            metadata: { primary: true }
          }]
        }
      ];

      return {
        connections: mockContacts,
        totalItems: mockContacts.length,
        totalPeople: mockContacts.length
      };

      // Real API call would be:
      // const response = await this.makeRequest(`https://people.googleapis.com/v1/people/me/connections?${params}`);
      // return response;
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw error;
    }
  }

  // Get specific contact
  async getContact(resourceName: string): Promise<GoogleContact> {
    try {
      const personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses,birthdays,urls';
      const params = new URLSearchParams({
        personFields
      });

      // Mock implementation - find in cached data
      const allContacts = await this.getContacts({ pageSize: 1000 });
      const contact = allContacts.connections?.find(c => c.resourceName === resourceName);

      if (!contact) {
        throw new Error('Contact not found');
      }

      return contact;

      // Real API call would be:
      // const response = await this.makeRequest(`https://people.googleapis.com/v1/${resourceName}?${params}`);
      // return response;
    } catch (error) {
      console.error('Failed to get contact:', error);
      throw error;
    }
  }

  // Create new contact
  async createContact(contactData: Partial<GoogleContact>): Promise<GoogleContact> {
    try {
      // Mock implementation
      const newContact: GoogleContact = {
        resourceName: `people/c${Date.now()}`,
        etag: Date.now().toString(),
        ...contactData,
      };

      console.log('📇 Creating contact:', newContact);
      return newContact;

      // Real API call would be:
      // const response = await this.makeRequest('https://people.googleapis.com/v1/people:createContact', {
      //   method: 'POST',
      //   body: JSON.stringify(contactData)
      // });
      // return response;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(resourceName: string, contactData: Partial<GoogleContact>, updatePersonFields: string): Promise<GoogleContact> {
    try {
      // Mock implementation
      const updatedContact: GoogleContact = {
        resourceName,
        etag: Date.now().toString(),
        ...contactData,
      };

      console.log('📝 Updating contact:', resourceName, updatedContact);
      return updatedContact;

      // Real API call would be:
      // const params = new URLSearchParams({ updatePersonFields });
      // const response = await this.makeRequest(`https://people.googleapis.com/v1/${resourceName}:updateContact?${params}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(contactData)
      // });
      // return response;
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(resourceName: string): Promise<void> {
    try {
      console.log('🗑️ Deleting contact:', resourceName);

      // Mock implementation - just log
      return;

      // Real API call would be:
      // await this.makeRequest(`https://people.googleapis.com/v1/${resourceName}:deleteContact`, {
      //   method: 'DELETE'
      // });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  // Search contacts
  async searchContacts(query: string, options: { pageSize?: number } = {}): Promise<{ results: Array<{ person: GoogleContact }> }> {
    try {
      const { pageSize = 25 } = options;
      const readMask = 'names,emailAddresses,phoneNumbers,organizations,photos';
      const params = new URLSearchParams({
        query,
        readMask,
        pageSize: pageSize.toString()
      });

      // Mock implementation - filter existing contacts
      const allContacts = await this.getContacts({ pageSize: 1000 });
      const filtered = allContacts.connections?.filter(contact => {
        const displayName = contact.names?.[0]?.displayName?.toLowerCase() || '';
        const emails = contact.emailAddresses?.map(e => e.value.toLowerCase()) || [];
        const phones = contact.phoneNumbers?.map(p => p.value) || [];
        const orgs = contact.organizations?.map(o => o.name?.toLowerCase()).filter(Boolean) || [];

        const queryLower = query.toLowerCase();
        return displayName.includes(queryLower) ||
               emails.some(email => email.includes(queryLower)) ||
               phones.some(phone => phone.includes(query)) ||
               orgs.some(org => org?.includes(queryLower));
      }) || [];

      return {
        results: filtered.map(person => ({ person }))
      };

      // Real API call would be:
      // const response = await this.makeRequest(`https://people.googleapis.com/v1/people:searchContacts?${params}`);
      // return response;
    } catch (error) {
      console.error('Failed to search contacts:', error);
      throw error;
    }
  }

  // Batch get contacts
  async batchGetContacts(resourceNames: string[]): Promise<{ responses: Array<{ person: GoogleContact }> }> {
    try {
      const personFields = 'names,emailAddresses,phoneNumbers,organizations,photos';
      const body = { resourceNames, personFields };

      // Mock implementation
      const responses = await Promise.all(
        resourceNames.map(resourceName => this.getContact(resourceName).then(person => ({ person })))
      );

      return { responses };

      // Real API call would be:
      // const response = await this.makeRequest('https://people.googleapis.com/v1/people:getBatchGet', {
      //   method: 'POST',
      //   body: JSON.stringify(body)
      // });
      // return response;
    } catch (error) {
      console.error('Failed to batch get contacts:', error);
      throw error;
    }
  }

  // Get contact groups
  async getContactGroups(): Promise<{ contactGroups: Array<{ resourceName: string; name?: string; memberCount?: number }> }> {
    try {
      // Mock implementation
      return {
        contactGroups: [
          { resourceName: 'contactGroups/friends', name: 'Friends', memberCount: 12 },
          { resourceName: 'contactGroups/family', name: 'Family', memberCount: 8 },
          { resourceName: 'contactGroups/work', name: 'Work', memberCount: 25 },
          { resourceName: 'contactGroups/other', name: 'Other', memberCount: 15 }
        ]
      };

      // Real API call would be:
      // const response = await this.makeRequest('https://people.googleapis.com/v1/contactGroups');
      // return response;
    } catch (error) {
      console.error('Failed to get contact groups:', error);
      throw error;
    }
  }

  // Simple method to check OAuth setup status
  checkOAuthSetup(): {
    hasAccessToken: boolean;
    hasApiKey: boolean;
    hasClientId: boolean;
    setupComplete: boolean;
  } {
    // Check AuthManager first
    const authStatus = authManager.getAuthStatus();
    const hasAuthSession = authStatus.google;

    // Fallback checks
    const accessToken = localStorage.getItem('google_access_token');
    const apiKey = localStorage.getItem('google_calendar_api_key');
    const clientId = localStorage.getItem('google_calendar_client_id');

    return {
      hasAccessToken: hasAuthSession || !!accessToken,
      hasApiKey: !!apiKey,
      hasClientId: !!clientId,
      setupComplete: !!(hasAuthSession || accessToken || (apiKey && clientId))
    };
  }

  // Method to use API key (for server-side proxy)
  async getContactsWithApiKey(): Promise<PeopleAPIResponse> {
    const apiKey = localStorage.getItem('google_calendar_api_key');
    if (!apiKey) {
      throw new Error('No API key available');
    }

    try {
      // Use server proxy for API key approach
      const response = await fetch(`/api/contacts?key=${apiKey}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('Failed to get contacts with API key:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const googlePeopleAPI = new GooglePeopleAPI();