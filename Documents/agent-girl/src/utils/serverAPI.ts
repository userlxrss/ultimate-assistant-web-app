// Server-side API client for secure OAuth-based integrations

const SERVER_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-server.com'
  : 'http://localhost:3007';

interface ServerResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  message?: string;
}

class ServerAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = SERVER_BASE_URL;
  }

  // Generic request method with authentication
  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ServerResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        credentials: 'include', // Include cookies for session-based auth
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`Server API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // OAuth status and management
  async getAuthStatus(): Promise<ServerResponse<{
    connected: boolean;
    services: {
      google: boolean;
      motion: boolean;
    };
    user: any;
  }>> {
    return this.request('/api/auth/status');
  }

  async disconnectService(service: 'google' | 'motion'): Promise<ServerResponse> {
    return this.request(`/api/auth/disconnect/${service}`, {
      method: 'POST',
    });
  }

  // OAuth connection methods
  connectGoogle(): void {
    // Open OAuth flow in popup
    const width = 500;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const popup = window.open(
      `${this.baseUrl}/auth/google`,
      'google-oauth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
    );

    // Listen for OAuth completion
    const handleOAuthCallback = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'oauth-callback') {
        if (event.data.success) {
          console.log(`${event.data.service} connected successfully`);
          // Trigger a custom event to notify components
          window.dispatchEvent(new CustomEvent('service-connected', {
            detail: { service: event.data.service }
          }));
        } else {
          console.error(`${event.data.service} connection failed:`, event.data.error);
          // Trigger error event
          window.dispatchEvent(new CustomEvent('service-connection-error', {
            detail: { service: event.data.service, error: event.data.error }
          }));
        }

        // Cleanup
        window.removeEventListener('message', handleOAuthCallback);
        popup?.close();
      }
    };

    window.addEventListener('message', handleOAuthCallback);

    // Fallback: check if popup was blocked
    setTimeout(() => {
      if (popup?.closed) {
        window.removeEventListener('message', handleOAuthCallback);
      }
    }, 1000);
  }

  async connectMotion(apiKey: string): Promise<ServerResponse> {
    return this.request('/auth/motion', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
  }

  // Test connections
  async testConnection(service: 'google' | 'motion'): Promise<ServerResponse> {
    return this.request(`/auth/test/${service}`);
  }

  // Gmail API methods
  async getGmailProfile(): Promise<ServerResponse> {
    return this.request('/api/google/gmail/profile');
  }

  async getGmailMessages(params: {
    maxResults?: number;
    pageToken?: string;
    q?: string;
    labelIds?: string[];
  } = {}): Promise<ServerResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v));
        } else {
          searchParams.append(key, String(value));
        }
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/google/gmail/messages${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async getGmailMessage(id: string): Promise<ServerResponse> {
    return this.request(`/api/google/gmail/messages/${id}`);
  }

  async modifyGmailMessage(id: string, changes: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
  }): Promise<ServerResponse> {
    return this.request(`/api/google/gmail/messages/${id}/modify`, {
      method: 'POST',
      body: JSON.stringify(changes),
    });
  }

  async sendGmailMessage(message: {
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string;
  }): Promise<ServerResponse> {
    return this.request('/api/google/gmail/send', {
      method: 'POST',
      body: JSON.stringify(message),
    });
  }

  // Google Calendar API methods
  async getCalendars(): Promise<ServerResponse> {
    return this.request('/api/google/calendar/calendars');
  }

  async getCalendarEvents(params: {
    calendarId?: string;
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    singleEvents?: boolean;
    orderBy?: string;
  } = {}): Promise<ServerResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/google/calendar/events${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async createCalendarEvent(calendarId: string, event: any): Promise<ServerResponse> {
    return this.request(`/api/google/calendar/events`, {
      method: 'POST',
      body: JSON.stringify({ calendarId, event }),
    });
  }

  // Google Contacts API methods
  async getContacts(params: {
    maxResults?: number;
    pageToken?: string;
  } = {}): Promise<ServerResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/google/contacts/connections${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  // Motion API methods
  async getMotionTasks(params: {
    limit?: number;
    offset?: number;
    status?: string;
    projectId?: string;
    assigneeId?: string;
    dueDate?: string;
    sort?: string;
  } = {}): Promise<ServerResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/motion/tasks${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async createMotionTask(taskData: any): Promise<ServerResponse> {
    return this.request('/api/motion/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateMotionTask(id: string, taskData: any): Promise<ServerResponse> {
    return this.request(`/api/motion/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteMotionTask(id: string): Promise<ServerResponse> {
    return this.request(`/api/motion/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async getMotionProjects(params: {
    limit?: number;
    offset?: number;
    status?: string;
    sort?: string;
  } = {}): Promise<ServerResponse> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    const endpoint = `/api/motion/projects${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint);
  }

  async createMotionProject(projectData: any): Promise<ServerResponse> {
    return this.request('/api/motion/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async getMotionUsers(): Promise<ServerResponse> {
    return this.request('/api/motion/users');
  }

  async getMotionWorkspace(): Promise<ServerResponse> {
    return this.request('/api/motion/workspace');
  }

  async getMotionSyncStatus(): Promise<ServerResponse> {
    return this.request('/api/motion/sync/status');
  }

  // Health check
  async healthCheck(): Promise<ServerResponse> {
    return this.request('/health');
  }
}

export const serverAPI = new ServerAPI();

// React hook for using the server API
export const useServerAPI = () => {
  return {
    serverAPI,
    connectGoogle: serverAPI.connectGoogle.bind(serverAPI),
    connectMotion: serverAPI.connectMotion.bind(serverAPI),
    // Add other frequently used methods as needed
  };
};