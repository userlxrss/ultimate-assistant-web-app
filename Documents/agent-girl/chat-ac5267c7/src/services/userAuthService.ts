/**
 * User Authentication Service
 * Replaces the mock authManager with real Firebase authentication
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  fullName?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    marketing: boolean;
  };
}

export interface AuthResult {
  success: boolean;
  user?: UserProfile;
  error?: string;
  needsVerification?: boolean;
}

export interface SignupData {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  marketing: boolean;
}

class UserAuthService {
  private currentUser: UserProfile | null = null;
  private authStateListeners: ((user: UserProfile | null) => void)[] = [];

  constructor() {
    this.initializeAuthListener();
  }

  /**
   * Initialize Firebase auth state listener
   */
  private initializeAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        try {
          // Get or create user profile in Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

          if (userDoc.exists()) {
            this.currentUser = userDoc.data() as UserProfile;

            // Update last login
            await updateDoc(doc(db, 'users', firebaseUser.uid), {
              lastLoginAt: new Date()
            });
          } else {
            // Create new user profile
            this.currentUser = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
              emailVerified: firebaseUser.emailVerified,
              createdAt: new Date(),
              lastLoginAt: new Date(),
              preferences: {
                theme: 'system',
                marketing: false
              }
            };

            // Save to Firestore
            await setDoc(doc(db, 'users', firebaseUser.uid), this.currentUser);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
      }

      // Notify all listeners
      this.authStateListeners.forEach(listener => listener(this.currentUser));
    });
  }

  /**
   * Sign up a new user with email and password
   */
  async signUp(signupData: SignupData): Promise<AuthResult> {
    try {
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
      const userCredential: UserCredential = await createUserWithEmailAndPassword(
        auth,
        signupData.email,
        signupData.password
      );

      const user = userCredential.user;

      // Update profile with username
      await updateProfile(user, {
        displayName: signupData.username
      });

      // Create user profile
      const userProfile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        username: signupData.username,
        fullName: signupData.fullName,
        displayName: signupData.username,
        emailVerified: user.emailVerified,
        createdAt: new Date(),
        lastLoginAt: new Date(),
        preferences: {
          theme: 'system',
          marketing: signupData.marketing
        }
      };

      // Save profile to Firestore
      await setDoc(doc(db, 'users', user.uid), userProfile);

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

    } catch (error: any) {
      console.error('Signup error:', error);

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
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthResult> {
    try {
      if (!email || !password) {
        return { success: false, error: 'Please fill in all fields' };
      }

      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

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

      console.log('✅ User signed in successfully:', user.email);

      return { success: true };

    } catch (error: any) {
      console.error('Sign in error:', error);

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
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    try {
      if (!email) {
        return { success: false, error: 'Please enter your email address' };
      }

      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/loginpage.html`,
        handleCodeInApp: false,
      });

      console.log('✅ Password reset email sent to:', email);

      return { success: true };

    } catch (error: any) {
      console.error('Password reset error:', error);

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

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.currentUser !== null && this.currentUser.emailVerified;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: UserProfile | null) => void): () => void {
    this.authStateListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<AuthResult> {
    try {
      const user = auth.currentUser;

      if (!user) {
        return { success: false, error: 'No user is currently signed in' };
      }

      if (user.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      await sendEmailVerification(user, {
        url: `${window.location.origin}/loginpage.html`,
        handleCodeInApp: false,
      });

      console.log('✅ Verification email resent to:', user.email);

      return { success: true };

    } catch (error: any) {
      console.error('Resend verification error:', error);

      let errorMessage = 'Failed to resend verification email. ';

      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please wait before trying again.';
          break;
        default:
          errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }
}

// Export singleton instance
export const userAuthService = new UserAuthService();
export default userAuthService;