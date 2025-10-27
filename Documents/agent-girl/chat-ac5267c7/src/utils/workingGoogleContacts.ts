// Working Google Contacts Implementation using Proxy Server
// This connects to our local proxy server which handles Google People API

export interface GoogleContact {
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
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoogleCredentials {
  email: string;
  appPassword: string;
}

export class WorkingGoogleContacts {
  private credentials: GoogleCredentials | null = null;
  private readonly PROXY_BASE_URL = 'http://localhost:3013';
  private sessionId: string | null = null;

  constructor() {
    this.loadStoredCredentials();
  }

  // Load credentials from localStorage
  private loadStoredCredentials(): void {
    try {
      const stored = localStorage.getItem('working_google_contacts_credentials');
      if (stored) {
        const data = JSON.parse(stored);
        this.credentials = data.credentials;
        this.sessionId = data.sessionId;
        console.log('📱 Working Google Contacts credentials loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load Google Contacts credentials:', error);
    }
  }

  // Save credentials to localStorage
  private saveCredentials(): void {
    if (this.credentials && this.sessionId) {
      localStorage.setItem('working_google_contacts_credentials', JSON.stringify({
        credentials: this.credentials,
        sessionId: this.sessionId
      }));
      console.log('💾 Working Google Contacts credentials saved to localStorage');
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.credentials?.email && this.credentials?.appPassword && this.sessionId);
  }

  // Authenticate with proxy server
  async authenticate(email: string, appPassword: string): Promise<boolean> {
    try {
      console.log('🔐 Authenticating with Google Contacts proxy...');

      const response = await fetch(`${this.PROXY_BASE_URL}/api/contacts/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          appPassword
        })
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        this.credentials = { email, appPassword };
        this.sessionId = data.sessionId;
        this.saveCredentials();
        console.log('✅ Authenticated with Google Contacts proxy server');
        return true;
      } else {
        throw new Error(data.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('Failed to authenticate with proxy:', error);
      throw error;
    }
  }

  // Get all contacts
  async getContacts(options: {
    limit?: number;
    includePhoneNumbers?: boolean;
  } = {}): Promise<{ connections: GoogleContact[], totalItems?: number }> {
    const { limit = 100 } = options;

    if (!this.isAuthenticated() || !this.sessionId) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('📊 Fetching Google Contacts via proxy...');

      const response = await fetch(
        `${this.PROXY_BASE_URL}/api/contacts/${this.sessionId}?limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log(`✅ Successfully fetched ${data.connections.length} contacts`);
        return {
          connections: data.connections,
          totalItems: data.totalItems
        };
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      throw error;
    }
  }

  // Create new contact
  async createContact(contactData: Partial<GoogleContact>): Promise<GoogleContact> {
    if (!this.isAuthenticated() || !this.sessionId) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('➕ Creating new contact via proxy...');

      const response = await fetch(`${this.PROXY_BASE_URL}/api/contacts/${this.sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        throw new Error(`Failed to create contact: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Contact created successfully');
        return data.contact;
      } else {
        throw new Error(data.message || 'Failed to create contact');
      }
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(resourceName: string, contactData: Partial<GoogleContact>, etag: string): Promise<GoogleContact> {
    if (!this.isAuthenticated() || !this.sessionId) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('✏️ Updating contact via proxy...');

      const contactId = resourceName.replace('people/', '');
      const response = await fetch(`${this.PROXY_BASE_URL}/api/contacts/${this.sessionId}/${contactId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update contact: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Contact updated successfully');
        return data.contact;
      } else {
        throw new Error(data.message || 'Failed to update contact');
      }
    } catch (error) {
      console.error('Failed to update contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(resourceName: string, etag: string): Promise<void> {
    if (!this.isAuthenticated() || !this.sessionId) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🗑️ Deleting contact via proxy...');

      const contactId = resourceName.replace('people/', '');
      const response = await fetch(`${this.PROXY_BASE_URL}/api/contacts/${this.sessionId}/${contactId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to delete contact: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log('✅ Contact deleted successfully');
      } else {
        throw new Error(data.message || 'Failed to delete contact');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  // Test connection to proxy server
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.PROXY_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }

  // Find duplicate contacts
  findDuplicates(contacts: GoogleContact[]): Array<{
    id: string;
    contacts: GoogleContact[];
    similarity: number;
  }> {
    const duplicates: Array<{
      id: string;
      contacts: GoogleContact[];
      similarity: number;
    }> = [];

    const processed = new Set<string>();

    contacts.forEach((contact, i) => {
      if (processed.has(contact.id)) return;

      const similarContacts: GoogleContact[] = [contact];

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

  // Search contacts
  searchContacts(query: string): GoogleContact[] {
    if (!query) {
      return [];
    }

    // For now, return empty since we'd need to fetch contacts first
    // In a real implementation, you'd maintain a local cache or search via the proxy
    return [];
  }

  // Sign out
  signOut(): void {
    this.credentials = null;
    this.sessionId = null;
    localStorage.removeItem('working_google_contacts_credentials');
    console.log('📱 Signed out from Google Contacts');
  }
}

// Export singleton
export const workingGoogleContacts = new WorkingGoogleContacts();