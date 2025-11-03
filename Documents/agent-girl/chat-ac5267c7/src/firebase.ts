/**
 * Firebase Configuration
 * Replace these values with your actual Firebase project configuration
 */

import { initializeApp } from 'firebase/app';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ IMPORTANT: Replace with your actual Firebase config
// Get these values from: Firebase Console → Project Settings → General → Your apps
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

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