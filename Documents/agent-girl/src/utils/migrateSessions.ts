/**
 * Session Migration Utility
 * Migrates old localStorage sessions to the new auth manager format
 */

export const migrateOldSessions = () => {
  try {
    console.log('🔄 Checking for old sessions to migrate...');

    // Check for old Gmail session
    const oldGmailSession = localStorage.getItem('gmail_session');
    if (oldGmailSession) {
      const session = JSON.parse(oldGmailSession);
      console.log('📧 Found old Gmail session for:', session.email);

      // Import the auth manager and save the session
      import('./authManager').then(({ authManager }) => {
        authManager.saveGmailSession(session.sessionId, session.email);
        console.log('✅ Gmail session migrated successfully');

        // Remove old session after successful migration
        localStorage.removeItem('gmail_session');
      });
    }

    // Check for any other old session formats and migrate them
    const oldMotionSession = localStorage.getItem('motion_session');
    if (oldMotionSession) {
      console.log('🎯 Found old Motion session');

      import('./authManager').then(({ authManager }) => {
        const session = JSON.parse(oldMotionSession);
        authManager.saveMotionSession(session.apiKey);
        console.log('✅ Motion session migrated successfully');

        // Remove old session after successful migration
        localStorage.removeItem('motion_session');
      });
    }

    // Check for old Google session
    const oldGoogleSession = localStorage.getItem('google_session');
    if (oldGoogleSession) {
      console.log('📅 Found old Google session');

      import('./authManager').then(({ authManager }) => {
        const session = JSON.parse(oldGoogleSession);
        authManager.saveGoogleSession(session.email, session.accessToken, session.refreshToken);
        console.log('✅ Google session migrated successfully');

        // Remove old session after successful migration
        localStorage.removeItem('google_session');
      });
    }

    console.log('🎯 Session migration complete');
  } catch (error) {
    console.error('❌ Session migration failed:', error);
  }
};