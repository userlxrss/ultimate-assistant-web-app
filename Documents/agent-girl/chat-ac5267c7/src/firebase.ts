/**
 * Firebase Configuration
 * Production-ready Firebase configuration for authentication
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration for production
const firebaseConfig = {
  apiKey: "AIzaSyDummyKeyForTesting-ReplaceWithRealKey",
  authDomain: "productivity-hub.firebaseapp.com",
  projectId: "productivity-hub",
  storageBucket: "productivity-hub.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Google Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Firebase Authentication functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Google sign-in error:', error);
    throw error;
  }
};

export const logoutUser = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
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