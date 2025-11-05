// CRITICAL EMAIL VERIFICATION TEST SCRIPT
// Run this to test if your email verification is working

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vacwojgxafujscxuqmpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: true
    }
  }
);

async function testEmailVerification() {
  const testEmail = 'larstuesca@gmail.com'; // Your email for testing
  const testPassword = 'TestPassword123!';

  console.log('🧪 STARTING EMAIL VERIFICATION TEST...');
  console.log('📧 Test Email:', testEmail);
  console.log('🔗 Supabase URL:', 'https://vacwojgxafujscxuqmpg.supabase.co');
  console.log('');

  try {
    // Step 1: Sign up test user
    console.log('📝 Step 1: Creating test user...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: 'http://localhost:5176/auth/callback'
      }
    });

    if (error) {
      console.error('❌ SIGN UP ERROR:');
      console.error('   Code:', error.status);
      console.error('   Message:', error.message);

      // Common errors and solutions
      if (error.message.includes('over rate limit')) {
        console.log('💡 SOLUTION: Wait a few minutes before testing again');
      }
      if (error.message.includes('User already registered')) {
        console.log('💡 SOLUTION: Try a different email address');
      }
      if (error.message.includes('Email')) {
        console.log('💡 SOLUTION: Check your SMTP configuration in Supabase dashboard');
      }

      return false;
    }

    console.log('✅ Sign up successful!');
    console.log('📊 Response data:', {
      user: data.user ? 'User created' : 'No user',
      session: data.session ? 'Session active' : 'No session',
      userId: data.user?.id,
      userEmail: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at ? 'Yes' : 'No'
    });
    console.log('');

    // Step 2: Check what happened
    if (data.user && !data.session) {
      console.log('✅ EXPECTED RESULT: User created, awaiting email verification');
      console.log('📧 Verification email should have been sent to:', testEmail);
      console.log('🔍 Check your inbox AND spam folder');
      console.log('📋 Next steps:');
      console.log('   1. Click the verification link in the email');
      console.log('   2. You should be redirected to: http://localhost:5176/auth/callback');
      console.log('   3. After verification, try signing in');

    } else if (data.session) {
      console.log('⚠️  UNEXPECTED: User signed in immediately');
      console.log('   This means email confirmation might be disabled');
      console.log('   Check Supabase auth settings to enable email confirmation');

    } else {
      console.log('❌ UNEXPECTED RESPONSE: No user or session created');
    }

    // Step 3: Test resend functionality
    console.log('');
    console.log('🔄 Step 3: Testing resend verification email...');

    const { data: resendData, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:5176/auth/callback'
      }
    });

    if (resendError) {
      console.error('❌ RESEND ERROR:', resendError.message);
    } else {
      console.log('✅ Resend successful! Another email should arrive.');
    }

    console.log('');
    console.log('🏁 TEST COMPLETE');
    console.log('');
    console.log('TROUBLESHOOTING CHECKLIST:');
    console.log('□ Check email inbox for verification link');
    console.log('□ Check spam/junk folder');
    console.log('□ Verify SMTP settings in Supabase dashboard');
    console.log('□ Confirm Resend API key is valid');
    console.log('□ Check Supabase auth email settings');
    console.log('□ Try with a different email provider');

    return true;

  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error);
    console.log('');
    console.log('POSSIBLE CAUSES:');
    console.log('• Network connectivity issues');
    console.log('• Invalid Supabase configuration');
    console.log('• Corrupted Supabase client');
    console.log('');
    console.log('IMMEDIATE ACTIONS:');
    console.log('1. Check your internet connection');
    console.log('2. Verify Supabase URL and keys');
    console.log('3. Try running the test again');

    return false;
  }
}

// Test email verification status
async function checkVerificationStatus() {
  console.log('🔍 Checking current auth status...');

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.log('❌ No authenticated user');
  } else if (user) {
    console.log('✅ Authenticated user found:');
    console.log('   Email:', user.email);
    console.log('   Verified:', user.email_confirmed_at ? 'Yes' : 'No');
    console.log('   Created:', new Date(user.created_at).toLocaleString());
  } else {
    console.log('❌ No user authenticated');
  }
}

// Run the test
console.log('=' .repeat(60));
console.log('EMAIL VERIFICATION TEST - CRITICAL DIAGNOSIS');
console.log('=' .repeat(60));
console.log('');

// Check current status first
await checkVerificationStatus();
console.log('');

// Run the main test
const success = await testEmailVerification();

console.log('');
console.log('=' .repeat(60));
if (success) {
  console.log('✅ TEST COMPLETED - Check your email now!');
} else {
  console.log('❌ TEST FAILED - See errors above');
}
console.log('=' .repeat(60));