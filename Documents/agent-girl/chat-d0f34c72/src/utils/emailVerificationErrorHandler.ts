/**
 * Email Verification Error Handler
 * Comprehensive error handling for email verification issues
 */

export enum EmailVerificationErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  EXPIRED_LINK = 'EXPIRED_LINK',
  INVALID_TOKEN = 'INVALID_TOKEN',
  ALREADY_VERIFIED = 'ALREADY_VERIFIED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CORS_ERROR = 'CORS_ERROR',
  SUPABASE_ERROR = 'SUPABASE_ERROR',
  BROWSER_ERROR = 'BROWSER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface EmailVerificationError {
  type: EmailVerificationErrorType;
  message: string;
  userMessage: string;
  technicalMessage: string;
  code?: string;
  canRetry: boolean;
  suggestedActions: string[];
  retryDelay?: number; // in milliseconds
  maxRetries?: number;
}

export interface ErrorHandlingOptions {
  enableRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  enableLogging: boolean;
  enableUserFeedback: boolean;
}

export class EmailVerificationErrorHandler {
  private static instance: EmailVerificationErrorHandler;
  private options: ErrorHandlingOptions;
  private retryCount = new Map<string, number>();
  private lastRetryTime = new Map<string, number>();

  private constructor(options: Partial<ErrorHandlingOptions> = {}) {
    this.options = {
      enableRetry: true,
      maxRetries: 3,
      retryDelay: 1000,
      enableLogging: true,
      enableUserFeedback: true,
      ...options,
    };
  }

  static getInstance(options?: Partial<ErrorHandlingOptions>): EmailVerificationErrorHandler {
    if (!EmailVerificationErrorHandler.instance) {
      EmailVerificationErrorHandler.instance = new EmailVerificationErrorHandler(options);
    }
    return EmailVerificationErrorHandler.instance;
  }

  /**
   * Handle email verification errors
   */
  handleError(error: any, context?: string): EmailVerificationError {
    const errorType = this.classifyError(error);
    const errorDetails = this.createErrorDetails(errorType, error, context);

    this.logError(errorDetails, error);
    this.trackError(errorDetails);

    return errorDetails;
  }

  /**
   * Check if operation can be retried
   */
  canRetry(operationId: string, error: EmailVerificationError): boolean {
    if (!this.options.enableRetry || !error.canRetry) {
      return false;
    }

    const currentRetries = this.retryCount.get(operationId) || 0;
    const lastRetry = this.lastRetryTime.get(operationId) || 0;
    const now = Date.now();

    // Check max retries
    if (currentRetries >= (error.maxRetries || this.options.maxRetries)) {
      return false;
    }

    // Check retry delay
    const timeSinceLastRetry = now - lastRetry;
    const requiredDelay = error.retryDelay || this.options.retryDelay;

    return timeSinceLastRetry >= requiredDelay;
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry<T>(
    operationId: string,
    operation: () => Promise<T>,
    errorHandler?: (error: EmailVerificationError) => void
  ): Promise<T> {
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryCount.delete(operationId);
      this.lastRetryTime.delete(operationId);
      return result;
    } catch (error) {
      const errorDetails = this.handleError(error, operationId);

      if (errorHandler) {
        errorHandler(errorDetails);
      }

      if (this.canRetry(operationId, errorDetails)) {
        const currentRetries = this.retryCount.get(operationId) || 0;
        this.retryCount.set(operationId, currentRetries + 1);
        this.lastRetryTime.set(operationId, Date.now());

        // Wait before retrying
        const delay = errorDetails.retryDelay || this.options.retryDelay;
        await this.delay(delay);

        return this.executeWithRetry(operationId, operation, errorHandler);
      }

      throw errorDetails;
    }
  }

