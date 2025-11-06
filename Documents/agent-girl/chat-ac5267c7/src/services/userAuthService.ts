/**
 * User Authentication Service
 * Uses real Supabase authentication
 */

import {
  signUpWithEmail,
  signInWithEmail,
  signOut,
  getCurrentUser,
  onAuthStateChange
} from '../supabase';

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
   * Initialize Supabase auth state listener
   */
  private initializeAuthListener() {
    onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Create user profile from Supabase session
          this.currentUser = {
            uid: session.user.id,
            email: session.user.email || '',
            username: session.user.email?.split('@')[0] || '',
            displayName: session.user.email?.split('@')[0] || '',
            photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(session.user.email?.split('@')[0] || 'User')}&background=random`,
            emailVerified: true, // Supabase handles email verification
            createdAt: new Date(session.user.created_at),
            lastLoginAt: new Date(),
            preferences: {
              theme: 'system',
              marketing: false
            }
          };

          console.log('🔥 Supabase user authenticated:', this.currentUser.email);
        } catch (error) {
          console.error('Error loading user profile:', error);
          this.currentUser = null;
        }
      } else {
        this.currentUser = null;
        console.log('🔥 No Supabase user authenticated');
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

      // Create user with Supabase
      const data = await signUpWithEmail(signupData.email, signupData.password);

      if (data.user) {
        // Create user profile
        const userProfile: UserProfile = {
          uid: data.user.id,
          email: data.user.email || '',
          username: signupData.username,
          fullName: signupData.fullName,
          displayName: signupData.username,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(signupData.username)}&background=random`,
          emailVerified: data.user.email_confirmed_at ? true : false,
          createdAt: new Date(data.user.created_at),
          lastLoginAt: new Date(),
          preferences: {
            theme: 'system',
            marketing: signupData.marketing
          }
        };

        // TODO: Email verification will be handled by Supabase automatically if enabled in settings
        // if (!data.user.email_confirmed_at) {
        //   try {
        //     await resendVerificationEmail(signupData.email);
        //     console.log('✅ Verification email sent to:', signupData.email);
        //   } catch (emailError) {
        //     console.warn('⚠️ Failed to send verification email:', emailError);
        //   }
        // }

        console.log('✅ Supabase user signed up successfully:', signupData.email);

        return {
          success: true,
          user: userProfile,
          needsVerification: !data.user.email_confirmed_at
        };
      }

      return { success: false, error: 'Failed to create user account' };

    } catch (error: any) {
      console.error('Signup error:', error);

      // User-friendly error messages
      let errorMessage = 'Failed to create account. ';

      if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Use at least 8 characters.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Check your internet connection.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else {
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

      const data = await signInWithEmail(email, password);

      if (data.user) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
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

        console.log('✅ Supabase user signed in successfully:', data.user.email);

        return { success: true };
      }

      return { success: false, error: 'Failed to sign in' };

    } catch (error: any) {
      console.error('Sign in error:', error);

      let errorMessage = 'Failed to sign in. ';

      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Incorrect email or password.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in. Check your inbox for the verification link.';
      } else if (error.message.includes('Invalid email')) {
        errorMessage = 'Invalid email address.';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'Too many failed attempts. Please try again later.';
      } else if (error.message.includes('network')) {
        errorMessage = 'Network error. Check your internet connection.';
      } else {
        errorMessage += error.message;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send password reset email (not implemented for Supabase in this context)
   */
  async sendPasswordResetEmail(email: string): Promise<AuthResult> {
    // For now, this is not implemented in the Supabase context
    // Users would use Supabase's built-in password reset functionality
    return { success: false, error: 'Password reset functionality not available in current implementation' };
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut();
      this.currentUser = null;
      console.log('✅ User signed out successfully from Supabase');
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
    return this.currentUser !== null;
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
   * Resend verification email (TODO: implement using Supabase functions)
   */
  async resendVerificationEmail(email: string): Promise<AuthResult> {
    // TODO: Implement this function using Supabase's resend functionality
    // For now, this is not used in the simple auth flow
    return { success: false, error: 'Email verification resend not implemented yet' };
  }
}

// Export singleton instance
export const userAuthService = new UserAuthService();
export default userAuthService;