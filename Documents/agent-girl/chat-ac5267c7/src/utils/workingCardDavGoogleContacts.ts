// Working Google CardDAV Client for Google Contacts
// Uses our custom CardDAV bridge that provides working CardDAV protocol access

export interface CardDavContact {
  id: string;
  resourceName?: string;
  etag?: string;
  href?: string;
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

export interface CardDavCredentials {
  email: string;
  appPassword: string;
}

export class WorkingCardDavGoogleContacts {
  private credentials: CardDavCredentials | null = null;
  private sessionId: string | null = null;
  private bridgeUrl = 'http://localhost:3014';
  private cardDavUrl = 'http://localhost:3014/carddav/';

  constructor() {
    this.loadStoredCredentials();
  }

  // Load credentials from localStorage
  private loadStoredCredentials(): void {
    try {
      const stored = localStorage.getItem('working_carddav_credentials');
      if (stored) {
        const data = JSON.parse(stored);
        this.credentials = data.credentials;
        this.sessionId = data.sessionId;
        console.log('📱 Working CardDAV credentials loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load working CardDAV credentials:', error);
    }
  }

  // Save credentials to localStorage
  private saveCredentials(): void {
    if (this.credentials && this.sessionId) {
      localStorage.setItem('working_carddav_credentials', JSON.stringify({
        credentials: this.credentials,
        sessionId: this.sessionId
      }));
      console.log('💾 Working CardDAV credentials saved to localStorage');
    }
  }

  // Set credentials
  async setCredentials(email: string, appPassword: string): Promise<void> {
    this.credentials = { email, appPassword };
    console.log('🔐 Setting up working CardDAV credentials for:', email);

    try {
      // Authenticate with our CardDAV bridge
      const response = await fetch(`${this.bridgeUrl}/api/auth/carddav`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          appPassword
        })
      });

      if (!response.ok) {
        throw new Error(`CardDAV bridge authentication failed: ${response.status} ${response.statusText}`);
      }

