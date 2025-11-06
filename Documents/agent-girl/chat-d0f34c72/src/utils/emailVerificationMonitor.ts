/**
 * Email Verification Production Monitor
 * Real-time monitoring and analytics for email verification performance
 */

export interface VerificationEvent {
  id: string;
  type: 'signup_start' | 'email_sent' | 'verification_click' | 'verification_success' | 'verification_failed' | 'error';
  timestamp: number;
  userId?: string;
  email?: string;
  metadata: Record<string, any>;
  errorType?: string;
  errorMessage?: string;
  userAgent: string;
  url: string;
  sessionId: string;
}

export interface VerificationMetrics {
  totalEvents: number;
  successRate: number;
  averageTimeToVerify: number;
  errorsByType: Record<string, number>;
  eventsByType: Record<string, number>;
  recentEvents: VerificationEvent[];
  performanceScore: number;
  lastUpdated: number;
}

export interface MonitoringAlert {
  id: string;
  type: 'error_spike' | 'low_success_rate' | 'slow_verification' | 'service_down';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export class EmailVerificationMonitor {
  private static instance: EmailVerificationMonitor;
  private events: VerificationEvent[] = [];
  private alerts: MonitoringAlert[] = [];
  private maxEvents = 1000;
  private sessionId: string;
  private isMonitoring = false;
  private metrics: VerificationMetrics | null = null;
  private metricsUpdateInterval: NodeJS.Timeout | null = null;
  private alertCheckInterval: NodeJS.Timeout | null = null;

  // Performance thresholds
  private thresholds = {
    successRateMin: 0.85, // 85% minimum success rate
    averageTimeToVerifyMax: 300000, // 5 minutes
    errorSpikeThreshold: 0.15, // 15% error rate spike
    serviceDownThreshold: 0.5, // 50% error rate for service down
  };

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.loadStoredData();
  }

  static getInstance(): EmailVerificationMonitor {
    if (!EmailVerificationMonitor.instance) {
      EmailVerificationMonitor.instance = new EmailVerificationMonitor();
    }
    return EmailVerificationMonitor.instance;
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.metricsUpdateInterval = setInterval(() => {
      this.updateMetrics();
    }, 30000); // Update metrics every 30 seconds

    this.alertCheckInterval = setInterval(() => {
      this.checkAlerts();
    }, 60000); // Check alerts every minute

    this.trackEvent('monitoring_started', {
      userAgent: navigator.userAgent,
      url: window.location.href,
    });

    console.log('Email verification monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    if (this.metricsUpdateInterval) {
      clearInterval(this.metricsUpdateInterval);
      this.metricsUpdateInterval = null;
    }

    if (this.alertCheckInterval) {
      clearInterval(this.alertCheckInterval);
      this.alertCheckInterval = null;
    }

    this.trackEvent('monitoring_stopped', {
      totalEvents: this.events.length,
    });

    console.log('Email verification monitoring stopped');
  }

  /**
   * Track a verification event
   */
  trackEvent(type: VerificationEvent['type'], metadata: Record<string, any> = {}): void {
    const event: VerificationEvent = {
      id: this.generateEventId(),
      type,
      timestamp: Date.now(),
      metadata,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      ...metadata,
    };

    this.events.push(event);

    // Trim events if necessary
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Store in localStorage for persistence
    this.saveToStorage();

    // Send to analytics service (in production)
    this.sendToAnalytics(event);
  }

  /**
   * Track email verification start
   */
  trackSignupStart(email: string): void {
    this.trackEvent('signup_start', { email });
  }

  /**
   * Track email sent
   */
  trackEmailSent(email: string, userId?: string): void {
    this.trackEvent('email_sent', { email, userId });
  }

  /**
   * Track verification link click
   */
  trackVerificationClick(token?: string): void {
    this.trackEvent('verification_click', { token });
  }

  /**
   * Track successful verification
   */
  trackVerificationSuccess(userId: string, email: string, timeToVerify: number): void {
    this.trackEvent('verification_success', {
      userId,
      email,
      timeToVerify,
    });
  }

