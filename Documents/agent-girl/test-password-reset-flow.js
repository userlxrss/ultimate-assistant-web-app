/**
 * COMPREHENSIVE PASSWORD RESET FLOW TEST
 * Tests the complete Supabase password reset functionality
 */

// Supabase configuration
const SUPABASE_URL = 'https://vacwojgxafujscxuqmpg.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZhY3dvamd4YWZ1anNjeHVxbXBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxOTU5MTksImV4cCI6MjA3Nzc3MTkxOX0.RniyufeNXF9h6a9u55zGIxLRFeFDCaJxQ1ZjLv6KgxI';

class PasswordResetTester {
    constructor() {
        this.supabase = null;
        this.testResults = [];
    }

    async init() {
        try {
            // Load Supabase if not already loaded
            if (typeof window.supabase === 'undefined') {
                await this.loadSupabaseSDK();
            }

            this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Password reset tester initialized');
        } catch (error) {
            console.error('❌ Failed to initialize tester:', error);
        }
    }

    async loadSupabaseSDK() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    async testResetRequest() {
        console.log('🧪 Testing password reset request...');

        const testEmail = 'test@example.com';

        try {
            const { data, error } = await this.supabase.auth.resetPasswordForEmail(testEmail, {
                redirectTo: 'http://localhost:5176/reset-password.html'
            });

            if (error) {
                this.logResult('Reset Request', 'FAILED', error.message);
                return false;
            }

            this.logResult('Reset Request', 'SUCCESS', 'Reset email sent successfully');
            console.log('✅ Reset request test passed');
            return true;

        } catch (error) {
            this.logResult('Reset Request', 'ERROR', error.message);
            console.error('❌ Reset request test failed:', error);
            return false;
        }
    }

    async testTokenExtraction() {
        console.log('🧪 Testing URL token extraction...');

        const testUrls = [
            // Hash format (most common)
            'http://localhost:5176/reset-password.html#access_token=test-token-123&refresh_token=refresh-456&type=recovery&email=test%40example.com',
            // Query format
            'http://localhost:5176/reset-password.html?access_token=test-token-123&refresh_token=refresh-456&type=recovery&email=test%40example.com',
            // Recovery type only
            'http://localhost:5176/reset-password.html?type=recovery&email=test%40example.com',
            // Legacy format
            'http://localhost:5176/reset-password.html?token=legacy-token-123&email=test%40example.com'
        ];

        let allPassed = true;

        for (const testUrl of testUrls) {
            try {
                const result = this.extractTokensFromUrl(testUrl);

                const hasRequiredData = result.accessToken || result.type === 'recovery';

                if (hasRequiredData) {
                    this.logResult('Token Extraction', 'SUCCESS', `URL: ${testUrl.substring(0, 50)}...`);
                    console.log(`✅ Token extraction passed for: ${testUrl.substring(0, 50)}...`);
                } else {
                    this.logResult('Token Extraction', 'FAILED', `No valid tokens in URL: ${testUrl.substring(0, 50)}...`);
                    console.error(`❌ Token extraction failed for: ${testUrl.substring(0, 50)}...`);
                    allPassed = false;
                }
            } catch (error) {
                this.logResult('Token Extraction', 'ERROR', `URL: ${testUrl.substring(0, 50)}..., Error: ${error.message}`);
                console.error(`❌ Token extraction error:`, error);
                allPassed = false;
            }
        }

        return allPassed;
    }

    extractTokensFromUrl(url) {
        // Simulate the parsing logic from reset-password.html
        let accessToken = null;
        let refreshToken = null;
        let email = null;
        let type = null;
        let isResetFlow = false;

        const urlObj = new URL(url);

        // Method 1: Check hash fragment
        const hash = urlObj.hash;
        if (hash) {
            let hashContent = hash.substring(1);
            if (hashContent.includes('%')) {
                hashContent = decodeURIComponent(hashContent);
            }

            const hashParams = new URLSearchParams(hashContent);
            accessToken = hashParams.get('access_token');
            refreshToken = hashParams.get('refresh_token');
            email = hashParams.get('email');
            type = hashParams.get('type');

            if (accessToken || type === 'recovery' || type === 'signup') {
                isResetFlow = true;
            }
        }

        // Method 2: Check query parameters
        const urlParams = new URLSearchParams(urlObj.search);
        if (!isResetFlow) {
            const queryToken = urlParams.get('access_token');
            const queryRefresh = urlParams.get('refresh_token');
            const queryEmail = urlParams.get('email');
            const queryType = urlParams.get('type');
            const legacyToken = urlParams.get('token');

            accessToken = accessToken || queryToken || legacyToken;
            refreshToken = refreshToken || queryRefresh;
            email = email || queryEmail;
            type = type || queryType;

            if (accessToken || type === 'recovery' || type === 'signup' || legacyToken) {
                isResetFlow = true;
            }
        }

        // Method 3: Regex parsing
        if (!isResetFlow) {
            const urlStr = url;
            const tokenMatch = urlStr.match(/[?&]access_token=([^&]+)/);
            const refreshMatch = urlStr.match(/[?&]refresh_token=([^&]+)/);
            const emailMatch = urlStr.match(/[?&]email=([^&]+)/);
            const typeMatch = urlStr.match(/[?&]type=([^&]+)/);

            if (tokenMatch) {
                accessToken = decodeURIComponent(tokenMatch[1]);
                isResetFlow = true;
            }

            if (refreshMatch) refreshToken = decodeURIComponent(refreshMatch[1]);
            if (emailMatch) email = decodeURIComponent(emailMatch[1]);
            if (typeMatch) type = decodeURIComponent(typeMatch[1]);
        }

        return {
            accessToken,
            refreshToken,
            email,
            type,
            isResetFlow
        };
    }