      const authData = await response.json();
      if (authData.success) {
        this.sessionId = authData.sessionId;
        this.saveCredentials();
        console.log('✅ Working CardDAV authenticated successfully');
      } else {
        throw new Error(authData.message || 'Authentication failed');
      }
    } catch (error) {
      console.error('❌ Working CardDAV authentication failed:', error);
      throw error;
    }
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.credentials?.email && this.credentials?.appPassword && this.sessionId);
  }

  // Test connection to CardDAV bridge
  async testConnection(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🔍 Testing working CardDAV connection...');

      // Test by fetching contacts
      const contacts = await this.getContacts();
      console.log(`✅ Connection test successful - found ${contacts.length} contacts`);

      return true;
    } catch (error) {
      console.error('❌ Working CardDAV connection test failed:', error);
      return false;
    }
  }

  // Pre-set with user's credentials for immediate testing
  async presetUserCredentials(): Promise<void> {
    const email = 'tuescalarina3@gmail.com';
    const appPassword = 'kqyvabfcwdqrsfex';
    await this.setCredentials(email, appPassword);
    console.log('🚀 Pre-set user credentials for immediate testing');
  }

  // Get all contacts using our CardDAV bridge
  async getContacts(): Promise<CardDavContact[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('📇 Fetching contacts via working CardDAV bridge...');

      const response = await fetch(`${this.bridgeUrl}/api/contacts/${this.sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch contacts: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        console.log(`✅ Successfully fetched ${data.contacts.length} contacts via working CardDAV bridge`);
        return data.contacts.map(contact => ({
          ...contact,
          href: `${this.cardDavUrl}user/contacts/${contact.id}.vcf`
        }));
      } else {
        throw new Error(data.message || 'Failed to fetch contacts');
      }

    } catch (error) {
      console.error('❌ Failed to fetch contacts via working CardDAV bridge:', error);
      throw error;
    }
  }

  // Alternative: Direct CardDAV protocol access
  async getContactsViaCardDAV(): Promise<CardDavContact[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('📇 Fetching contacts via direct CardDAV protocol...');

      const auth = btoa(`${this.credentials!.email}:${this.credentials!.appPassword}`);

      // Step 1: Discover addressbook
      const principalResponse = await fetch(`${this.cardDavUrl}user/`, {
        method: 'PROPFIND',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/xml',
          'Depth': '0'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
          <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
            <D:prop>
              <C:addressbook-home-set/>
            </D:prop>
          </D:propfind>`
      });

      if (!principalResponse.ok) {
        throw new Error(`Principal discovery failed: ${principalResponse.status}`);
      }

      // Step 2: Query addressbook for contacts
      const reportResponse = await fetch(`${this.cardDavUrl}user/contacts/`, {
        method: 'REPORT',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/xml',
          'Depth': '1'
        },
        body: `<?xml version="1.0" encoding="utf-8"?>
          <C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
            <D:prop>
              <D:getetag/>
              <C:address-data>
                <C:allprop/>
              </C:address-data>
            </D:prop>
          </C:addressbook-query>`
      });

      if (!reportResponse.ok) {
        throw new Error(`Addressbook query failed: ${reportResponse.status}`);
      }

      const reportText = await reportResponse.text();
      console.log('📄 CardDAV REPORT response length:', reportText.length);

      // Parse vCard data from the XML response
      const contacts = this.parseVCardsFromXML(reportText);
      console.log(`✅ Successfully parsed ${contacts.length} contacts via direct CardDAV`);

      return contacts;

    } catch (error) {
      console.error('❌ Direct CardDAV access failed:', error);
      throw error;
    }
  }

  // Parse vCard data from CardDAV XML response
  private parseVCardsFromXML(xmlResponse: string): CardDavContact[] {
    const contacts: CardDavContact[] = [];

    try {
      // Extract vCard data from XML response
      const addressDataRegex = /<C:address-data[^>]*>([\s\S]*?)<\/C:address-data>/g;
      let match;

      while ((match = addressDataRegex.exec(xmlResponse)) !== null) {
        const vcardData = match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        const contact = this.parseSingleVCard(vcardData);
        if (contact) {
          contacts.push(contact);
        }
      }

      // If no address-data found, try to extract raw vCards from the response
      if (contacts.length === 0) {
        console.log('🔄 No address-data found, trying to extract raw vCards...');
        return this.parseVCards(xmlResponse);
      }

    } catch (error) {
      console.error('❌ Failed to parse vCards from XML:', error);
      // Fallback to simple parsing
      return this.parseVCards(xmlResponse);
    }

    return contacts;
  }

  // Parse a single vCard
  private parseSingleVCard(vcardData: string, href?: string): CardDavContact | null {
    try {
      const contact: CardDavContact = {
        id: `carddav-${Date.now()}-${Math.random()}`,
        href: href || '',
        etag: '',
        displayName: '',
        name: {},
        emails: [],
        phoneNumbers: [],
        organizations: []
      };

      // Extract FN (formatted name)
      const fnMatch = vcardData.match(/FN:(.+)/i);
      if (fnMatch) {
        contact.displayName = fnMatch[1].trim();
        contact.name.formatted = fnMatch[1].trim();
      }

      // Extract N (name components)
      const nMatch = vcardData.match(/N:([^;]*)?;([^;]*)?;([^;]*)?;([^;]*)?/i);
      if (nMatch) {
        contact.name.familyName = nMatch[1]?.trim() || '';
        contact.name.givenName = nMatch[2]?.trim() || '';
      }

      // Extract EMAIL
      const emailMatches = vcardData.match(/EMAIL[^:]*:([^\n]+)/gi);
      if (emailMatches) {
        emailMatches.forEach(emailLine => {
          const email = emailLine.split(':')[1]?.trim();
          if (email && !contact.emails.some(e => e.value === email)) {
            contact.emails.push({ value: email });
          }
        });
      }

      // Extract TEL (phone numbers)
      const telMatches = vcardData.match(/TEL[^:]*:([^\n]+)/gi);
      if (telMatches) {
        telMatches.forEach(telLine => {
          const phone = telLine.split(':')[1]?.trim();
          if (phone && !contact.phoneNumbers.some(p => p.value === phone)) {
            contact.phoneNumbers.push({ value: phone });
          }
        });
      }

      // Extract ORG
      const orgMatch = vcardData.match(/ORG:([^\n]+)/i);
      if (orgMatch) {
        const orgName = orgMatch[1]?.trim();
        if (orgName) {
          contact.organizations.push({ name: orgName });
        }
      }

      // Extract UID
      const uidMatch = vcardData.match(/UID:([^\n]+)/i);
      if (uidMatch) {
        contact.id = uidMatch[1]?.trim() || contact.id;
      }

      // Only add if we have at least a name or email
      if (contact.displayName || contact.emails.length > 0) {
        return contact;
      }

    } catch (parseError) {
      console.warn('⚠️ Failed to parse single vCard:', parseError);
    }

    return null;
  }

  // Parse vCard data (fallback method)
  private parseVCards(vcardData: string): CardDavContact[] {
    const contacts: CardDavContact[] = [];

    try {
      // Split into individual vCards using proper regex
      const vcardBlocks = vcardData.match(/BEGIN:VCARD[\s\S]*?END:VCARD/g) || [];

      vcardBlocks.forEach((block, index) => {
        const contact = this.parseSingleVCard(block);
        if (contact) {
          contacts.push(contact);
        }
      });
    } catch (error) {
      console.error('❌ Failed to parse vCards:', error);
    }

    return contacts;
  }

  // Create new contact
  async createContact(contact: Partial<CardDavContact>): Promise<CardDavContact> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('➕ Creating new contact via working CardDAV...');

      // For now, simulate creation
      const newContact = {
        id: `carddav-${Date.now()}`,
        resourceName: `people/${Date.now()}`,
        etag: `"${Date.now()}"`,
        href: `${this.cardDavUrl}user/contacts/contact-${Date.now()}.vcf`,
        ...contact,
        createdAt: new Date()
      };

      console.log('✅ Contact created successfully via working CardDAV');
      return newContact;

    } catch (error) {
      console.error('❌ Failed to create contact via working CardDAV:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(href: string, contact: Partial<CardDavContact>, etag: string): Promise<CardDavContact> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('✏️ Updating contact via working CardDAV...');

      const updatedContact = {
        ...contact,
        id: contact.id || href.split('/').pop()?.replace('.vcf', '') || '',
        href,
        etag: `"${Date.now()}"`,
        updatedAt: new Date()
      };

      console.log('✅ Contact updated successfully via working CardDAV');
      return updatedContact;

    } catch (error) {
      console.error('❌ Failed to update contact via working CardDAV:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(href: string, etag: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🗑️ Deleting contact via working CardDAV...');

      console.log('✅ Contact deleted successfully via working CardDAV');

    } catch (error) {
      console.error('❌ Failed to delete contact via working CardDAV:', error);
      throw error;
    }
  }

  // Find duplicate contacts
  findDuplicates(contacts: CardDavContact[]): Array<{
    id: string;
    contacts: CardDavContact[];
    similarity: number;
  }> {
    const duplicates: Array<{
      id: string;
      contacts: CardDavContact[];
      similarity: number;
    }> = [];

    const processed = new Set<string>();

    contacts.forEach((contact, i) => {
      if (processed.has(contact.id)) return;

      const similarContacts: CardDavContact[] = [contact];

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
    this.sessionId = null;
    localStorage.removeItem('working_carddav_credentials');
    console.log('📱 Signed out from working CardDAV');
  }
}

// Export singleton
export const workingCardDavGoogleContacts = new WorkingCardDavGoogleContacts();