  /**
   * Get user-friendly error message based on error type
   */
  getUserMessage(errorType: EmailVerificationErrorType, context?: string): string {
    const messages = {
      [EmailVerificationErrorType.NETWORK_ERROR]:
        'Unable to connect to the server. Please check your internet connection and try again.',

      [EmailVerificationErrorType.EXPIRED_LINK]:
        'This verification link has expired. Please request a new verification email.',

      [EmailVerificationErrorType.INVALID_TOKEN]:
        'This verification link is invalid or has already been used. Please request a new verification email.',

      [EmailVerificationErrorType.ALREADY_VERIFIED]:
        'Your email has already been verified. You can proceed to log in.',

      [EmailVerificationErrorType.USER_NOT_FOUND]:
        'No account found with this email address. Please sign up first.',

      [EmailVerificationErrorType.EMAIL_ALREADY_IN_USE]:
        'This email address is already registered. Please try logging in instead.',

      [EmailVerificationErrorType.RATE_LIMIT_EXCEEDED]:
        'Too many attempts. Please wait a few minutes before trying again.',

      [EmailVerificationErrorType.CORS_ERROR]:
        'Security configuration issue. Please contact support if this problem persists.',

      [EmailVerificationErrorType.SUPABASE_ERROR]:
        'Service temporarily unavailable. Please try again in a few minutes.',

      [EmailVerificationErrorType.BROWSER_ERROR]:
        'Browser compatibility issue. Please try using a different browser or updating your current browser.',

      [EmailVerificationErrorType.UNKNOWN_ERROR]:
        'An unexpected error occurred. Please try again or contact support if the problem persists.',
    };

    return messages[errorType] || messages[EmailVerificationErrorType.UNKNOWN_ERROR];
  }

  /**
   * Get suggested actions for error type
   */
  getSuggestedActions(errorType: EmailVerificationErrorType): string[] {
    const actions = {
      [EmailVerificationErrorType.NETWORK_ERROR]: [
        'Check your internet connection',
        'Try refreshing the page',
        'Try again in a few minutes',
        'Contact your internet service provider if issues persist',
      ],

      [EmailVerificationErrorType.EXPIRED_LINK]: [
        'Request a new verification email',
        'Check your spam folder',
        'Add our email address to your contacts',
      ],

      [EmailVerificationErrorType.INVALID_TOKEN]: [
        'Request a new verification email',
        'Make sure you clicked the most recent verification email',
        'Avoid clicking old verification links',
      ],

      [EmailVerificationErrorType.ALREADY_VERIFIED]: [
        'Proceed to log in with your credentials',
        'Reset your password if you don\'t remember it',
      ],

      [EmailVerificationErrorType.USER_NOT_FOUND]: [
        'Sign up for a new account',
        'Check for typos in your email address',
        'Contact support if you believe this is an error',
      ],

      [EmailVerificationErrorType.EMAIL_ALREADY_IN_USE]: [
        'Try logging in with your password',
        'Use the "Forgot Password" option',
        'Sign up with a different email address',
      ],

      [EmailVerificationErrorType.RATE_LIMIT_EXCEEDED]: [
        'Wait 5-10 minutes before trying again',
        'Avoid clicking multiple times',
        'Check if you have multiple tabs open',
      ],

      [EmailVerificationErrorType.CORS_ERROR]: [
        'Contact support about this issue',
        'Try using a different browser',
        'Clear your browser cache and cookies',
      ],

      [EmailVerificationErrorType.SUPABASE_ERROR]: [
        'Try again in a few minutes',
        'Check our status page for service updates',
        'Contact support if the problem persists',
      ],

      [EmailVerificationErrorType.BROWSER_ERROR]: [
        'Update your browser to the latest version',
        'Try using Chrome, Firefox, or Safari',
        'Disable browser extensions temporarily',
        'Clear your browser cache',
      ],

      [EmailVerificationErrorType.UNKNOWN_ERROR]: [
        'Try refreshing the page',
        'Clear your browser cache',
        'Try using a different browser',
        'Contact support with error details',
      ],
    };

    return actions[errorType] || actions[EmailVerificationErrorType.UNKNOWN_ERROR];
  }

  private classifyError(error: any): EmailVerificationErrorType {
    if (!error) {
      return EmailVerificationErrorType.UNKNOWN_ERROR;
    }

    // Network-related errors
    if (error.name === 'NetworkError' || error.message?.includes('network') || error.message?.includes('fetch')) {
      return EmailVerificationErrorType.NETWORK_ERROR;
    }

    // Supabase specific errors
    if (error.message?.includes('Invalid token') || error.message?.includes('verification failed')) {
      return EmailVerificationErrorType.INVALID_TOKEN;
    }

    if (error.message?.includes('Email not confirmed') || error.message?.includes('Email confirmation')) {
      return EmailVerificationErrorType.EXPIRED_LINK;
    }

    if (error.message?.includes('User already registered') || error.message?.includes('duplicate')) {
      return EmailVerificationErrorType.EMAIL_ALREADY_IN_USE;
    }

    if (error.message?.includes('User not found') || error.message?.includes('Invalid login')) {
      return EmailVerificationErrorType.USER_NOT_FOUND;
    }

    if (error.message?.includes('Rate limit') || error.message?.includes('too many requests')) {
      return EmailVerificationErrorType.RATE_LIMIT_EXCEEDED;
    }

    if (error.message?.includes('CORS') || error.message?.includes('cross-origin')) {
      return EmailVerificationErrorType.CORS_ERROR;
    }

    // Browser specific errors
    if (error.name === 'TypeError' && error.message?.includes('window')) {
      return EmailVerificationErrorType.BROWSER_ERROR;
    }

    return EmailVerificationErrorType.UNKNOWN_ERROR;
  }

