// Simple Google Contacts Integration
// Uses Gmail IMAP to get email addresses from your inbox and convert to contacts

import { authManager } from './authManager';

interface SimpleContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  title?: string;
  createdAt: Date;
}

export class SimpleGoogleContacts {
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

  // Get contacts from Gmail
  async getContacts(): Promise<SimpleContact[]> {
    try {
      console.log('📧 Fetching contacts from Gmail IMAP...');

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      // For now, get contacts from Gmail IMAP
      const gmailSession = authManager.getGmailSession();
      if (!gmailSession) {
        throw new Error('No Gmail session found. Please authenticate Gmail first.');
      }

      // Use Gmail IMAP server to get emails
      const response = await fetch(`http://localhost:3012/api/gmail/emails/${gmailSession.sessionId}?limit=100`);

      if (!response.ok) {
        throw new Error(`Failed to fetch Gmail emails: ${response.status}`);
      }

      const emailsData = await response.json();

      // Convert emails to contacts
      const contacts: SimpleContact[] = emailsData.emails.map((email: any, index: number) => ({
        id: `gmail-${email.id}`,
        name: email.from_name || email.from || email.sender || 'Unknown',
        email: email.from || email.sender || email.sender || 'No email',
        phone: '', // Gmail doesn't easily expose phone numbers in IMAP
        organization: 'Gmail',
        title: 'Email from Gmail',
        createdAt: new Date(email.received_time || Date.now())
      }));

      console.log(`📊 Successfully converted ${emailsData.emails.length} Gmail emails to contacts`);

      return contacts;

    } catch (error) {
      console.error('Failed to get Gmail contacts:', error);
      throw error;
    }
  }

  // Create new contact in Gmail
  async createContact(contactData: { name: string; email: string; phone?: string }): Promise<SimpleContact> {
    try {
      console.log('👤 Creating Gmail contact:', contactData);

      if (!this.isAuthenticated()) {
        throw new Error('Not authenticated. Please connect your Google account first.');
      }

      // Send email through Gmail IMAP server
      const gmailSession = authManager.getGmailSession();
      if (!gmailSession) {
        throw new Error('No Gmail session found. Please authenticate Gmail first.');
      }

      const response = await fetch('http://localhost:3012/api/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: gmailSession.sessionId,
          to: contactData.email,
          subject: `New contact: ${contactData.name}`,
          body: `Hello ${contactData.name},

I've added you as a new contact.

Best regards,
Your Gmail Client

---
Contact Details:
Name: ${contactData.name}
Email: ${contactData.email}
${contactData.phone ? `Phone: ${contactData.phone}` : ''}
Organization: ${contactData.organization || 'Personal'}
${contactData.title ? `Title: ${contactData.title}` : ''}
---
This is an automated message sent from your Gmail client app.`
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send Gmail email: ${response.status}`);
      }

      console.log('✅ Successfully created Gmail contact');
      return {
        id: `gmail-new-${Date.now()}`,
        name: contactData.name,
        email: contactData.email,
        phone: contactData.phone,
        organization: contactData.organization,
        title: contactData.title,
        createdAt: new Date()
      };

    } catch (error) {
      console.error('Failed to create Gmail contact:', error);
      throw error;
    }
  }

  // Search contacts
  async searchContacts(query: string): Promise<SimpleContact[]> {
    try {
      console.log('🔍 Searching Gmail contacts for:', query);

      const allContacts = await this.getContacts();

      return allContacts.filter(contact =>
        contact.name.toLowerCase().includes(query.toLowerCase()) ||
        contact.email.toLowerCase().includes(query.toLowerCase()) ||
        (contact.organization || '').toLowerCase().includes(query.toLowerCase()) ||
        (contact.title || '').toLowerCase().includes(query.toLowerCase())
      );

    } catch (error) {
      console.error('Failed to search Gmail contacts:', error);
      throw error;
    }
  }
}

// Export singleton
export const simpleGoogleContacts = new SimpleGoogleContacts();