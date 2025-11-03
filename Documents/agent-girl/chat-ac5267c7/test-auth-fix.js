/**
 * SUPABASE AUTHENTICATION FIX VERIFICATION
 * Run this script to test the authentication fix
 */

const testResults = {
    configuration: false,
    signInTest: false,
    errorHandling: false,
    sessionManagement: false
};

console.log('🧪 Starting Supabase Authentication Fix Verification...\n');

// Test 1: Configuration Check
async function testConfiguration() {
    console.log('📋 Test 1: Supabase Configuration');

    try {
        // Wait for page to load
        if (typeof window === 'undefined') {
            console.log('⚠️  Skipping config test - not in browser environment');
            return false;
        }

        // Check if Supabase auth script loaded
        if (!window.supabaseAuth) {
            console.log('❌ Supabase auth not loaded');
            return false;
        }

        if (!window.supabaseAuth.supabase) {
            console.log('❌ Supabase client not initialized');
            return false;
        }

        console.log('✅ Supabase configuration valid');
        console.log(`   URL: ${window.supabaseAuth.supabaseUrl}`);
        console.log(`   Client: ${window.supabaseAuth.supabase ? 'Initialized' : 'Not initialized'}`);

        testResults.configuration = true;
        return true;
    } catch (error) {
        console.log(`❌ Configuration test failed: ${error.message}`);
        return false;
    }
}

// Test 2: Sign In Functionality
async function testSignIn() {
    console.log('\n🔑 Test 2: Enhanced Sign In Functionality');

    try {
        if (!window.supabaseAuth) {
            console.log('❌ Supabase auth not available');
            return false;
        }

        // Test with invalid credentials first
        console.log('Testing with invalid credentials...');
        const invalidResult = await window.supabaseAuth.signIn('invalid@test.com', 'wrongpassword');

        if (!invalidResult.success && invalidResult.error) {
            console.log('✅ Invalid credentials properly rejected');
            console.log(`   Error: ${invalidResult.error}`);
        } else {
            console.log('❌ Invalid credentials should have been rejected');
            return false;
        }

        // Test with empty credentials
        console.log('Testing with empty credentials...');
        const emptyResult = await window.supabaseAuth.signIn('', '');

        if (!emptyResult.success && emptyResult.error.includes('required')) {
            console.log('✅ Empty credentials properly rejected');
        } else {
            console.log('❌ Empty credentials should have been rejected');
            return false;
        }

        console.log('✅ Sign in functionality working correctly');
        testResults.signInTest = true;
        return true;
    } catch (error) {
        console.log(`❌ Sign in test failed: ${error.message}`);
        return false;
    }
}

// Test 3: Error Handling
async function testErrorHandling() {
    console.log('\n⚠️  Test 3: Enhanced Error Handling');

    try {
        if (!window.supabaseAuth || !window.supabaseAuth.analyzeSignInError) {
            console.log('❌ Enhanced error analysis not available');
            return false;
        }

        // Test different error types
        const testErrors = [
            { message: 'Invalid login credentials' },
            { message: 'Email not confirmed' },
            { message: 'User not found' },
            { message: 'Unknown error occurred' }
        ];

        for (const error of testErrors) {
            const analysis = window.supabaseAuth.analyzeSignInError(error, 'test@example.com');

            if (analysis && analysis.userMessage && analysis.type) {
                console.log(`✅ Error "${error.message}" analyzed correctly`);
                console.log(`   Type: ${analysis.type}`);
                console.log(`   Message: ${analysis.userMessage}`);
            } else {
                console.log(`❌ Error "${error.message}" not analyzed properly`);
                return false;
            }
        }

        console.log('✅ Error handling working correctly');
        testResults.errorHandling = true;
        return true;
    } catch (error) {
        console.log(`❌ Error handling test failed: ${error.message}`);
        return false;
    }
}

// Test 4: Session Management
async function testSessionManagement() {
    console.log('\n🔄 Test 4: Session Management');

    try {
        if (!window.supabaseAuth) {
            console.log('❌ Supabase auth not available');
            return false;
        }

        // Test clear existing session
        console.log('Testing session clearing...');
        await window.supabaseAuth.clearExistingSession();
        console.log('✅ Session clearing works');

        // Test user status check
        console.log('Testing user status check...');
        const status = await window.supabaseAuth.checkUserStatus('test@example.com');

        if (status && typeof status.exists === 'boolean') {
            console.log('✅ User status check works');
            console.log(`   Exists: ${status.exists}`);
        } else {
            console.log('❌ User status check failed');
            return false;
        }

        console.log('✅ Session management working correctly');
        testResults.sessionManagement = true;
        return true;
    } catch (error) {
        console.log(`❌ Session management test failed: ${error.message}`);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting comprehensive authentication tests...\n');

    const results = await Promise.allSettled([
        testConfiguration(),
        testSignIn(),
        testErrorHandling(),
        testSessionManagement()
    ]);

    console.log('\n📊 TEST SUMMARY:');
    console.log('================');

    Object.entries(testResults).forEach(([test, passed]) => {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        console.log(`${status} ${testName}`);
    });

    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    console.log(`\n🎯 Overall Success Rate: ${successRate}% (${passedTests}/${totalTests} tests passed)`);

    if (successRate === 100) {
        console.log('\n🎉 ALL TESTS PASSED! The authentication fix is working correctly.');
        console.log('\n📝 NEXT STEPS:');
        console.log('1. Test the login page with your actual credentials');
        console.log('2. Use the debug-auth.html page for detailed troubleshooting');
        console.log('3. Monitor the browser console for real-time debugging');
    } else {
        console.log('\n⚠️  Some tests failed. Please review the errors above.');
        console.log('📝 RECOMMENDATIONS:');
        console.log('1. Check that all JavaScript files are loaded correctly');
        console.log('2. Verify Supabase credentials are accurate');
        console.log('3. Ensure no JavaScript errors in browser console');
    }

    return successRate === 100;
}

// Export for use in browser console or testing environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runAllTests, testResults };
} else {
    // Auto-run in browser environment after a delay
    if (typeof window !== 'undefined') {
        setTimeout(() => {
            window.testAuthFix = { runAllTests, testResults };
            console.log('🔧 Authentication test suite loaded. Run testAuthFix.runAllTests() to execute tests.');
        }, 2000);
    }
}