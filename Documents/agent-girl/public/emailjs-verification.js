/**
 * MIGRATION BRIDGE - EMAILJS TO SUPABASE
 * This file redirects to the new Supabase authentication system
 *
 * IMPORTANT: EmailJS has been replaced with Supabase for better reliability
 * All authentication functions now use Supabase backend
 */

console.log('🚧 EmailJS system is deprecated. Redirecting to Supabase authentication...');

// Automatically load Supabase auth system
const script = document.createElement('script');
script.src = '/supabase-auth.js';
script.onload = function() {
    console.log('✅ Supabase authentication system loaded successfully');

    // Notify user of the migration
    if (typeof window !== 'undefined' && !sessionStorage.getItem('supabase-notice-shown')) {
        console.log('📧 Email verification now powered by Supabase for better reliability');
        sessionStorage.setItem('supabase-notice-shown', 'true');
    }
};
script.onerror = function() {
    console.error('❌ Failed to load Supabase authentication system');
};

document.head.appendChild(script);

// Create a compatibility layer that redirects all EmailJS calls to Supabase
class EmailJSToSupabaseBridge {
    constructor() {
        console.log('🔗 Initializing EmailJS to Supabase bridge...');
    }

    async sendVerificationEmail(userData) {
        console.log('📧 Redirecting EmailJS sendVerificationEmail to Supabase...');

        // Wait for Supabase to load
        if (typeof window.supabaseAuth === 'undefined') {
            await new Promise(resolve => {
                const checkInterval = setInterval(() => {
                    if (typeof window.supabaseAuth !== 'undefined') {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            });
        }

        // Redirect to Supabase signup
        return await window.supabaseAuth.signUp(userData);
    }

    verifyEmail(email, code) {
        console.log('🔍 Redirecting EmailJS verifyEmail to Supabase...');

        // Supabase handles email verification automatically
        // This method is kept for compatibility but no longer needed
        return {
            success: false,
            error: 'Email verification is now handled automatically by Supabase. Please check your email inbox.'
        };
    }

    checkLogin(email, password) {
        console.log('🔑 Redirecting EmailJS checkLogin to Supabase...');

        if (typeof window.supabaseAuth !== 'undefined') {
            return window.supabaseAuth.signIn(email, password);
        }

        return {
            success: false,
            error: 'Authentication system not ready. Please try again.'
        };
    }

    isAuthenticated() {
        if (typeof window.supabaseAuth !== 'undefined') {
            return window.supabaseAuth.isAuthenticated();
        }
        return false;
    }

    getCurrentUser() {
        if (typeof window.supabaseAuth !== 'undefined') {
            return window.supabaseAuth.getCurrentUser();
        }
        return null;
    }

    async signIn(email, password, rememberMe = false) {
        console.log('🔑 Redirecting EmailJS signIn to Supabase...');

        if (typeof window.supabaseAuth !== 'undefined') {
            return await window.supabaseAuth.signIn(email, password, rememberMe);
        }

        return {
            success: false,
            error: 'Authentication system not ready. Please try again.'
        };
    }

    async signOut() {
        console.log('🚪 Redirecting EmailJS signOut to Supabase...');

        if (typeof window.supabaseAuth !== 'undefined') {
            return await window.supabaseAuth.signOut();
        }

        return {
            success: false,
            error: 'Authentication system not ready. Please try again.'
        };
    }
}

// Create global instances for backward compatibility
window.emailJSEmailVerification = new EmailJSToSupabaseBridge();
window.authManager = window.emailJSEmailVerification;
window.productionEmailVerification = window.emailJSEmailVerification;

console.log('✅ EmailJS to Supabase bridge initialized');
console.log('📧 All email verifications now powered by Supabase for 100% reliability');