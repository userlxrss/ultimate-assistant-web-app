/**
 * SUPABASE AUTHENTICATION DEBUGGER
 * Used to diagnose the 400 error for tuescalarina3@gmail.com
 */

(async function debugSupabaseAuth() {
    console.log('🔍 Starting Supabase Authentication Debug');
    console.log('===========================================');

    // Load Supabase SDK
    await loadSupabaseSDK();

    // Initialize Supabase client
    const supabaseUrl = 'https://vacwojgxafujscxuqmpg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    const testEmail = 'tuescalarina3@gmail.com';
    const testPasswords = ['test123', 'password', 'Test123!', 'Password123', 'admin123'];

    console.log('📧 Testing user:', testEmail);
    console.log('🔑 Testing passwords:', testPasswords.join(', '));
    console.log('');

    // Test 1: Check if user exists by trying different passwords
    console.log('🧪 Test 1: Checking user existence with various passwords');
    for (const password of testPasswords) {
        try {
            console.log(`Testing password: "${password}"`);
            const { data, error } = await supabase.auth.signInWithPassword({
                email: testEmail,
                password: password
            });

            if (error) {
                console.log(`❌ Error: ${error.message}`);
                console.log(`   Error code: ${error.status}`);
                console.log(`   Error details:`, error);
            } else {
                console.log(`✅ SUCCESS! Password found: "${password}"`);
                console.log('User data:', data);
                break;
            }
            console.log('');
        } catch (err) {
            console.log(`❌ Exception: ${err.message}`);
            console.log('');
        }
    }

    // Test 2: Try to sign up with the same email to see what happens
    console.log('🧪 Test 2: Attempting to recreate user to check existence');
    try {
        const { data, error } = await supabase.auth.signUp({
            email: testEmail,
            password: 'TestPassword123!',
            options: {
                data: {
                    full_name: 'Debug Test',
                    username: 'debugtest'
                }
            }
        });

        if (error) {
            console.log('✅ User exists (signup failed as expected):', error.message);
        } else {
            console.log('User created (unexpected):', data);
        }
    } catch (err) {
        console.log('Exception during signup test:', err.message);
    }

    // Test 3: Check current session
    console.log('🧪 Test 3: Checking current session');
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (session) {
            console.log('✅ Active session found:', session.user.email);
        } else {
            console.log('❌ No active session');
        }
    } catch (err) {
        console.log('Exception checking session:', err.message);
    }

    // Test 4: Test password reset flow
    console.log('🧪 Test 4: Testing password reset request');
    try {
        const { data, error } = await supabase.auth.resetPasswordForEmail(testEmail);
        if (error) {
            console.log('❌ Password reset failed:', error.message);
        } else {
            console.log('✅ Password reset email sent successfully');
        }
    } catch (err) {
        console.log('Exception during password reset:', err.message);
    }

    // Test 5: Check user with admin endpoint (if possible)
    console.log('🧪 Test 5: Attempting to get user info via recovery flow');
    try {
        // Try to get user by using OAuth with a dummy token to see error
        const { data, error } = await supabase.auth.getUser('dummy-token');
        if (error) {
            console.log('Expected error with dummy token:', error.message);
        }
    } catch (err) {
        console.log('Exception during user lookup:', err.message);
    }

    console.log('');
    console.log('🏁 Debug session completed');
    console.log('===========================================');

    // Helper function to load Supabase SDK
    async function loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            if (window.supabase) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.async = true;
            script.onload = () => {
                console.log('✅ Supabase SDK loaded for debugging');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Supabase SDK'));
            };
            document.head.appendChild(script);
        });
    }
})();