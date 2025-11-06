/**
 * Firebase Authentication Integration Script
 * This script replaces the mock authManager with real Firebase authentication
 */

// Import Firebase modules (will be loaded from CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  console.log('🔥 Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  // Show error message to user
  if (typeof window !== 'undefined') {
    document.body.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #1e1b4b; font-family: system-ui;">
        <div style="background: rgba(255,255,255,0.1); backdrop-filter: blur(10px); padding: 2rem; border-radius: 1rem; text-align: center; max-width: 400px;">
          <h2 style="color: #ef4444; margin-bottom: 1rem;">⚠️ Configuration Required</h2>
          <p style="color: white; line-height: 1.6;">
            Firebase authentication needs to be configured. Please check the FIREBASE-SETUP-GUIDE.md file for instructions.
          </p>
          <p style="color: #94a3b8; font-size: 0.9rem; margin-top: 1rem;">
            Update the firebaseConfig in firebase-auth-integration.js with your actual Firebase project details.
          </p>
        </div>
      </div>
    `;
  }
}

// User Authentication Service
class UserAuthService {
  constructor() {
    this.currentUser = null;
  }

  async signUp(signupData) {
    try {
      console.log('🚀 Starting signup process...');

      // Validate input
      if (!signupData.username || signupData.username.length < 3) {
        return { success: false, error: 'Username must be at least 3 characters' };
      }

      if (signupData.password !== signupData.confirmPassword) {
        return { success: false, error: 'Passwords do not match' };
      }

      if (signupData.password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters' };
      }

      // Create user with Firebase
      console.log('📝 Creating user account...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      );

      const user = userCredential.user;
      console.log('✅ User created:', user.uid);

      // Update profile with username
      await updateProfile(user, {
        displayName: signupData.username
      });
      console.log('✅ Username set:', signupData.username);

      // Create user profile in Firestore
      const userProfile = {
        uid: user.uid,
        email: user.email,
        username: signupData.username,
        fullName: signupData.fullName,
        displayName: signupData.username,
        emailVerified: user.emailVerified,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'system',
          marketing: signupData.marketing || false
        }
      };

      await setDoc(doc(db, 'users', user.uid), userProfile);
      console.log('✅ User profile saved to Firestore');

      // ✅ SEND REAL VERIFICATION EMAIL via Firebase
      await sendEmailVerification(user, {
        url: `${window.location.origin}/loginpage.html`,
        handleCodeInApp: false,
      });

      console.log('✅ REAL verification email sent to:', signupData.email);

      return {
        success: true,
        user: userProfile,
        needsVerification: !user.emailVerified
      };

    } catch (error) {
      console.error('❌ Signup error:', error);

      // User-friendly error messages
      let errorMessage = 'Failed to create account. ';

      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered. Please login instead.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 8 characters with numbers and symbols.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase is not properly configured. Please check your setup.';
          break;
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async signIn(email, password, rememberMe = false) {
    try {
      console.log('🔐 Starting sign in process...');

      if (!email || !password) {
        return { success: false, error: 'Please fill in all fields' };
      }

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;
      console.log('✅ User signed in:', user.uid);

      if (!user.emailVerified) {
        return {
          success: false,
          error: 'Please verify your email before signing in. Check your inbox for the verification link.',
          needsVerification: true
        };
      }

      // Remember me functionality
      if (rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', email);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedEmail');
      }

      // Store login session
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        emailVerified: user.emailVerified
      }));

      console.log('✅ Sign in successful for:', user.email);

      return { success: true };

    } catch (error) {
      console.error('❌ Sign in error:', error);

      let errorMessage = 'Failed to sign in. ';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Check your internet connection.';
          break;
        case 'auth/configuration-not-found':
          errorMessage = 'Firebase is not properly configured. Please check your setup.';
          break;
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async sendPasswordResetEmail(email) {
    try {
      console.log('🔄 Sending password reset email...');

      if (!email) {
        return { success: false, error: 'Please enter your email address' };
      }

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/loginpage.html`,
        handleCodeInApp: false,
      });

      console.log('✅ Password reset email sent to:', email);

      return { success: true };

    } catch (error) {
      console.error('❌ Password reset error:', error);

      let errorMessage = 'Failed to send password reset email. ';

      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email address.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  async signOut() {
    try {
      await signOut(auth);
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('currentUser');
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  }

  getCurrentUser() {
    if (auth.currentUser) {
      return {
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName,
        emailVerified: auth.currentUser.emailVerified
      };
    }
    return null;
  }

  isAuthenticated() {
    return auth.currentUser !== null && auth.currentUser.emailVerified;
  }
}

// Create global instance
window.userAuthService = new UserAuthService();
window.authManager = window.userAuthService; // Backward compatibility

console.log('🎯 Firebase User Authentication Service loaded');