// Real Google Contacts Implementation using OAuth2
// This connects to our OAuth2 server which fetches REAL Google Contacts

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
  photos?: Array<{
    url?: string;
    default?: boolean;
  }>;
  addresses?: Array<{
    streetAddress?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    type?: string;
  }>;
  biographies?: Array<{
    value?: string;
    contentType?: string;
  }>;
  raw?: any; // Raw Google API data for debugging
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class RealGoogleContacts {
  private sessionId: string | null = null;
  private userInfo: GoogleUserInfo | null = null;
  private readonly OAUTH_BASE_URL = 'http://localhost:3013';

  constructor() {
    this.loadStoredSession();
  }

  // Load session from localStorage
  private loadStoredSession(): void {
    try {
      const stored = localStorage.getItem('real_google_contacts_session');
      if (stored) {
        const data = JSON.parse(stored);
        this.sessionId = data.sessionId;
        this.userInfo = data.userInfo;
        console.log('📱 Real Google Contacts session loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load Google Contacts session:', error);
    }
  }

  // Save session to localStorage
  private saveSession(): void {
    if (this.sessionId && this.userInfo) {
      localStorage.setItem('real_google_contacts_session', JSON.stringify({
        sessionId: this.sessionId,
        userInfo: this.userInfo
      }));
      console.log('💾 Real Google Contacts session saved to localStorage');
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.sessionId && this.userInfo);
  }

  // Get user info
  getUserInfo(): GoogleUserInfo | null {
    return this.userInfo;
  }

  // Start OAuth2 flow
  async startOAuthFlow(): Promise<void> {
    try {
      console.log('🔐 Starting Google OAuth2 flow...');

      const response = await fetch(`${this.OAUTH_BASE_URL}/api/auth/google`);
      if (!response.ok) {
        throw new Error(`Failed to start OAuth flow: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.authUrl) {
        // Store the current URL for redirect back
        sessionStorage.setItem('google_contacts_redirect_url', window.location.href);

        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      } else {
        throw new Error('Failed to get OAuth URL');
      }
    } catch (error) {
      console.error('Failed to start OAuth flow:', error);
      throw error;
    }
  }

  // Handle OAuth callback (called after redirect back)
  async handleOAuthCallback(): Promise<boolean> {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('google_contacts_session');
      const authSuccess = urlParams.get('auth_success') === 'true';

      if (authSuccess && sessionId) {
        // Validate session and get user info
        const response = await fetch(`${this.OAUTH_BASE_URL}/api/session/${sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            this.sessionId = sessionId;
            this.userInfo = data.user;
            this.saveSession();

            // Clean up URL
            const url = new URL(window.location.href);
            url.searchParams.delete('google_contacts_session');
            url.searchParams.delete('auth_success');
            window.history.replaceState({}, document.title, url.toString());

            console.log('✅ OAuth authentication successful!');
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Failed to handle OAuth callback:', error);
      return false;
    }
  }

  // Initialize on page load (check for OAuth callback)
  async initialize(): Promise<boolean> {
    // Check if we're returning from OAuth flow
    if (window.location.search.includes('auth_success=true')) {
      return await this.handleOAuthCallback();
    }

    // Check if we have a stored session
    if (this.sessionId) {
      // Validate the session is still valid
      try {
        const response = await fetch(`${this.OAUTH_BASE_URL}/api/session/${this.sessionId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            console.log('✅ Existing session is valid');
            return true;
          }
        }
      } catch (error) {
        console.log('Session validation failed, clearing session');
        this.signOut();
      }
    }

    return false;
  }

  // Get real Google Contacts
  async getContacts(options: {
    limit?: number;
    pageToken?: string;
  } = {}): Promise<{
    connections: GoogleContact[],
    totalItems?: number,
    nextPageToken?: string
  }> {
    const { limit = 100, pageToken } = options;

    if (!this.isAuthenticated() || !this.sessionId) {
      throw new Error('Please authenticate with Google first');
    }

    try {
      console.log('📊 Fetching REAL Google Contacts...');

      let url = `${this.OAUTH_BASE_URL}/api/contacts/${this.sessionId}?limit=${limit}`;
      if (pageToken) {
        url += `&pageToken=${pageToken}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();

        if (errorData.needsOAuth) {
          throw new Error('OAuth Required - Please authenticate with Google again');
        }

        throw new Error(errorData.message || `Failed to fetch contacts: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        console.log(`✅ Successfully fetched ${data.connections.length} REAL Google Contacts!`);
        console.log(`👤 User: ${data.user?.name} (${data.user?.email})`);

        return {
          connections: data.connections,
          totalItems: data.totalItems,
          nextPageToken: data.nextPageToken
        };
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }
    } catch (error) {
      console.error('Failed to fetch real contacts:', error);

      if (error.message.includes('OAuth Required')) {
        // Clear invalid session
        this.signOut();
      }

      throw error;
    }
  }

  // Search contacts (client-side search for now)
  searchContacts(contacts: GoogleContact[], query: string): GoogleContact[] {
    if (!query || !contacts.length) {
      return [];
    }

    const searchTerm = query.toLowerCase();

    return contacts.filter(contact => {
      // Search in name
      if (contact.displayName?.toLowerCase().includes(searchTerm)) {
        return true;
      }

      // Search in emails
      if (contact.emails?.some(email =>
        email.value?.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }

      // Search in phone numbers
      if (contact.phoneNumbers?.some(phone =>
        phone.value?.includes(searchTerm)
      )) {
        return true;
      }

      // Search in organizations
      if (contact.organizations?.some(org =>
        org.name?.toLowerCase().includes(searchTerm) ||
        org.title?.toLowerCase().includes(searchTerm)
      )) {
        return true;
      }

      return false;
    });
  }

  // Find duplicate contacts
  findDuplicates(contacts: GoogleContact[]): Array<{
    id: string;
    contacts: GoogleContact[];
    similarity: number;
    reason: string;
  }> {
    const duplicates: Array<{
      id: string;
      contacts: GoogleContact[];
      similarity: number;
      reason: string;
    }> = [];

    const processed = new Set<string>();

    contacts.forEach((contact, i) => {
      if (processed.has(contact.id)) return;

      const similarContacts: GoogleContact[] = [contact];
      let similarityReason = '';

      // Find similar contacts
      contacts.slice(i + 1).forEach(otherContact => {
        if (processed.has(otherContact.id)) return;

        let similarity = 0;
        let reasons = [];

        // Check name similarity
        if (contact.displayName && otherContact.displayName) {
          if (contact.displayName.toLowerCase() === otherContact.displayName.toLowerCase()) {
            similarity += 3;
            reasons.push('Exact name match');
          } else if (contact.displayName.toLowerCase().includes(otherContact.displayName.toLowerCase()) ||
                     otherContact.displayName.toLowerCase().includes(contact.displayName.toLowerCase())) {
            similarity += 2;
            reasons.push('Similar name');
          }
        }

        // Check email similarity
        const contactEmails = contact.emails?.map(e => e.value.toLowerCase()) || [];
        const otherEmails = otherContact.emails?.map(e => e.value.toLowerCase()) || [];

        const sharedEmails = contactEmails.filter(email => otherEmails.includes(email));
        if (sharedEmails.length > 0) {
          similarity += 3;
          reasons.push(`Shared email: ${sharedEmails[0]}`);
        }

        // Check phone similarity
        const contactPhones = contact.phoneNumbers?.map(p => p.value.replace(/\D/g, '')) || [];
        const otherPhones = otherContact.phoneNumbers?.map(p => p.value.replace(/\D/g, '')) || [];

        const sharedPhones = contactPhones.filter(phone => otherPhones.includes(phone));
        if (sharedPhones.length > 0) {
          similarity += 2;
          reasons.push(`Shared phone`);
        }

        // Consider duplicates if high similarity
        if (similarity >= 3) {
          similarContacts.push(otherContact);
          processed.add(otherContact.id);
          if (!similarityReason) {
            similarityReason = reasons[0];
          }
        }
      });

      if (similarContacts.length > 1) {
        duplicates.push({
          id: `dup-${duplicates.length}`,
          contacts: similarContacts,
          similarity: 0.8,
          reason: similarityReason || 'Similar contact information'
        });
      }

      processed.add(contact.id);
    });

    return duplicates;
  }

  // Group contacts by first letter
  groupContactsByFirstLetter(contacts: GoogleContact[]): Record<string, GoogleContact[]> {
    const groups: Record<string, GoogleContact[]> = {};

    contacts.forEach(contact => {
      if (contact.displayName) {
        const firstLetter = contact.displayName.charAt(0).toUpperCase();
        if (!groups[firstLetter]) {
          groups[firstLetter] = [];
        }
        groups[firstLetter].push(contact);
      }
    });

    // Sort groups and contacts within groups
    Object.keys(groups).sort().forEach(letter => {
      groups[letter].sort((a, b) => a.displayName.localeCompare(b.displayName));
    });

    return groups;
  }

  // Get contact statistics
  getContactStats(contacts: GoogleContact[]): {
    total: number;
    withEmail: number;
    withPhone: number;
    withOrganization: number;
    withPhoto: number;
    recentlyUpdated?: number;
  } {
    const stats = {
      total: contacts.length,
      withEmail: 0,
      withPhone: 0,
      withOrganization: 0,
      withPhoto: 0
    };

    contacts.forEach(contact => {
      if (contact.emails && contact.emails.length > 0) stats.withEmail++;
      if (contact.phoneNumbers && contact.phoneNumbers.length > 0) stats.withPhone++;
      if (contact.organizations && contact.organizations.length > 0) stats.withOrganization++;
      if (contact.photos && contact.photos.length > 0) stats.withPhoto++;
    });

    return stats;
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      if (this.sessionId) {
        // Notify server to invalidate session
        await fetch(`${this.OAUTH_BASE_URL}/api/session/${this.sessionId}`, {
          method: 'DELETE'
        });
      }
    } catch (error) {
      console.error('Error signing out from server:', error);
    } finally {
      this.sessionId = null;
      this.userInfo = null;
      localStorage.removeItem('real_google_contacts_session');
      console.log('📱 Signed out from Google Contacts');
    }
  }

  // Test connection to OAuth server
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.OAUTH_BASE_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export singleton
export const realGoogleContacts = new RealGoogleContacts();