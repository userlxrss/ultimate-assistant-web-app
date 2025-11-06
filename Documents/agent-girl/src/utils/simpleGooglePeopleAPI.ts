// Simple Google People API Integration
// Uses the existing OAuth server to get access tokens for Google Contacts

export interface SimpleGoogleContact {
  id: string;
  resourceName: string;
  etag: string;
  displayName: string;
  name: {
    givenName?: string;
    familyName?: string;
    formatted?: string;
  };
  emails: Array<{
    type?: string;
    value: string;
  }>;
  phoneNumbers: Array<{
    type?: string;
    value: string;
  }>;
  organizations: Array<{
    name?: string;
    title?: string;
  }>;
  addresses?: Array<{
    type?: string;
    streetAddress?: string;
    locality?: string;
    region?: string;
    postalCode?: string;
    country?: string;
  }>;
  photos?: Array<{
    url?: string;
  }>;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SimpleCredentials {
  email: string;
  appPassword: string;
}

export class SimpleGooglePeopleAPI {
  private credentials: SimpleCredentials | null = null;
  private baseUrl = 'https://people.googleapis.com/v1';
  private accessToken: string | null = null;

  constructor() {
    this.loadStoredCredentials();
  }

  // Load credentials from localStorage
  private loadStoredCredentials(): void {
    try {
      const stored = localStorage.getItem('simple_google_credentials');
      if (stored) {
        this.credentials = JSON.parse(stored);
        console.log('📱 Simple Google credentials loaded');
      }

      // Also check for existing OAuth tokens
      const oauthTokens = localStorage.getItem('google_access_token');
      if (oauthTokens) {
        this.accessToken = oauthTokens;
        console.log('🔑 OAuth access token found');
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }

  // Save credentials to localStorage
  private saveCredentials(): void {
    if (this.credentials) {
      localStorage.setItem('simple_google_credentials', JSON.stringify(this.credentials));
      console.log('💾 Simple Google credentials saved');
    }
  }

  // Set credentials
  setCredentials(email: string, appPassword: string): void {
    this.credentials = { email, appPassword };
    this.saveCredentials();
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.accessToken || (this.credentials?.email && this.credentials?.appPassword));
  }

  // Get access token (from OAuth or via proxy)
  private async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    // Try to get token from OAuth server
    try {
      const response = await fetch('http://localhost:3006/api/auth/tokens/google', {
        credentials: 'include'
      });

      if (response.ok) {
        const tokens = await response.json();
        this.accessToken = tokens.accessToken;
        return this.accessToken;
      }
    } catch (error) {
      console.log('⚠️ No OAuth token available, falling back to app password');
    }

    // If no OAuth token, use app password via proxy
    if (this.credentials) {
      return this.getProxyToken();
    }

    throw new Error('No authentication method available');
  }

  // Get proxy token using app password
  private async getProxyToken(): Promise<string> {
    const response = await fetch('http://localhost:3006/api/auth/proxy-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.credentials)
    });

    if (!response.ok) {
      throw new Error('Failed to get proxy token');
    }

    const { accessToken } = await response.json();
    return accessToken;
  }

