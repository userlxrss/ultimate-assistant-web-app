// Google CardDAV Client for Google Contacts
// Uses proper CardDAV protocol with app-specific password for authentication

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

export class CardDavGoogleContacts {
  private credentials: CardDavCredentials | null = null;
  // Use Google's official CardDAV discovery endpoints
  private discoveryUrl = 'https://www.googleapis.com/.well-known/carddav';
  private principalUrl = '';
  private addressBooksUrl = '';
  private contactsUrl = '';

  constructor() {
    this.loadStoredCredentials();
  }

  // Load credentials from localStorage
  private loadStoredCredentials(): void {
    try {
      const stored = localStorage.getItem('carddav_credentials');
      if (stored) {
        this.credentials = JSON.parse(stored);
        console.log('📱 CardDAV credentials loaded from localStorage');
      }
    } catch (error) {
      console.error('Failed to load CardDAV credentials:', error);
    }
  }

  // Save credentials to localStorage
  private saveCredentials(): void {
    if (this.credentials) {
      localStorage.setItem('carddav_credentials', JSON.stringify(this.credentials));
      console.log('💾 CardDAV credentials saved to localStorage');
    }
  }

  // Set credentials
  setCredentials(email: string, appPassword: string): void {
    this.credentials = { email, appPassword };
    this.saveCredentials();
    console.log('🔐 CardDAV credentials set for:', email);
  }

  // Check if authenticated
  isAuthenticated(): boolean {
    return !!(this.credentials?.email && this.credentials?.appPassword);
  }

  // Test connection to CardDAV server
  async testConnection(): Promise<boolean> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🔍 Testing CardDAV connection...');

      // Try to discover endpoints first
      await this.discoverEndpoints();

      // Then try to fetch a small number of contacts to verify
      const contacts = await this.getContacts();
      console.log(`✅ Connection test successful - found ${contacts.length} contacts`);

