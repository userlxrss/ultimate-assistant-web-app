import { Email, EmailThread, EmailFolder, EmailFilter, GmailAPIConfig, GmailSyncResult } from '../types/email';

class GmailAPI {
  private config: GmailAPIConfig | null = null;
  private readonly BASE_URL = 'https://www.googleapis.com/gmail/v1';
  private readonly OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    const apiKey = localStorage.getItem('gmail_api_key');
    const clientId = localStorage.getItem('gmail_client_id');
    const accessToken = localStorage.getItem('gmail_access_token');
    const refreshToken = localStorage.getItem('gmail_refresh_token');

    if (apiKey && clientId) {
      this.config = { apiKey, clientId, accessToken, refreshToken };
    }
  }

  public saveConfig(config: Partial<GmailAPIConfig>): void {
    const newConfig = { ...this.config, ...config };
    this.config = newConfig;

    if (config.apiKey) localStorage.setItem('gmail_api_key', config.apiKey);
    if (config.clientId) localStorage.setItem('gmail_client_id', config.clientId);
    if (config.accessToken) localStorage.setItem('gmail_access_token', config.accessToken);
    if (config.refreshToken) localStorage.setItem('gmail_refresh_token', config.refreshToken);
  }

  public isAuthenticated(): boolean {
    return !!(this.config?.accessToken);
  }

  public clearConfig(): void {
    this.config = null;
    localStorage.removeItem('gmail_api_key');
    localStorage.removeItem('gmail_client_id');
    localStorage.removeItem('gmail_access_token');
    localStorage.removeItem('gmail_refresh_token');
  }

  // OAuth Authentication Flow
  public initiateOAuth(): string {
    if (!this.config?.clientId) {
      throw new Error('Client ID is required for OAuth');
    }

    const redirectUri = `${window.location.origin}/oauth/gmail/callback`;
    const scope = 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send';
    const state = Math.random().toString(36).substring(7);

    localStorage.setItem('gmail_oauth_state', state);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: scope,
      response_type: 'code',
      access_type: 'offline',
      state: state,
      prompt: 'consent'
    });

    return `${this.OAUTH_URL}?${params.toString()}`;
  }

  public async handleOAuthCallback(code: string, state: string): Promise<void> {
    const savedState = localStorage.getItem('gmail_oauth_state');
    if (state !== savedState) {
      throw new Error('Invalid OAuth state');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,
          client_id: this.config!.clientId,
          redirect_uri: `${window.location.origin}/oauth/gmail/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      this.saveConfig({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });

      localStorage.removeItem('gmail_oauth_state');
    } catch (error) {
      console.error('OAuth callback failed:', error);
      throw error;
    }
  }

  // Helper method for authenticated requests
  private async makeAuthenticatedRequest(url: string, options?: RequestInit): Promise<any> {
    if (!this.config?.accessToken) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (response.status === 401 && this.config.refreshToken) {
      // Try to refresh the access token
      await this.refreshAccessToken();
      return this.makeAuthenticatedRequest(url, options);
    }

    if (!response.ok) {
      throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.config?.refreshToken || !this.config?.clientId) {
      throw new Error('Cannot refresh token: missing refresh token or client ID');
    }

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          refresh_token: this.config.refreshToken,
          client_id: this.config.clientId,
          grant_type: 'refresh_token',
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error_description || data.error);
      }

      this.saveConfig({ accessToken: data.access_token });
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearConfig();
      throw error;
    }
  }

  // Gmail API Methods
  public async getProfile(): Promise<any> {
    return this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/profile`);
  }

  public async getMessages(filter?: EmailFilter, maxResults = 50): Promise<Email[]> {
    let url = `${this.BASE_URL}/users/me/messages?maxResults=${maxResults}`;

    if (filter?.query) {
      url += `&q=${encodeURIComponent(filter.query)}`;
    }
    if (filter?.isUnread) {
      url += '&q=is:unread';
    }
    if (filter?.isStarred) {
      url += '&q=is:starred';
    }
    if (filter?.hasAttachments) {
      url += '&q=has:attachment';
    }
    if (filter?.from) {
      url += `&q=from:${encodeURIComponent(filter.from)}`;
    }
    if (filter?.to) {
      url += `&q=to:${encodeURIComponent(filter.to)}`;
    }

    const response = await this.makeAuthenticatedRequest(url);
    const messages = response.messages || [];

    const emails = await Promise.all(
      messages.map((msg: any) => this.getMessage(msg.id))
    );

    return emails;
  }

  public async getMessage(id: string): Promise<Email> {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${id}?format=full`);
    return this.parseGmailMessage(response);
  }

  public async getThread(id: string): Promise<EmailThread> {
    const response = await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/threads/${id}?format=full`);
    return this.parseGmailThread(response);
  }

  public async getThreads(filter?: EmailFilter, maxResults = 50): Promise<EmailThread[]> {
    let url = `${this.BASE_URL}/users/me/threads?maxResults=${maxResults}`;

    if (filter?.query) {
      url += `&q=${encodeURIComponent(filter.query)}`;
    }
    if (filter?.isUnread) {
      url += '&q=is:unread';
    }

    const response = await this.makeAuthenticatedRequest(url);
    const threads = response.threads || [];

    const emailThreads = await Promise.all(
      threads.map((thread: any) => this.getThread(thread.id))
    );

    return emailThreads;
  }

  public async sendMessage(emailData: any): Promise<any> {
    const message = this.createEmailMessage(emailData);

    return this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/send`, {
      method: 'POST',
      body: JSON.stringify({
        raw: this.base64UrlEncode(message),
      }),
    });
  }

  public async markAsRead(messageId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        removeLabelIds: ['UNREAD'],
      }),
    });
  }

  public async markAsUnread(messageId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: ['UNREAD'],
      }),
    });
  }

  public async starMessage(messageId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        addLabelIds: ['STARRED'],
      }),
    });
  }

  public async unstarMessage(messageId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${messageId}/modify`, {
      method: 'POST',
      body: JSON.stringify({
        removeLabelIds: ['STARRED'],
      }),
    });
  }

  public async deleteMessage(messageId: string): Promise<void> {
    await this.makeAuthenticatedRequest(`${this.BASE_URL}/users/me/messages/${messageId}`, {
      method: 'DELETE',
    });
  }

  // Helper methods for parsing Gmail API responses
  private parseGmailMessage(gmailMessage: any): Email {
    const headers = gmailMessage.payload.headers;
    const getHeader = (name: string) => {
      const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : '';
    };

    const parseEmailAddresses = (headerValue: string) => {
      if (!headerValue) return [];
      return headerValue.split(',').map(addr => {
        const match = addr.trim().match(/^(.*?)\s*<(.+?)>$/) || [, '', addr.trim()];
        return {
          name: match[1]?.replace(/"/g, '').trim() || '',
          email: match[2] || addr.trim(),
        };
      });
    };

    const extractBody = (payload: any): string => {
      if (payload.body?.data) {
        return this.base64UrlDecode(payload.body.data);
      }

      if (payload.parts) {
        const textPart = payload.parts.find((part: any) => part.mimeType === 'text/plain');
        if (textPart?.body?.data) {
          return this.base64UrlDecode(textPart.body.data);
        }

        const htmlPart = payload.parts.find((part: any) => part.mimeType === 'text/html');
        if (htmlPart?.body?.data) {
          return this.base64UrlDecode(htmlPart.body.data);
        }
      }

      return '';
    };

    const attachments = this.extractAttachments(gmailMessage.payload);

    return {
      id: gmailMessage.id,
      threadId: gmailMessage.threadId,
      subject: getHeader('Subject') || '(No subject)',
      snippet: gmailMessage.snippet || '',
      body: extractBody(gmailMessage.payload),
      from: parseEmailAddresses(getHeader('From'))[0] || { email: 'unknown@example.com' },
      to: parseEmailAddresses(getHeader('To')),
      cc: parseEmailAddresses(getHeader('Cc')),
      bcc: parseEmailAddresses(getHeader('Bcc')),
      date: new Date(parseInt(gmailMessage.internalDate)),
      isRead: !gmailMessage.labelIds?.includes('UNREAD'),
      isStarred: gmailMessage.labelIds?.includes('STARRED') || false,
      isImportant: gmailMessage.labelIds?.includes('IMPORTANT') || false,
      labels: gmailMessage.labelIds || [],
      attachments,
      hasAttachments: attachments.length > 0,
      folder: this.determineFolder(gmailMessage.labelIds || []),
    };
  }

  private parseGmailThread(gmailThread: any): EmailThread {
    const messages = gmailThread.messages.map((msg: any) => this.parseGmailMessage(msg));
    const participants = Array.from(new Set(
      messages.flatMap(msg => [msg.from, ...msg.to, ...(msg.cc || [])])
    ));

    return {
      id: gmailThread.id,
      messages,
      subject: messages[0]?.subject || '(No subject)',
      participants,
      lastMessage: new Date(Math.max(...messages.map(msg => msg.date.getTime()))),
      messageCount: messages.length,
      isRead: messages.every(msg => msg.isRead),
      hasAttachments: messages.some(msg => msg.hasAttachments),
      snippet: gmailThread.snippet || messages[0]?.snippet || '',
    };
  }

  private extractAttachments(payload: any): any[] {
    const attachments: any[] = [];

    if (payload.parts) {
      payload.parts.forEach((part: any) => {
        if (part.filename && part.body?.attachmentId) {
          attachments.push({
            id: part.body.attachmentId,
            filename: part.filename,
            mimeType: part.mimeType,
            size: part.body.size || 0,
          });
        }

        if (part.parts) {
          attachments.push(...this.extractAttachments(part));
        }
      });
    }

    return attachments;
  }

  private determineFolder(labelIds: string[]): 'inbox' | 'sent' | 'drafts' | 'spam' | 'trash' | 'important' {
    if (labelIds.includes('INBOX')) return 'inbox';
    if (labelIds.includes('SENT')) return 'sent';
    if (labelIds.includes('DRAFT')) return 'drafts';
    if (labelIds.includes('SPAM')) return 'spam';
    if (labelIds.includes('TRASH')) return 'trash';
    if (labelIds.includes('IMPORTANT')) return 'important';
    return 'inbox';
  }

  private createEmailMessage(emailData: any): string {
    const to = emailData.to.map((addr: any) => `${addr.name ? `"${addr.name}" ` : ''}${addr.email}`).join(', ');
    const cc = emailData.cc ? `Cc: ${emailData.cc.map((addr: any) => `${addr.name ? `"${addr.name}" ` : ''}${addr.email}`).join(', ')}\r\n` : '';
    const subject = emailData.subject || '';
    const body = emailData.body || '';

    const message = [
      `To: ${to}`,
      cc,
      `Subject: ${subject}`,
      '\r\n',
      body,
    ].filter(Boolean).join('\r\n');

    return message;
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  private base64UrlDecode(str: string): string {
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    while (str.length % 4) {
      str += '=';
    }
    return atob(str);
  }

  // Sync emails from Gmail
  public async syncEmails(filter?: EmailFilter): Promise<GmailSyncResult> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Gmail',
          error: 'Please connect your Gmail account first',
        };
      }

      const messages = await this.getMessages(filter);

      // Store in localStorage for persistence
      const emailsData = {
        emails: messages,
        lastSync: new Date().toISOString(),
      };
      localStorage.setItem('gmail_emails', JSON.stringify(emailsData));

      // Trigger custom event to notify components
      window.dispatchEvent(new CustomEvent('gmailEmailsSynced', { detail: messages }));

      return {
        success: true,
        message: `Successfully synced ${messages.length} emails from Gmail`,
        emailsSynced: messages.length,
      };
    } catch (error) {
      console.error('Gmail sync failed:', error);
      return {
        success: false,
        message: 'Failed to sync Gmail emails',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Test connection
  public async testConnection(): Promise<{ success: boolean; message: string; profile?: any }> {
    try {
      if (!this.isAuthenticated()) {
        return {
          success: false,
          message: 'Not authenticated with Gmail',
        };
      }

      const profile = await this.getProfile();
      return {
        success: true,
        message: `Connected to Gmail as ${profile.emailAddress}`,
        profile,
      };
    } catch (error) {
      console.error('Gmail connection test failed:', error);
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }
}

export const gmailAPI = new GmailAPI();