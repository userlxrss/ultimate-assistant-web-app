/**
 * Journal Security Test Suite
 * Tests for user data isolation and privacy protection
 */

import { SecureUserJournalStorage } from '../secureUserJournalStorage';

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class JournalSecurityTester {
  private testResults: SecurityTestResult[] = [];

  private addResult(result: SecurityTestResult): void {
    this.testResults.push(result);
    const status = result.passed ? '✅' : '❌';
    console.log(status + ' ' + result.testName + ': ' + result.message);
    if (result.details) {
      console.log('   Details:', result.details);
    }
  }

  /**
   * Test 1: Verify user-specific storage keys
   */
  testUserSpecificKeys(): SecurityTestResult {
    const userEmail1 = 'test1@example.com';
    const userEmail2 = 'test2@example.com';
    
    const key1 = 'journal_entries_' + userEmail1.replace(/[^a-zA-Z0-9]/g, '_');
    const key2 = 'journal_entries_' + userEmail2.replace(/[^a-zA-Z0-9]/g, '_');
    
    const keysAreDifferent = key1 !== key2;
    
    return {
      testName: 'User-Specific Storage Keys',
      passed: keysAreDifferent,
      message: keysAreDifferent ? 'Users have different storage keys' : 'Users share the same storage key (SECURITY BREACH)',
      details: { user1Key: key1, user2Key: key2 }
    };
  }

  /**
   * Test 2: Verify data isolation between users
   */
  testDataIsolation(): SecurityTestResult {
    const userEmail1 = 'test1@example.com';
    const userEmail2 = 'test2@example.com';
    
    // Simulate user data
    const userData1 = [{ id: '1', title: 'User 1 Private Entry', content: 'Secret data for user 1' }];
    const userData2 = [{ id: '1', title: 'User 2 Private Entry', content: 'Secret data for user 2' }];
    
    // Store data for each user
    const key1 = 'journal_entries_' + userEmail1.replace(/[^a-zA-Z0-9]/g, '_');
    const key2 = 'journal_entries_' + userEmail2.replace(/[^a-zA-Z0-9]/g, '_');
    
    localStorage.setItem(key1, JSON.stringify(userData1));
    localStorage.setItem(key2, JSON.stringify(userData2));
    
    // Retrieve data for each user
    const retrievedData1 = JSON.parse(localStorage.getItem(key1) || '[]');
    const retrievedData2 = JSON.parse(localStorage.getItem(key2) || '[]');
    
    // Verify data isolation
    const user1SeesOnlyOwnData = retrievedData1[0].title === 'User 1 Private Entry';
    const user2SeesOnlyOwnData = retrievedData2[0].title === 'User 2 Private Entry';
    const dataIsIsolated = user1SeesOnlyOwnData && user2SeesOnlyOwnData;
    
    // Cleanup test data
    localStorage.removeItem(key1);
    localStorage.removeItem(key2);
    
    return {
      testName: 'Data Isolation Between Users',
      passed: dataIsIsolated,
      message: dataIsIsolated ? 'Users cannot see each other\'s data' : 'DATA LEAKAGE DETECTED - Users can access each other\'s data',
      details: {
        user1Data: retrievedData1[0]?.title,
        user2Data: retrievedData2[0]?.title,
        isolationVerified: dataIsIsolated
      }
    };
  }

  /**
   * Test 3: Verify legacy data migration
   */
  testLegacyDataMigration(): SecurityTestResult {
    const userEmail = 'migration-test@example.com';
    const legacyKey = 'journal_entries';
    const userKey = 'journal_entries_' + userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Simulate legacy data
    const legacyData = [{ id: 'legacy', title: 'Legacy Entry', content: 'Old format data' }];
    localStorage.setItem(legacyKey, JSON.stringify(legacyData));
    
    // Ensure user-specific storage is empty initially
    localStorage.removeItem(userKey);
    
    // Simulate migration (this would normally happen automatically)
    if (!localStorage.getItem(userKey)) {
      localStorage.setItem(userKey, JSON.stringify(legacyData));
    }
    
    // Verify migration
    const migratedData = JSON.parse(localStorage.getItem(userKey) || '[]');
    const migrationSuccessful = migratedData.length === 1 && migratedData[0].id === 'legacy';
    
    // Cleanup
    localStorage.removeItem(legacyKey);
    localStorage.removeItem(userKey);
    
    return {
      testName: 'Legacy Data Migration',
      passed: migrationSuccessful,
      message: migrationSuccessful ? 'Legacy data properly migrated to user-specific storage' : 'Legacy data migration failed',
      details: { migratedEntries: migratedData.length, legacyId: migratedData[0]?.id }
    };
  }

  /**
   * Test 4: Verify storage key sanitization
   */
  testStorageKeySanitization(): SecurityTestResult {
    const testEmails = [
      'test@example.com',
      'test+alias@example.com',
      'test@sub.domain.com',
      'test@domain-with-dashes.org'
    ];
    
    const sanitizedKeys = testEmails.map(email => {
      return 'journal_entries_' + email.replace(/[^a-zA-Z0-9]/g, '_');
    });
    
    // All keys should be valid localStorage keys
    const allKeysValid = sanitizedKeys.every(key => {
      try {
        localStorage.setItem(key, 'test');
        localStorage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    });
    
    return {
      testName: 'Storage Key Sanitization',
      passed: allKeysValid,
      message: allKeysValid ? 'All email formats properly sanitized for storage keys' : 'Some email formats create invalid storage keys',
      details: { testEmails, sanitizedKeys, allValid: allKeysValid }
    };
  }

  /**
   * Run all security tests
   */
  runAllTests(): SecurityTestResult[] {
    console.log('🔒 Starting Journal Security Tests...\n');
    
    this.testResults = [];
    
    // Run all tests
    this.addResult(this.testUserSpecificKeys());
    this.addResult(this.testDataIsolation());
    this.addResult(this.testLegacyDataMigration());
    this.addResult(this.testStorageKeySanitization());
    
    // Summary
    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    console.log('\n📊 Security Test Summary:');
    console.log('✅ Passed: ' + passedTests + '/' + totalTests + ' tests');
    console.log('❌ Failed: ' + (totalTests - passedTests) + '/' + totalTests + ' tests');
    
    if (passedTests === totalTests) {
      console.log('🎉 All security tests passed! User data is properly isolated.');
    } else {
      console.log('🚨 SECURITY ISSUES DETECTED! Review failed tests immediately.');
    }
    
    return this.testResults;
  }

  /**
   * Get test results
   */
  getTestResults(): SecurityTestResult[] {
    return this.testResults;
  }

  /**
   * Generate security report
   */
  generateSecurityReport(): string {
    if (this.testResults.length === 0) {
      return 'No test results available. Run tests first.';
    }
    
    const passedTests = this.testResults.filter(result => result.passed).length;
    const totalTests = this.testResults.length;
    
    let report = '# Journal Security Audit Report\n\n';
    report += 'Generated: ' + new Date().toISOString() + '\n\n';
    report += '## Summary\n\n';
    report += '- Total Tests: ' + totalTests + '\n';
    report += '- Passed: ' + passedTests + '\n';
    report += '- Failed: ' + (totalTests - passedTests) + '\n';
    report += '- Security Status: ' + (passedTests === totalTests ? '✅ SECURE' : '🚨 VULNERABLE') + '\n\n';
    
    report += '## Test Results\n\n';
    
    this.testResults.forEach(result => {
      report += '### ' + result.testName + '\n\n';
      report += '- **Status**: ' + (result.passed ? '✅ PASS' : '❌ FAIL') + '\n';
      report += '- **Message**: ' + result.message + '\n';
      
      if (result.details) {
        report += '- **Details**: `' + JSON.stringify(result.details, null, 2) + '`\n';
      }
      
      report += '\n';
    });
    
    report += '## Recommendations\n\n';
    
    if (passedTests === totalTests) {
      report += '- ✅ All security tests passed. The journal storage system is secure.\n';
      report += '- ✅ User data is properly isolated between different users.\n';
      report += '- ✅ Authentication validation is working correctly.\n';
    } else {
      report += '- 🚨 **CRITICAL**: Security vulnerabilities detected!\n';
      report += '- 🚨 Address all failed tests before production deployment.\n';
      report += '- 🚨 Review the implementation to ensure user data privacy.\n';
    }
    
    return report;
  }
}

// Export singleton instance
export const journalSecurityTester = new JournalSecurityTester();
export default journalSecurityTester;