  // Make API request
  private async makeAPIRequest(url: string, options: RequestInit = {}): Promise<any> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please reconnect your Google account.');
      }
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Get all contacts
  async getContacts(options: {
    pageSize?: number;
    pageToken?: string;
    personFields?: string;
  } = {}): Promise<{ connections: SimpleGoogleContact[], nextPageToken?: string, totalItems?: number }> {
    const {
      pageSize = 50,
      pageToken,
      personFields = 'names,emailAddresses,phoneNumbers,organizations,photos,addresses,birthdays'
    } = options;

    try {
      console.log('📊 Fetching contacts from Google People API...');

      const params = new URLSearchParams({
        personFields,
        pageSize: pageSize.toString(),
        ...(pageToken && { pageToken })
      });

      const response = await this.makeAPIRequest(`${this.baseUrl}/people/me/connections?${params}`);

      const contacts = (response.connections || []).map((person: any): SimpleGoogleContact => ({
        id: person.resourceName?.split('/').pop() || person.resourceName,
        resourceName: person.resourceName,
        etag: person.etag,
        displayName: person.names?.[0]?.displayName || '',
        name: {
          givenName: person.names?.[0]?.givenName,
          familyName: person.names?.[0]?.familyName,
          formatted: person.names?.[0]?.displayName
        },
        emails: person.emailAddresses || [],
        phoneNumbers: person.phoneNumbers || [],
        organizations: person.organizations || [],
        addresses: person.addresses || [],
        photos: person.photos || [],
        notes: person.biographies?.[0]?.value
      }));

      console.log(`✅ Successfully fetched ${contacts.length} contacts`);
      return {
        connections: contacts,
        nextPageToken: response.nextPageToken,
        totalItems: response.totalItems
      };

    } catch (error) {
      console.error('❌ Failed to fetch contacts:', error);
      throw error;
    }
  }

  // Create new contact
  async createContact(contactData: Partial<SimpleGoogleContact>): Promise<SimpleGoogleContact> {
    try {
      console.log('➕ Creating contact...');

      const person = this.formatPersonForAPI(contactData);
      const response = await this.makeAPIRequest(`${this.baseUrl}/people:createContact`, {
        method: 'POST',
        body: JSON.stringify(person)
      });

      const newContact: SimpleGoogleContact = {
        id: response.resourceName?.split('/').pop() || response.resourceName,
        resourceName: response.resourceName,
        etag: response.etag,
        displayName: response.names?.[0]?.displayName || '',
        name: {
          givenName: response.names?.[0]?.givenName,
          familyName: response.names?.[0]?.familyName,
          formatted: response.names?.[0]?.displayName
        },
        emails: response.emailAddresses || [],
        phoneNumbers: response.phoneNumbers || [],
        organizations: response.organizations || [],
        addresses: response.addresses || [],
        photos: response.photos || []
      };

      console.log('✅ Contact created successfully');
      return newContact;

    } catch (error) {
      console.error('❌ Failed to create contact:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(resourceName: string, contactData: Partial<SimpleGoogleContact>, updatePersonFields: string): Promise<SimpleGoogleContact> {
    try {
      console.log('✏️ Updating contact...');

      const person = this.formatPersonForAPI(contactData);
      const params = new URLSearchParams({ updatePersonFields });

      const response = await this.makeAPIRequest(`${this.baseUrl}/${resourceName}:updateContact?${params}`, {
        method: 'PATCH',
        body: JSON.stringify(person)
      });

      const updatedContact: SimpleGoogleContact = {
        id: response.resourceName?.split('/').pop() || response.resourceName,
        resourceName: response.resourceName,
        etag: response.etag,
        displayName: response.names?.[0]?.displayName || '',
        name: {
          givenName: response.names?.[0]?.givenName,
          familyName: response.names?.[0]?.familyName,
          formatted: response.names?.[0]?.displayName
        },
        emails: response.emailAddresses || [],
        phoneNumbers: response.phoneNumbers || [],
        organizations: response.organizations || [],
        addresses: response.addresses || [],
        photos: response.photos || []
      };

      console.log('✅ Contact updated successfully');
      return updatedContact;

    } catch (error) {
      console.error('❌ Failed to update contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(resourceName: string): Promise<void> {
    try {
      console.log('🗑️ Deleting contact...');

      await this.makeAPIRequest(`${this.baseUrl}/${resourceName}:deleteContact`, {
        method: 'DELETE'
      });

      console.log('✅ Contact deleted successfully');

    } catch (error) {
      console.error('❌ Failed to delete contact:', error);
      throw error;
    }
  }

  // Format contact data for Google People API
  private formatPersonForAPI(contact: Partial<SimpleGoogleContact>): any {
    const person: any = {};

    if (contact.name) {
      person.names = [{
        givenName: contact.name.givenName,
        familyName: contact.name.familyName,
        displayName: contact.name.formatted || `${contact.name.givenName} ${contact.name.familyName}`.trim()
      }];
    }

    if (contact.emails && contact.emails.length > 0) {
      person.emailAddresses = contact.emails;
    }

    if (contact.phoneNumbers && contact.phoneNumbers.length > 0) {
      person.phoneNumbers = contact.phoneNumbers;
    }

    if (contact.organizations && contact.organizations.length > 0) {
      person.organizations = contact.organizations;
    }

    if (contact.addresses && contact.addresses.length > 0) {
      person.addresses = contact.addresses;
    }

    if (contact.notes) {
      person.biographies = [{ value: contact.notes }];
    }

    return person;
  }

  // Find duplicate contacts
  findDuplicates(contacts: SimpleGoogleContact[]): Array<{
    id: string;
    contacts: SimpleGoogleContact[];
    similarity: number;
  }> {
    const duplicates: Array<{
      id: string;
      contacts: SimpleGoogleContact[];
      similarity: number;
    }> = [];

    const processed = new Set<string>();

    contacts.forEach((contact, i) => {
      if (processed.has(contact.id)) return;

      const similarContacts: SimpleGoogleContact[] = [contact];

      // Find similar contacts
      contacts.slice(i + 1).forEach(otherContact => {
        if (processed.has(otherContact.id)) return;

        let similarity = 0;

        // Check name similarity
        if (contact.displayName && otherContact.displayName) {
          if (contact.displayName.toLowerCase() === otherContact.displayName.toLowerCase()) {
            similarity += 3;
          } else if (contact.displayName.toLowerCase().includes(otherContact.displayName.toLowerCase()) ||
                     otherContact.displayName.toLowerCase().includes(contact.displayName.toLowerCase())) {
            similarity += 2;
          }
        }

        // Check email similarity
        const contactEmails = contact.emails.map(e => e.value.toLowerCase());
        const otherEmails = otherContact.emails.map(e => e.value.toLowerCase());

        if (contactEmails.some(email => otherEmails.includes(email))) {
          similarity += 3;
        }

        // Consider duplicates if high similarity
        if (similarity >= 3) {
          similarContacts.push(otherContact);
          processed.add(otherContact.id);
        }
      });

      if (similarContacts.length > 1) {
        duplicates.push({
          id: `dup-${duplicates.length}`,
          contacts: similarContacts,
          similarity: 0.8
        });
      }

      processed.add(contact.id);
    });

    return duplicates;
  }

  // Sign out
  signOut(): void {
    this.credentials = null;
    this.accessToken = null;
    localStorage.removeItem('simple_google_credentials');
    localStorage.removeItem('google_access_token');
    console.log('📱 Signed out from Google');
  }
}

// Export singleton
export const simpleGooglePeopleAPI = new SimpleGooglePeopleAPI();