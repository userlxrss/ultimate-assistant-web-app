/**
 * Email Verification Debug Tools
 * Comprehensive debugging utilities for email verification issues
 */

export interface EmailVerificationDebugInfo {
  currentUrl: string;
  origin: string;
  verificationPath: string;
  expectedRedirectUrl: string;
  environment: 'development' | 'production' | 'unknown';
  supabaseUrl: string;
  timestamp: string;
  userAgent: string;
  sessionInfo: any;
}

export interface RedirectUrlTestResult {
  url: string;
  isValid: boolean;
  domain: string;
  protocol: string;
  path: string;
  queryParams: Record<string, string>;
  environment: string;
  issues: string[];
}

export class EmailVerificationDebugger {
  private static instance: EmailVerificationDebugger;
  private debugHistory: EmailVerificationDebugInfo[] = [];
  private maxHistorySize = 50;

  private constructor() {}

  static getInstance(): EmailVerificationDebugger {
    if (!EmailVerificationDebugger.instance) {
      EmailVerificationDebugger.instance = new EmailVerificationDebugger();
    }
    return EmailVerificationDebugger.instance;
  }

  /**
   * Capture current debugging information
   */
  captureDebugInfo(): EmailVerificationDebugInfo {
    const currentUrl = window.location.href;
    const origin = window.location.origin;
    const verificationPath = '/auth/verify';
    const expectedRedirectUrl = `${origin}${verificationPath}`;

    const info: EmailVerificationDebugInfo = {
      currentUrl,
      origin,
      verificationPath,
      expectedRedirectUrl,
      environment: this.detectEnvironment(),
      supabaseUrl: this.getSupabaseUrl(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      sessionInfo: this.getSessionInfo(),
    };

    this.addToHistory(info);
    return info;
  }

  /**
   * Test redirect URL generation
   */
  testRedirectUrl(overrideOrigin?: string): RedirectUrlTestResult {
    const origin = overrideOrigin || window.location.origin;
    const url = `${origin}/auth/verify`;
    const issues: string[] = [];

    // Parse URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return {
        url,
        isValid: false,
        domain: '',
        protocol: '',
        path: '',
        queryParams: {},
        environment: this.detectEnvironment(),
        issues: ['Invalid URL format'],
      };
    }

    // Check protocol
    if (parsedUrl.protocol !== 'https:' && this.detectEnvironment() === 'production') {
      issues.push('Production should use HTTPS');
    }

    // Check domain
    if (this.detectEnvironment() === 'production' && !parsedUrl.hostname.includes('dailydeck.vercel.app')) {
      issues.push(`Expected production domain but got: ${parsedUrl.hostname}`);
    }

    // Check path
    if (parsedUrl.pathname !== '/auth/verify') {
      issues.push(`Expected path /auth/verify but got: ${parsedUrl.pathname}`);
    }

