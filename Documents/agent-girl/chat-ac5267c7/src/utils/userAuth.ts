/**
 * User Authentication Utility
 * Simple fallback for emergency recovery
 */

export const userAuthManager = {
  // Simple auth state
  isAuthenticated: false,
  user: null,

  // Methods
  login: async (email: string, password: string) => {
    // Simple mock login
    return { success: true, user: { name: 'User', email } };
  },

  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    userAuthManager.isAuthenticated = false;
    userAuthManager.user = null;
  },

  getCurrentUser: () => {
    return userAuthManager.user;
  },

  // Emergency sign out
  emergencySignOut: () => {
    console.log('🚨 Emergency sign out initiated');
    localStorage.clear();
    sessionStorage.clear();
    if ('indexedDB' in window) {
      indexedDB.deleteDatabase('productivity_hub');
    }
    window.location.reload();
  }
};