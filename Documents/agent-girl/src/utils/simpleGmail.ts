import { google } from 'googleapis';

// Simple Gmail API client that works with OAuth tokens
export class SimpleGmailAPI {
  private accessToken: string | null = null;
  private readonly OAUTH_CLIENT_ID = '534080929731-.apps.googleusercontent.com'; // Public client ID for Gmail

  constructor() {
    this.loadStoredToken();
  }

  private loadStoredToken() {
    this.accessToken = localStorage.getItem('gmail_access_token');
  }

  private saveToken(token: string) {
    this.accessToken = token;
    localStorage.setItem('gmail_access_token', token);
  }

  public isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  // Simple OAuth flow using public client ID
  public async authenticate(): Promise<boolean> {
    return new Promise((resolve) => {
      // Create OAuth popup
      const authUrl = this.getAuthUrl();
      const popup = window.open(authUrl, 'gmail-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

      if (!popup) {
        alert('Please allow popups for this site');
        resolve(false);
        return;
      }

      // Listen for messages from popup
      const messageListener = async (event: MessageEvent) => {
        if (event.data.type === 'gmail-auth-success') {
          window.removeEventListener('message', messageListener);
          popup.close();

          if (event.data.accessToken) {
            this.saveToken(event.data.accessToken);
            resolve(true);
          } else {
            resolve(false);
          }
        } else if (event.data.type === 'gmail-auth-error') {
          window.removeEventListener('message', messageListener);
          popup.close();
          resolve(false);
        }
      };

      window.addEventListener('message', messageListener);

      // Check if popup was closed
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          resolve(false);
        }
      }, 1000);
    });
  }

  private getAuthUrl(): string {
    const redirectUri = `${window.location.origin}/auth/gmail/callback`;
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send'
    ];

    const params = new URLSearchParams({
      client_id: this.OAUTH_CLIENT_ID,
      redirect_uri: redirectUri,
      scope: scopes.join(' '),
      response_type: 'token',
      include_granted_scopes: 'true',
      state: Math.random().toString(36).substring(7)
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  public async getRecentEmails(): Promise<any[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=10', {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch emails');
      }

      const data = await response.json();
      const messages = data.messages || [];

      // Fetch full details for each message
      const emails = await Promise.all(
        messages.map((msg: any) => this.getMessageDetails(msg.id))
      );

      return emails;
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  private async getMessageDetails(messageId: string): Promise<any> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`https://www.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=metadata`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch message details');
    }

    const data = await response.json();
    return this.parseEmail(data);
  }

  private parseEmail(message: any): any {
    const headers = message.payload.headers;
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    return {
      id: message.id,
      threadId: message.threadId,
      from: getHeader('From'),
      to: getHeader('To'),
      subject: getHeader('Subject') || '(No subject)',
      snippet: message.snippet,
      date: new Date(parseInt(message.internalDate)),
      isRead: !message.labelIds?.includes('UNREAD'),
      isStarred: message.labelIds?.includes('STARRED') || false
    };
  }

  public async sendEmail(to: string, subject: string, body: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error('Not authenticated');
    }

    const emailContent = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    const encodedEmail = btoa(emailContent).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }
  }

  public logout() {
    this.accessToken = null;
    localStorage.removeItem('gmail_access_token');
  }
}

export const simpleGmailAPI = new SimpleGmailAPI();