  /**
   * Track verification failure
   */
  trackVerificationError(error: string, errorType: string, email?: string): void {
    this.trackEvent('verification_failed', {
      error,
      errorType,
      email,
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): VerificationMetrics {
    if (!this.metrics) {
      this.updateMetrics();
    }
    return this.metrics || this.getEmptyMetrics();
  }

  /**
   * Get recent events
   */
  getRecentEvents(limit: number = 50): VerificationEvent[] {
    return this.events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): MonitoringAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorRate: number;
    recentErrors: VerificationEvent[];
  } {
    const errorEvents = this.events.filter(event => event.type === 'verification_failed');
    const totalEvents = this.events.filter(event =>
      ['verification_success', 'verification_failed'].includes(event.type)
    );

    const errorsByType: Record<string, number> = {};
    errorEvents.forEach(event => {
      const errorType = event.metadata.errorType || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    const recentErrors = errorEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    return {
      totalErrors: errorEvents.length,
      errorsByType,
      errorRate: totalEvents.length > 0 ? errorEvents.length / totalEvents.length : 0,
      recentErrors,
    };
  }

  /**
   * Export monitoring data
   */
  exportData(): string {
    const exportData = {
      metrics: this.getMetrics(),
      events: this.events,
      alerts: this.alerts,
      errorStats: this.getErrorStats(),
      sessionId: this.sessionId,
      exportTimestamp: new Date().toISOString(),
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Clear all monitoring data
   */
  clearData(): void {
    this.events = [];
    this.alerts = [];
    this.metrics = null;
    localStorage.removeItem('email_verification_monitor');
    console.log('Monitoring data cleared');
  }

  private updateMetrics(): void {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const recentEvents = this.events.filter(event => event.timestamp > last24Hours);

    const successEvents = recentEvents.filter(event => event.type === 'verification_success');
    const failureEvents = recentEvents.filter(event => event.type === 'verification_failed');
    const totalVerificationEvents = successEvents.length + failureEvents.length;

    // Calculate success rate
    const successRate = totalVerificationEvents > 0 ? successEvents.length / totalVerificationEvents : 0;

    // Calculate average time to verify
    const verificationTimes = successEvents
      .map(event => event.metadata.timeToVerify)
      .filter(time => typeof time === 'number' && time > 0);

    const averageTimeToVerify = verificationTimes.length > 0
      ? verificationTimes.reduce((sum, time) => sum + time, 0) / verificationTimes.length
      : 0;

    // Count events by type
    const eventsByType: Record<string, number> = {};
    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    });

    // Count errors by type
    const errorsByType: Record<string, number> = {};
    failureEvents.forEach(event => {
      const errorType = event.metadata.errorType || 'unknown';
      errorsByType[errorType] = (errorsByType[errorType] || 0) + 1;
    });

    // Calculate performance score (0-100)
    const successRateScore = successRate * 50; // 50% weight
    const timeScore = averageTimeToVerify > 0 ? Math.max(0, 50 - (averageTimeToVerify / 60000) * 10) : 50; // 50% weight
    const performanceScore = Math.round(successRateScore + timeScore);

    this.metrics = {
      totalEvents: recentEvents.length,
      successRate,
      averageTimeToVerify,
      errorsByType,
      eventsByType,
      recentEvents: recentEvents.slice(0, 100),
      performanceScore,
      lastUpdated: now,
    };

    this.saveToStorage();
  }

  private checkAlerts(): void {
    if (!this.metrics) return;

    const { successRate, averageTimeToVerify, errorsByType } = this.metrics;

    // Check for low success rate
    if (successRate < this.thresholds.successRateMin) {
      this.createAlert(
        'low_success_rate',
        successRate < 0.5 ? 'critical' : 'high',
        `Email verification success rate is ${(successRate * 100).toFixed(1)}% (threshold: ${(this.thresholds.successRateMin * 100).toFixed(1)}%)`
      );
    }

    // Check for slow verification
    if (averageTimeToVerify > this.thresholds.averageTimeToVerifyMax) {
      this.createAlert(
        'slow_verification',
        'medium',
        `Average verification time is ${(averageTimeToVerify / 60000).toFixed(1)} minutes (threshold: ${(this.thresholds.averageTimeToVerifyMax / 60000).toFixed(1)} minutes)`
      );
    }

    // Check for error spikes
    const totalErrors = Object.values(errorsByType).reduce((sum, count) => sum + count, 0);
    const totalEvents = Object.values(this.metrics.eventsByType).reduce((sum, count) => sum + count, 0);
    const errorRate = totalEvents > 0 ? totalErrors / totalEvents : 0;

    if (errorRate > this.thresholds.errorSpikeThreshold) {
      this.createAlert(
        'error_spike',
        errorRate > this.thresholds.serviceDownThreshold ? 'critical' : 'high',
        `Error rate is ${(errorRate * 100).toFixed(1)}% (threshold: ${(this.thresholds.errorSpikeThreshold * 100).toFixed(1)}%)`
      );
    }
  }

  private createAlert(type: MonitoringAlert['type'], severity: MonitoringAlert['severity'], message: string): void {
    // Check if similar alert already exists and is active
    const existingAlert = this.alerts.find(alert =>
      alert.type === type &&
      !alert.resolved &&
      alert.message === message
    );

    if (existingAlert) return;

    const alert: MonitoringAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      message,
      timestamp: Date.now(),
      resolved: false,
    };

    this.alerts.push(alert);
    this.saveToStorage();

    // Log alert
    console.warn(`Email Verification Alert [${severity.toUpperCase()}]: ${message}`);

    // Send alert to monitoring service (in production)
    this.sendAlert(alert);
  }

  private sendToAnalytics(event: VerificationEvent): void {
    // In production, this would send to your analytics service
    // For now, we'll just log it
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics Event:', event);
    }
  }

  private sendAlert(alert: MonitoringAlert): void {
    // In production, this would send to your alerting service
    // For example: Sentry, DataDog, custom webhook, etc.
    if (process.env.NODE_ENV === 'development') {
      console.log('Alert triggered:', alert);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        events: this.events,
        alerts: this.alerts,
        sessionId: this.sessionId,
        lastSaved: Date.now(),
      };
      localStorage.setItem('email_verification_monitor', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save monitoring data:', error);
    }
  }

  private loadStoredData(): void {
    try {
      const stored = localStorage.getItem('email_verification_monitor');
      if (stored) {
        const data = JSON.parse(stored);
        this.events = data.events || [];
        this.alerts = data.alerts || [];
        this.sessionId = data.sessionId || this.sessionId;
      }
    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    }
  }

  private getEmptyMetrics(): VerificationMetrics {
    return {
      totalEvents: 0,
      successRate: 0,
      averageTimeToVerify: 0,
      errorsByType: {},
      eventsByType: {},
      recentEvents: [],
      performanceScore: 0,
      lastUpdated: Date.now(),
    };
  }

  private generateSessionId(): string {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  private generateEventId(): string {
    return 'event_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }

  private generateAlertId(): string {
    return 'alert_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
  }
}

// Export singleton instance
export const emailVerificationMonitor = EmailVerificationMonitor.getInstance();

// Export convenience functions
export const startMonitoring = () => emailVerificationMonitor.startMonitoring();
export const stopMonitoring = () => emailVerificationMonitor.stopMonitoring();
export const trackSignupStart = (email: string) => emailVerificationMonitor.trackSignupStart(email);
export const trackEmailSent = (email: string, userId?: string) => emailVerificationMonitor.trackEmailSent(email, userId);
export const trackVerificationClick = (token?: string) => emailVerificationMonitor.trackVerificationClick(token);
export const trackVerificationSuccess = (userId: string, email: string, timeToVerify: number) =>
  emailVerificationMonitor.trackVerificationSuccess(userId, email, timeToVerify);
export const trackVerificationError = (error: string, errorType: string, email?: string) =>
  emailVerificationMonitor.trackVerificationError(error, errorType, email);