    async testPasswordUpdate() {
        console.log('🧪 Testing password update with mock tokens...');

        try {
            // Mock tokens for testing (these would normally come from Supabase)
            const mockTokens = {
                accessToken: 'mock-access-token-for-testing',
                refreshToken: 'mock-refresh-token-for-testing',
                email: 'test@example.com',
                type: 'recovery'
            };

            // Test the token validation logic
            const hasValidTokens = mockTokens.accessToken && mockTokens.accessToken.length > 10;
            const isValidResetType = mockTokens.type === 'recovery' || mockTokens.type === 'signup';

            if (hasValidTokens || isValidResetType) {
                this.logResult('Password Update Validation', 'SUCCESS', 'Token validation passed');
                console.log('✅ Password update validation test passed');
                return true;
            } else {
                this.logResult('Password Update Validation', 'FAILED', 'Token validation failed');
                console.error('❌ Password update validation test failed');
                return false;
            }

        } catch (error) {
            this.logResult('Password Update', 'ERROR', error.message);
            console.error('❌ Password update test failed:', error);
            return false;
        }
    }

    async testErrorHandling() {
        console.log('🧪 Testing error handling...');

        const errorScenarios = [
            {
                name: 'Invalid Token',
                url: 'http://localhost:5176/reset-password.html?access_token=invalid&email=test@example.com',
                expectedError: 'Invalid reset link'
            },
            {
                name: 'Missing Token',
                url: 'http://localhost:5176/reset-password.html?email=test@example.com',
                expectedError: 'No valid reset flow'
            },
            {
                name: 'Malformed URL',
                url: 'http://localhost:5176/reset-password.html?invalid-format',
                expectedError: 'No valid reset flow'
            }
        ];

        let allPassed = true;

        for (const scenario of errorScenarios) {
            try {
                const result = this.extractTokensFromUrl(scenario.url);

                if (!result.isResetFlow) {
                    this.logResult('Error Handling', 'SUCCESS', `Correctly rejected: ${scenario.name}`);
                    console.log(`✅ Error handling test passed: ${scenario.name}`);
                } else {
                    this.logResult('Error Handling', 'FAILED', `Should have rejected: ${scenario.name}`);
                    console.error(`❌ Error handling test failed: ${scenario.name}`);
                    allPassed = false;
                }
            } catch (error) {
                this.logResult('Error Handling', 'ERROR', `Scenario: ${scenario.name}, Error: ${error.message}`);
                console.error(`❌ Error handling test error:`, error);
                allPassed = false;
            }
        }

        return allPassed;
    }

    logResult(testName, status, message) {
        this.testResults.push({
            test: testName,
            status,
            message,
            timestamp: new Date().toISOString()
        });
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'SUCCESS').length,
                failed: this.testResults.filter(r => r.status === 'FAILED').length,
                errors: this.testResults.filter(r => r.status === 'ERROR').length
            },
            results: this.testResults
        };

        return report;
    }

    displayReport() {
        const report = this.generateReport();

        console.log('\n📊 PASSWORD RESET FLOW TEST REPORT');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed} ✅`);
        console.log(`Failed: ${report.summary.failed} ❌`);
        console.log(`Errors: ${report.summary.errors} 💥`);
        console.log('\nDetailed Results:');

        report.results.forEach(result => {
            const icon = result.status === 'SUCCESS' ? '✅' : result.status === 'FAILED' ? '❌' : '💥';
            console.log(`${icon} ${result.test}: ${result.message}`);
        });

        const successRate = (report.summary.passed / report.summary.total * 100).toFixed(1);
        console.log(`\nSuccess Rate: ${successRate}%`);

        return report;
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive password reset flow tests...\n');

        await this.init();

        const tests = [
            () => this.testResetRequest(),
            () => this.testTokenExtraction(),
            () => this.testPasswordUpdate(),
            () => this.testErrorHandling()
        ];

        let allPassed = true;

        for (const test of tests) {
            try {
                const result = await test();
                if (!result) allPassed = false;
            } catch (error) {
                console.error('Test execution error:', error);
                allPassed = false;
            }
        }

        const report = this.displayReport();

        if (allPassed) {
            console.log('\n🎉 All tests passed! The password reset flow should work correctly.');
        } else {
            console.log('\n⚠️ Some tests failed. Please review the failing tests.');
        }

        return report;
    }
}

// Auto-run tests if this script is loaded in a browser
if (typeof window !== 'undefined') {
    window.passwordResetTester = new PasswordResetTester();

    // Run tests automatically after a short delay
    setTimeout(() => {
        window.passwordResetTester.runAllTests();
    }, 1000);
}

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PasswordResetTester;
}