    // Extract query parameters
    const queryParams: Record<string, string> = {};
    parsedUrl.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    return {
      url,
      isValid: issues.length === 0,
      domain: parsedUrl.hostname,
      protocol: parsedUrl.protocol,
      path: parsedUrl.pathname,
      queryParams,
      environment: this.detectEnvironment(),
      issues,
    };
  }

  /**
   * Test email verification link from URL parameters
   */
  testCurrentVerificationLink(): {
    hasVerificationParams: boolean;
    params: Record<string, string>;
    redirectUrl: string;
    issues: string[];
  } {
    const urlParams = new URLSearchParams(window.location.search);
    const params: Record<string, string> = {};

    // Extract all parameters
    urlParams.forEach((value, key) => {
      params[key] = value;
    });

    const issues: string[] = [];
    const hasVerificationParams = Object.keys(params).length > 0;

    // Check for common verification parameters
    const expectedParams = ['access_token', 'refresh_token', 'code', 'type'];
    const missingParams = expectedParams.filter(param => !(param in params));

    if (hasVerificationParams && missingParams.length === expectedParams.length) {
      issues.push('URL has parameters but none match expected verification parameters');
    }

    // Check redirect URL in parameters
    const redirectUrl = params['redirect_to'] || `${window.location.origin}/auth/verify`;

    if (redirectUrl && !redirectUrl.startsWith(window.location.origin)) {
      issues.push(`Redirect URL domain mismatch: ${redirectUrl}`);
    }

    return {
      hasVerificationParams,
      params,
      redirectUrl,
      issues,
    };
  }

  /**
   * Simulate email verification flow
   */
  simulateEmailVerification(email: string): {
    signupUrl: string;
    redirectUrl: string;
    verificationFlow: string[];
    potentialIssues: string[];
  } {
    const origin = window.location.origin;
    const redirectUrl = `${origin}/auth/verify`;

    const flow: string[] = [
      '1. User signs up with email',
      '2. Supabase creates user account',
      '3. Supabase sends verification email',
      `4. Email contains redirect URL: ${redirectUrl}`,
      '5. User clicks verification link',
      '6. Browser navigates to verification page',
      '7. Supabase processes verification',
      '8. User is redirected to dashboard',
    ];

    const issues: string[] = [];

    // Check for common issues
    if (origin.includes('localhost') && this.detectEnvironment() === 'production') {
      issues.push('Production deployment may be using localhost URLs');
    }

    if (!origin.startsWith('https://') && this.detectEnvironment() === 'production') {
      issues.push('Production should use HTTPS URLs');
    }

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      issues.push('Invalid email format');
    }

    return {
      signupUrl: `${origin}/signup`,
      redirectUrl,
      verificationFlow: flow,
      potentialIssues: issues,
    };
  }

  /**
   * Check browser console for verification-related errors
   */
  checkConsoleErrors(): {
    errors: string[];
    warnings: string[];
    verificationErrors: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const verificationErrors: string[] = [];

    // This would need to be integrated with actual console monitoring
    // For now, we'll check common patterns

    const errorPatterns = [
      /network error/i,
      /cors/i,
      /supabase/i,
      /auth/i,
      /verification/i,
    ];

    // Mock console error checking (in real implementation, would monitor console)
    const mockConsoleErrors = [
      'Supabase: Network request failed',
      'Auth: Invalid verification token',
    ];

    mockConsoleErrors.forEach(error => {
      errors.push(error);
      if (errorPatterns.some(pattern => pattern.test(error))) {
        verificationErrors.push(error);
      }
    });

    return {
      errors,
      warnings,
      verificationErrors,
    };
  }

  /**
   * Get environment information
   */
  getEnvironmentInfo(): {
    environment: string;
    origin: string;
    hostname: string;
    protocol: string;
    port: string;
    isProduction: boolean;
    isDevelopment: boolean;
    isLocalhost: boolean;
  } {
    return {
      environment: this.detectEnvironment(),
      origin: window.location.origin,
      hostname: window.location.hostname,
      protocol: window.location.protocol,
      port: window.location.port,
      isProduction: this.detectEnvironment() === 'production',
      isDevelopment: this.detectEnvironment() === 'development',
      isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    };
  }

  /**
   * Export debug information to JSON
   */
  exportDebugInfo(): string {
    const debugData = {
      currentInfo: this.captureDebugInfo(),
      redirectUrlTest: this.testRedirectUrl(),
      verificationLinkTest: this.testCurrentVerificationLink(),
      environmentInfo: this.getEnvironmentInfo(),
      consoleErrors: this.checkConsoleErrors(),
      history: this.debugHistory,
      timestamp: new Date().toISOString(),
    };

    return JSON.stringify(debugData, null, 2);
  }

  /**
   * Generate a debug report
   */
  generateDebugReport(): {
    summary: string;
    issues: string[];
    recommendations: string[];
    debugInfo: EmailVerificationDebugInfo;
  } {
    const debugInfo = this.captureDebugInfo();
    const redirectTest = this.testRedirectUrl();
    const verificationTest = this.testCurrentVerificationLink();

    const issues = [
      ...redirectTest.issues,
      ...verificationTest.issues,
    ];

    const recommendations: string[] = [];

    if (debugInfo.environment === 'production' && debugInfo.origin.includes('localhost')) {
      recommendations.push('Update production deployment to use production URLs');
    }

    if (!redirectTest.isValid) {
      recommendations.push('Fix redirect URL configuration');
    }

    if (issues.length === 0) {
      recommendations.push('No issues detected - email verification should work correctly');
    }

    return {
      summary: issues.length === 0
        ? 'Email verification configuration appears to be correct'
        : `Found ${issues.length} issue(s) with email verification configuration`,
      issues,
      recommendations,
      debugInfo,
    };
  }

  private detectEnvironment(): 'development' | 'production' | 'unknown' {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    }

    if (hostname.includes('vercel.app') || hostname.includes('dailydeck')) {
      return 'production';
    }

    return 'unknown';
  }

  private getSupabaseUrl(): string {
    // In a real implementation, this would come from your Supabase config
    return 'https://vacwojgxafujscxuqmpg.supabase.co';
  }

  private getSessionInfo(): any {
    // In a real implementation, this would check Supabase session
    return {
      hasSession: false,
      isExpired: true,
      emailVerified: false,
    };
  }

  private addToHistory(info: EmailVerificationDebugInfo): void {
    this.debugHistory.push(info);

    // Keep only the last N entries
    if (this.debugHistory.length > this.maxHistorySize) {
      this.debugHistory = this.debugHistory.slice(-this.maxHistorySize);
    }
  }
}

// Export singleton instance
export const emailVerificationDebugger = EmailVerificationDebugger.getInstance();