  private createErrorDetails(
    errorType: EmailVerificationErrorType,
    originalError: any,
    context?: string
  ): EmailVerificationError {
    const userMessage = this.getUserMessage(errorType, context);
    const suggestedActions = this.getSuggestedActions(errorType);

    // Determine if error is retryable
    const retryableErrors = [
      EmailVerificationErrorType.NETWORK_ERROR,
      EmailVerificationErrorType.SUPABASE_ERROR,
      EmailVerificationErrorType.RATE_LIMIT_EXCEEDED,
    ];

    const canRetry = retryableErrors.includes(errorType);

    // Set retry parameters
    let retryDelay = this.options.retryDelay;
    let maxRetries = this.options.maxRetries;

    if (errorType === EmailVerificationErrorType.RATE_LIMIT_EXCEEDED) {
      retryDelay = 60000; // 1 minute for rate limit
      maxRetries = 2; // Fewer retries for rate limit
    } else if (errorType === EmailVerificationErrorType.NETWORK_ERROR) {
      retryDelay = 5000; // 5 seconds for network errors
    }

    return {
      type: errorType,
      message: userMessage,
      userMessage,
      technicalMessage: originalError?.message || 'Unknown error occurred',
      code: originalError?.code,
      canRetry,
      suggestedActions,
      retryDelay,
      maxRetries,
    };
  }

  private logError(errorDetails: EmailVerificationError, originalError: any): void {
    if (!this.options.enableLogging) return;

    const logData = {
      type: errorDetails.type,
      message: errorDetails.message,
      technicalMessage: errorDetails.technicalMessage,
      code: errorDetails.code,
      canRetry: errorDetails.canRetry,
      timestamp: new Date().toISOString(),
      originalError: originalError,
    };

    console.error('Email Verification Error:', logData);
  }

  private trackError(errorDetails: EmailVerificationError): void {
    // In a real implementation, this would send error data to analytics service
    // For now, we'll just store in localStorage for debugging
    try {
      const errorHistory = JSON.parse(localStorage.getItem('email_verification_errors') || '[]');
      errorHistory.push({
        ...errorDetails,
        timestamp: new Date().toISOString(),
      });

      // Keep only last 50 errors
      if (errorHistory.length > 50) {
        errorHistory.splice(0, errorHistory.length - 50);
      }

      localStorage.setItem('email_verification_errors', JSON.stringify(errorHistory));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error history from localStorage
   */
  getErrorHistory(): any[] {
    try {
      return JSON.parse(localStorage.getItem('email_verification_errors') || '[]');
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    localStorage.removeItem('email_verification_errors');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<EmailVerificationErrorType, number>;
    recentErrors: any[];
  } {
    const errors = this.getErrorHistory();
    const errorsByType: Record<EmailVerificationErrorType, number> = {} as any;

    // Initialize counters
    Object.values(EmailVerificationErrorType).forEach(type => {
      errorsByType[type] = 0;
    });

    // Count errors by type
    errors.forEach(error => {
      if (error.type in errorsByType) {
        errorsByType[error.type]++;
      }
    });

    // Get recent errors (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentErrors = errors.filter(error =>
      new Date(error.timestamp) > oneDayAgo
    );

    return {
      totalErrors: errors.length,
      errorsByType,
      recentErrors,
    };
  }
}

// Export singleton instance
export const emailVerificationErrorHandler = EmailVerificationErrorHandler.getInstance();

// Export convenience functions
export const handleEmailVerificationError = (error: any, context?: string): EmailVerificationError => {
  return emailVerificationErrorHandler.handleError(error, context);
};

export const executeWithRetry = async <T>(
  operationId: string,
  operation: () => Promise<T>,
  errorHandler?: (error: EmailVerificationError) => void
): Promise<T> => {
  return emailVerificationErrorHandler.executeWithRetry(operationId, operation, errorHandler);
};