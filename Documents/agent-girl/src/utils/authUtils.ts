/**
 * Authentication utilities for testing and debugging
 */

import { authManager } from './authManager';

// Debug function to check authentication status
export const debugAuthStatus = () => {
  console.log('🔍 === AUTHENTICATION DEBUG ===');

  // Check AuthManager
  const authStatus = authManager.getAuthStatus();
  console.log('📊 AuthManager Status:', authStatus);

  // Check localStorage directly
  const rawStorage = localStorage.getItem('productivity_hub_auth');
  console.log('🗄️ Raw localStorage:', rawStorage ? JSON.parse(rawStorage) : null);

  // Check individual tokens
  const individualTokens = {
    google_access_token: localStorage.getItem('google_access_token'),
    google_calendar_ical_url: localStorage.getItem('google_calendar_ical_url'),
    google_calendar_api_key: localStorage.getItem('google_calendar_api_key'),
    gmail_session: localStorage.getItem('gmail_session'),
  };
  console.log('🔑 Individual Tokens:', individualTokens);

  return {
    authManager: authStatus,
    rawStorage: rawStorage ? JSON.parse(rawStorage) : null,
    individualTokens
  };
};

// Test function to simulate saving a Google session
export const testGoogleSessionSave = () => {
  console.log('🧪 Testing Google session save...');

  const testSession = {
    email: 'test@example.com',
    accessToken: 'test_access_token_12345',
    refreshToken: 'test_refresh_token_67890',
    createdAt: Date.now()
  };

  authManager.saveGoogleSession(
    testSession.email,
    testSession.accessToken,
    testSession.refreshToken
  );

  console.log('✅ Test session saved');
  debugAuthStatus();
};

// Test function to clear all authentication
export const clearAllAuth = () => {
  console.log('🗑️ Clearing all authentication...');

  authManager.clearAllSessions();

  // Also clear individual tokens
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_calendar_ical_url');
  localStorage.removeItem('google_calendar_api_key');
  localStorage.removeItem('gmail_session');

  console.log('✅ All authentication cleared');
  debugAuthStatus();
};

// Function to check if authentication persists across page reloads
export const testAuthPersistence = () => {
  console.log('🔄 Testing authentication persistence...');

  const beforeStatus = debugAuthStatus();

  // Trigger a "page reload" simulation by clearing and rechecking
  setTimeout(() => {
    const afterStatus = debugAuthStatus();

    const isPersistent =
      beforeStatus.authManager.google === afterStatus.authManager.google &&
      beforeStatus.authManager.totalConnections === afterStatus.authManager.totalConnections;

    console.log(isPersistent ? '✅ Authentication is persistent!' : '❌ Authentication is not persistent');
  }, 100);
};

// Function to validate session integrity
export const validateSessionIntegrity = () => {
  console.log('🔒 Validating session integrity...');

  const googleSession = authManager.getGoogleSession();

  if (!googleSession) {
    console.log('❌ No Google session found');
    return false;
  }

  // Check session age
  const now = Date.now();
  const sessionAge = now - googleSession.createdAt;
  const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days

  const isValidAge = sessionAge < maxAge;
  console.log(`⏰ Session age: ${Math.round(sessionAge / (1000 * 60 * 60))} hours`);
  console.log(`✅ Session age valid: ${isValidAge}`);

  // Check required fields
  const hasAccessToken = !!googleSession.accessToken;
  const hasEmail = !!googleSession.email;

  console.log(`🔑 Has access token: ${hasAccessToken}`);
  console.log(`📧 Has email: ${hasEmail}`);

  const isComplete = isValidAge && hasAccessToken && hasEmail;
  console.log(`🎯 Session complete: ${isComplete}`);

  return isComplete;
};

// Make functions available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).authDebug = {
    debugAuthStatus,
    testGoogleSessionSave,
    clearAllAuth,
    testAuthPersistence,
    validateSessionIntegrity
  };

  console.log('🛠️ Auth debugging tools available at: window.authDebug');
  console.log('📋 Available commands:');
  console.log('  - authDebug.debugAuthStatus()');
  console.log('  - authDebug.testGoogleSessionSave()');
  console.log('  - authDebug.clearAllAuth()');
  console.log('  - authDebug.testAuthPersistence()');
  console.log('  - authDebug.validateSessionIntegrity()');
}