      return true;
    } catch (error) {
      console.error('❌ CardDAV connection test failed:', error);
      return false;
    }
  }

  // Pre-set with user's credentials for immediate testing
  presetUserCredentials(): void {
    const email = 'tuescalarina3@gmail.com';
    const appPassword = 'kqyvabfcwdqrsfex';
    this.setCredentials(email, appPassword);
    console.log('🚀 Pre-set user credentials for immediate testing');
  }

  // Get authentication header
  private getAuthHeader(): string {
    if (!this.credentials) {
      throw new Error('No CardDAV credentials available');
    }
    return 'Basic ' + btoa(`${this.credentials.email}:${this.credentials.appPassword}`);
  }

  // Make CardDAV request
  private async makeCardDavRequest(url: string, method: string = 'GET', headers: Record<string, string> = {}, body?: string): Promise<Response> {
    const authHeader = this.getAuthHeader();

    const defaultHeaders = {
      'Authorization': authHeader,
      'Content-Type': 'application/xml; charset=utf-8',
      'Accept': 'text/xml, application/xml',
      ...headers
    };

    const response = await fetch(url, {
      method,
      headers: defaultHeaders,
      body
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please check your email and app password.');
      }
      throw new Error(`CardDAV request failed: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Discover CardDAV endpoints using proper CardDAV protocol
  async discoverEndpoints(): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🔍 Discovering Google CardDAV endpoints...');

      // Step 1: Start with Google's CardDAV discovery URL
      const discoveryResponse = await this.makeCardDavRequest(
        this.discoveryUrl,
        'PROPFIND',
        { 'Depth': '0' },
        `<?xml version="1.0" encoding="utf-8" ?>
        <D:propfind xmlns:D="DAV:">
          <D:prop>
            <D:current-user-principal/>
          </D:prop>
        </D:propfind>`
      );

      const discoveryText = await discoveryResponse.text();
      console.log('📄 Discovery response:', discoveryText.substring(0, 200));

      // For Google CardDAV, the principal URL follows a known pattern
      // Google's CardDAV service uses Google's standard endpoints
      this.principalUrl = `https://www.google.com/carddav/v1/principal/${this.credentials!.email.replace('@', '%40')}`;
      this.addressBooksUrl = `https://www.google.com/carddav/v1/addressbooks/${this.credentials!.email.replace('@', '%40')}`;
      this.contactsUrl = `https://www.google.com/carddav/v1/addressbooks/${this.credentials!.email.replace('@', '%40')}/contacts`;

      console.log('👤 Principal URL:', this.principalUrl);
      console.log('📚 Address books URL:', this.addressBooksUrl);
      console.log('👥 Contacts URL:', this.contactsUrl);

      // Step 2: Verify the address books URL is accessible
      try {
        const verifyResponse = await this.makeCardDavRequest(
          this.addressBooksUrl,
          'PROPFIND',
          { 'Depth': '1' },
          `<?xml version="1.0" encoding="utf-8" ?>
          <D:propfind xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
            <D:prop>
              <D:resourcetype/>
              <D:displayname/>
              <C:supported-address-data/>
            </D:prop>
          </D:propfind>`
        );

        const verifyText = await verifyResponse.text();
        console.log('✅ Address books verified, response length:', verifyText.length);

        // Extract the actual contacts URL from the response
        const hrefMatch = verifyText.match(/<D:href>([^<]+)<\/D:href>/);
        if (hrefMatch && hrefMatch[1].includes('contacts')) {
          this.contactsUrl = hrefMatch[1];
          console.log('👥 Updated contacts URL from response:', this.contactsUrl);
        }

      } catch (verifyError) {
        console.warn('⚠️ Address book verification failed, using constructed URL:', verifyError);
        // Continue with constructed URL for Google
      }

    } catch (error) {
      console.error('❌ Failed to discover CardDAV endpoints:', error);
      throw error;
    }
  }

  // Get all contacts using proper CardDAV protocol
  async getContacts(): Promise<CardDavContact[]> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    if (!this.contactsUrl) {
      await this.discoverEndpoints();
    }

    try {
      console.log('📇 Fetching contacts via CardDAV...');

      // First, try to get all contacts with vCard data
      const reportResponse = await this.makeCardDavRequest(
        this.contactsUrl,
        'REPORT',
        {
          'Depth': '1',
          'Content-Type': 'application/xml; charset=utf-8'
        },
        `<?xml version="1.0" encoding="utf-8" ?>
        <C:addressbook-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:carddav">
          <D:prop>
            <D:getetag/>
            <C:address-data>
              <C:allprop/>
            </C:address-data>
          </D:prop>
        </C:addressbook-query>`
      );

      const reportText = await reportResponse.text();
      console.log('📄 Contact report response length:', reportText.length);

      if (reportText.length === 0) {
        console.warn('⚠️ Empty response from CardDAV server');
        return [];
      }

      // Parse vCard data from the XML response
      const contacts = this.parseVCardsFromXML(reportText);
      console.log(`✅ Successfully parsed ${contacts.length} contacts`);

      return contacts;

    } catch (error) {
      console.error('❌ Failed to fetch contacts:', error);

      // Try alternative method: PROPFIND to get contact list, then fetch individual vCards
      console.log('🔄 Trying alternative contact fetch method...');
      try {
        return await this.getContactsAlternative();
      } catch (altError) {
        console.error('❌ Alternative method also failed:', altError);
        throw error;
      }
    }
  }

  // Alternative method to get contacts when REPORT fails
  private async getContactsAlternative(): Promise<CardDavContact[]> {
    console.log('🔄 Using alternative contact fetch method...');

    // First, get the list of contact URLs
    const propfindResponse = await this.makeCardDavRequest(
      this.contactsUrl,
      'PROPFIND',
      { 'Depth': '1' },
      `<?xml version="1.0" encoding="utf-8" ?>
      <D:propfind xmlns:D="DAV:">
        <D:prop>
          <D:href/>
          <D:getetag/>
        </D:prop>
      </D:propfind>`
    );

    const propfindText = await propfindResponse.text();
    console.log('📄 PROPFIND response length:', propfindText.length);

    // Extract hrefs from the response
    const hrefRegex = /<D:href>([^<]+)<\/D:href>/g;
    const hrefs = [];
    let match;
    while ((match = hrefRegex.exec(propfindText)) !== null) {
      const href = match[1];
      if (href.endsWith('.vcf') || href.includes('contact')) {
        hrefs.push(href);
      }
    }

    console.log(`📋 Found ${hrefs.length} contact URLs`);

    const contacts: CardDavContact[] = [];

    // Fetch each individual vCard (limit to avoid overwhelming the server)
    const maxContacts = Math.min(hrefs.length, 50);
    for (let i = 0; i < maxContacts; i++) {
      try {
        const href = hrefs[i];
        const vcardResponse = await this.makeCardDavRequest(href, 'GET');
        const vcardText = await vcardResponse.text();

        const contact = this.parseSingleVCard(vcardText, href);
        if (contact) {
          contacts.push(contact);
        }
      } catch (error) {
        console.warn(`⚠️ Failed to fetch contact ${i}:`, error);
      }
    }

    console.log(`✅ Successfully fetched ${contacts.length} contacts via alternative method`);
    return contacts;
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

    if (!this.contactsUrl) {
      await this.discoverEndpoints();
    }

    try {
      console.log('➕ Creating new contact via CardDAV...');

      const vcard = this.generateVCard(contact);
      const contactHref = `${this.contactsUrl}/${contact.id || Date.now()}.vcf`;

      await this.makeCardDavRequest(
        contactHref,
        'PUT',
        { 'Content-Type': 'text/vcard' },
        vcard
      );

      console.log('✅ Contact created successfully');
      return contact as CardDavContact;

    } catch (error) {
      console.error('❌ Failed to create contact:', error);
      throw error;
    }
  }

  // Update existing contact
  async updateContact(href: string, contact: Partial<CardDavContact>, etag: string): Promise<CardDavContact> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('✏️ Updating contact via CardDAV...');

      const vcard = this.generateVCard(contact);

      await this.makeCardDavRequest(
        href,
        'PUT',
        {
          'Content-Type': 'text/vcard',
          'If-Match': etag
        },
        vcard
      );

      console.log('✅ Contact updated successfully');
      return contact as CardDavContact;

    } catch (error) {
      console.error('❌ Failed to update contact:', error);
      throw error;
    }
  }

  // Delete contact
  async deleteContact(href: string, etag: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new Error('Please authenticate first');
    }

    try {
      console.log('🗑️ Deleting contact via CardDAV...');

      await this.makeCardDavRequest(
        href,
        'DELETE',
        { 'If-Match': etag }
      );

      console.log('✅ Contact deleted successfully');

    } catch (error) {
      console.error('❌ Failed to delete contact:', error);
      throw error;
    }
  }

  // Generate vCard from contact data
  private generateVCard(contact: Partial<CardDavContact>): string {
    const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

    // Add UID
    if (contact.id) {
      lines.push(`UID:${contact.id}`);
    }

    // Add name
    if (contact.name?.formatted) {
      lines.push(`FN:${contact.name.formatted}`);
    }

    if (contact.name?.givenName || contact.name?.familyName) {
      lines.push(`N:${contact.name.familyName || ''};${contact.name.givenName || ''};;;`);
    }

    // Add emails
    contact.emails?.forEach(email => {
      lines.push(`EMAIL:${email.value}`);
    });

    // Add phone numbers
    contact.phoneNumbers?.forEach(phone => {
      lines.push(`TEL:${phone.value}`);
    });

    // Add organization
    contact.organizations?.forEach(org => {
      if (org.name) {
        lines.push(`ORG:${org.name}`);
      }
    });

    // Add notes
    if (contact.notes) {
      lines.push(`NOTE:${contact.notes}`);
    }

    lines.push('END:VCARD');

    return lines.join('\r\n') + '\r\n';
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
    localStorage.removeItem('carddav_credentials');
    this.principalUrl = '';
    this.addressBooksUrl = '';
    this.contactsUrl = '';
    console.log('📱 Signed out from CardDAV');
  }
}

// Export singleton
export const cardDavGoogleContacts = new CardDavGoogleContacts();