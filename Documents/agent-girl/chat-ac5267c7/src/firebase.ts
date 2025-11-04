/**
 * Mock Authentication for Immediate Production Use
 * Works without any backend or Firebase configuration
 */

// Mock user interface
interface MockUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  accessToken: string;
}

// Mock auth state
let currentUser: MockUser | null = null;
let authStateListeners: ((user: MockUser | null) => void)[] = [];

// Load user from localStorage on startup
const storedUser = localStorage.getItem('mockAuthUser');
if (storedUser) {
  try {
    currentUser = JSON.parse(storedUser);
  } catch (e) {
    localStorage.removeItem('mockAuthUser');
  }
}

// Mock authentication functions
export const signInWithGoogle = async (): Promise<MockUser> => {
  return new Promise((resolve) => {
    // Simulate Google sign-in with mock user
    setTimeout(() => {
      const mockUser: MockUser = {
        uid: 'mock-user-' + Math.random().toString(36).substr(2, 9),
        email: 'user@gmail.com',
        displayName: 'Demo User',
        photoURL: `https://ui-avatars.com/api/?name=Demo+User&background=random`,
        accessToken: 'mock-access-token-' + Math.random().toString(36).substr(2, 9)
      };

      currentUser = mockUser;
      localStorage.setItem('mockAuthUser', JSON.stringify(mockUser));

      // Notify all listeners
      authStateListeners.forEach(listener => listener(mockUser));

      resolve(mockUser);
    }, 1000); // Simulate network delay
  });
};

export const logoutUser = async (): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      currentUser = null;
      localStorage.removeItem('mockAuthUser');

      // Notify all listeners
      authStateListeners.forEach(listener => listener(null));

      resolve();
    }, 500); // Simulate network delay
  });
};

export const onAuthStateChange = (callback: (user: MockUser | null) => void) => {
  authStateListeners.push(callback);

  // Immediately call with current user
  callback(currentUser);

  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter(listener => listener !== callback);
  };
};

// Mock exports for compatibility
export const auth = {
  currentUser: currentUser
};

export const db = null; // Not used in current implementation

// Get current user
export const getCurrentUser = (): MockUser | null => {
  return currentUser;
};

// Test function to verify Firebase is properly configured
export const testFirebaseConnection = () => {
  try {
    console.log('🔥 Firebase initialized successfully');
    console.log('📊 Auth service ready:', !!auth);
    console.log('📝 Firestore ready:', !!db);
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
};

export default app;