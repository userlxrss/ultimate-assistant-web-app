/**
 * Persistent Authentication Manager
 * Handles secure storage and retrieval of authentication tokens for all integrations
 */

export interface GmailSession {
  sessionId: string;
  email: string;
  createdAt: number;
}

export interface MotionSession {
  apiKey: string;
  createdAt: number;
}

export interface GoogleSession {
  accessToken?: string;
  refreshToken?: string;
  email: string;
  createdAt: number;
}

export interface AuthSessions {
  gmail?: GmailSession;
  motion?: MotionSession;
  google?: GoogleSession;
}

const STORAGE_KEY = 'productivity_hub_auth';

class AuthManager {
  /**
   * Save all authentication sessions to localStorage
   */
  saveSessions(sessions: Partial<AuthSessions>): void {
    try {
      const existingSessions = this.getSessions();
      const updatedSessions = { ...existingSessions, ...sessions };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));
      console.log('🔐 Authentication sessions saved:', Object.keys(updatedSessions));
    } catch (error) {
      console.error('❌ Failed to save auth sessions:', error);
    }
  }

  /**
   * Retrieve all authentication sessions from localStorage
   */
  getSessions(): AuthSessions {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Failed to retrieve auth sessions:', error);
    }
    return {};
  }

  /**
   * Save Gmail session
   */
  saveGmailSession(sessionId: string, email: string): void {
    const session: GmailSession = {
      sessionId,
      email,
      createdAt: Date.now()
    };
    this.saveSessions({ gmail: session });
    console.log('📧 Gmail session saved for:', email);
  }

  /**
   * Get Gmail session
   */
  getGmailSession(): GmailSession | null {
    const sessions = this.getSessions();
    const gmailSession = sessions.gmail;

    if (gmailSession && this.isValidSession(gmailSession.createdAt)) {
      return gmailSession;
    }

    if (gmailSession) {
      console.log('⚠️ Gmail session expired, clearing...');
      this.clearGmailSession();
    }

    return null;
  }

  /**
   * Save Motion session
   */
  saveMotionSession(apiKey: string): void {
    const session: MotionSession = {
      apiKey,
      createdAt: Date.now()
    };
    this.saveSessions({ motion: session });
    console.log('🎯 Motion session saved');
  }

  /**
   * Get Motion session
   */
  getMotionSession(): MotionSession | null {
    const sessions = this.getSessions();
    const motionSession = sessions.motion;

    if (motionSession && this.isValidSession(motionSession.createdAt)) {
      return motionSession;
    }

    if (motionSession) {
      console.log('⚠️ Motion session expired, clearing...');
      this.clearMotionSession();
    }

    return null;
  }

  /**
   * Save Google session
   */
  saveGoogleSession(email: string, accessToken?: string, refreshToken?: string): void {
    const session: GoogleSession = {
      email,
      accessToken,
      refreshToken,
      createdAt: Date.now()
    };
    this.saveSessions({ google: session });
    console.log('📅 Google session saved for:', email);
  }

  /**
   * Get Google session
   */
  getGoogleSession(): GoogleSession | null {
    const sessions = this.getSessions();
    const googleSession = sessions.google;

    if (googleSession && this.isValidSession(googleSession.createdAt)) {
      return googleSession;
    }

    if (googleSession) {
      console.log('⚠️ Google session expired, clearing...');
      this.clearGoogleSession();
    }

    return null;
  }

  /**
   * Clear Gmail session
   */
  clearGmailSession(): void {
    const sessions = this.getSessions();
    delete sessions.gmail;
    this.saveSessions(sessions);
    console.log('📧 Gmail session cleared');
  }

  /**
   * Clear Motion session
   */
  clearMotionSession(): void {
    const sessions = this.getSessions();
    delete sessions.motion;
    this.saveSessions(sessions);
    console.log('🎯 Motion session cleared');
  }

  /**
   * Clear Google session
   */
  clearGoogleSession(): void {
    const sessions = this.getSessions();
    delete sessions.google;
    this.saveSessions(sessions);
    console.log('📅 Google session cleared');
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY);
    console.log('🔐 All authentication sessions cleared');
  }

  /**
   * Check if session is still valid (30 days)
   */
  private isValidSession(createdAt: number): boolean {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    return Date.now() - createdAt < thirtyDaysInMs;
  }

  /**
   * Get session status for all integrations
   */
  getAuthStatus(): {
    gmail: boolean;
    motion: boolean;
    google: boolean;
    totalConnections: number;
  } {
    const sessions = this.getSessions();
    const gmail = !!sessions.gmail && this.isValidSession(sessions.gmail.createdAt);
    const motion = !!sessions.motion && this.isValidSession(sessions.motion.createdAt);
    const google = !!sessions.google && this.isValidSession(sessions.google.createdAt);

    return {
      gmail,
      motion,
      google,
      totalConnections: [gmail, motion, google].filter(Boolean).length
    };
  }
}

// Export singleton instance
export const authManager = new AuthManager();