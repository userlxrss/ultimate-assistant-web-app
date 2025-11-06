/**
 * Email Verification Monitoring Dashboard
 * Real-time monitoring dashboard for email verification performance
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  TrendingUp,
  Users,
  Mail,
  XCircle,
  BarChart3,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react';
import {
  emailVerificationMonitor,
  VerificationMetrics,
  MonitoringAlert,
  VerificationEvent
} from '../../utils/emailVerificationMonitor';

export const EmailVerificationMonitoringDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<VerificationMetrics | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [recentEvents, setRecentEvents] = useState<VerificationEvent[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'alerts'>('overview');

  const refreshData = () => {
    setMetrics(emailVerificationMonitor.getMetrics());
    setAlerts(emailVerificationMonitor.getActiveAlerts());
    setRecentEvents(emailVerificationMonitor.getRecentEvents(20));
    setLastUpdated(new Date());
  };

  const toggleMonitoring = () => {
    if (isMonitoring) {
      emailVerificationMonitor.stopMonitoring();
      setIsMonitoring(false);
    } else {
      emailVerificationMonitor.startMonitoring();
      setIsMonitoring(true);
    }
  };

  const exportData = () => {
    const data = emailVerificationMonitor.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `email-verification-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearData = () => {
    if (confirm('Are you sure you want to clear all monitoring data?')) {
      emailVerificationMonitor.clearData();
      refreshData();
    }
  };

  const resolveAlert = (alertId: string) => {
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      refreshData();
    }
  };

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setIsMonitoring(true);
    emailVerificationMonitor.startMonitoring();
    return () => {
      emailVerificationMonitor.stopMonitoring();
    };
  }, []);

  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
  const highAlerts = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Activity className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Verification Monitor</h1>
              <p className="text-gray-600 mt-1">Real-time monitoring and analytics for email verification performance</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center ${
              isMonitoring ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${isMonitoring ? 'bg-green-500' : 'bg-gray-400'}`} />
              {isMonitoring ? 'Monitoring' : 'Stopped'}
            </div>
            <button
              onClick={toggleMonitoring}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                isMonitoring
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isMonitoring ? 'Stop' : 'Start'} Monitoring
            </button>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
        <div className="text-sm text-gray-500 mt-2">
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      </div>

      {/* Alert Summary */}
      {(criticalAlerts > 0 || highAlerts > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <span className="font-medium text-red-900">
              {criticalAlerts > 0 && `${criticalAlerts} critical${criticalAlerts > 1 ? 's' : ''}`}
              {criticalAlerts > 0 && highAlerts > 0 && ' and '}
              {highAlerts > 0 && `${highAlerts} high${highAlerts > 1 ? 's' : ''}`} alert{criticalAlerts + highAlerts > 1 ? 's' : ''} require attention
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'events'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Recent Events
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'alerts'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Alerts
              {alerts.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                  {alerts.length}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Success Rate */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.performanceScore)}`}>
                    {(metrics.successRate * 100).toFixed(1)}%
                  </p>
                </div>
                <CheckCircle className={`w-8 h-8 ${getPerformanceColor(metrics.performanceScore)}`} />
              </div>
            </div>

            {/* Total Events */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.totalEvents}</p>
                </div>
                <Activity className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            {/* Average Time to Verify */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Verification Time</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatDuration(metrics.averageTimeToVerify)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
            </div>

            {/* Performance Score */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Performance Score</p>
                  <p className={`text-2xl font-bold ${getPerformanceColor(metrics.performanceScore)}`}>
                    {metrics.performanceScore}/100
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${getPerformanceColor(metrics.performanceScore)}`} />
              </div>
            </div>
          </div>

          {/* Event Types and Error Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Event Types */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Types</h3>
              <div className="space-y-3">
                {Object.entries(metrics.eventsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center">
                      {type === 'verification_success' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                      {type === 'verification_failed' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
                      {type === 'email_sent' && <Mail className="w-4 h-4 text-blue-500 mr-2" />}
                      {type === 'signup_start' && <Users className="w-4 h-4 text-purple-500 mr-2" />}
                      {type === 'verification_click' && <Eye className="w-4 h-4 text-yellow-500 mr-2" />}
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-sm text-gray-900 font-semibold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Error Breakdown */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Types</h3>
              {Object.keys(metrics.errorsByType).length > 0 ? (
                <div className="space-y-3">
                  {Object.entries(metrics.errorsByType).map(([errorType, count]) => (
                    <div key={errorType} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-700 capitalize">
                          {errorType.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-sm text-red-600 font-semibold">{count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No errors in the last 24 hours</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Events Tab */}
      {activeTab === 'events' && (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
            <p className="text-sm text-gray-600 mt-1">Latest verification events in chronological order</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {event.type === 'verification_success' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
                        {event.type === 'verification_failed' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
                        {event.type === 'email_sent' && <Mail className="w-4 h-4 text-blue-500 mr-2" />}
                        {event.type === 'signup_start' && <Users className="w-4 h-4 text-purple-500 mr-2" />}
                        {event.type === 'verification_click' && <Eye className="w-4 h-4 text-yellow-500 mr-2" />}
                        <span className="text-sm text-gray-900 capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {event.email || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate">
                        {event.metadata.errorType && (
                          <span className="text-red-600">Error: {event.metadata.errorType}</span>
                        )}
                        {event.metadata.timeToVerify && (
                          <span>Time: {formatDuration(event.metadata.timeToVerify)}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-6">
          {/* Alert Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Active Alerts</h3>
              <div className="flex space-x-3">
                <button
                  onClick={exportData}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </button>
                <button
                  onClick={clearData}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear Data
                </button>
              </div>
            </div>
          </div>

          {/* Alerts List */}
          {alerts.length > 0 ? (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <AlertTriangle className="w-5 h-5 mr-3 mt-0.5" />
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium capitalize mr-2">{alert.type.replace(/_/g, ' ')}</span>
                          <span className="px-2 py-1 text-xs rounded-full bg-white bg-opacity-60 capitalize">
                            {alert.severity}
                          </span>
                        </div>
                        <p className="text-sm mt-1">{alert.message}</p>
                        <p className="text-xs mt-2 opacity-75">
                          {formatTimestamp(alert.timestamp)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 text-xs bg-white bg-opacity-60 rounded-md hover:bg-opacity-80 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
              <p className="text-sm text-gray-600">All systems are operating normally</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};