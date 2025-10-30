import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, PenSquare, CheckSquare, Calendar, Mail, Users, Shield, Settings, X, Search, Bell, Sun, Moon, User } from 'lucide-react';
import { authManager } from './utils/authManager';
import './utils/authUtils'; // This adds debugging tools to window
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import ContactsApp from './components/contacts/ContactsApp';
import { SettingsPanelStable } from './components/SettingsStable';
import { NotificationProvider } from './components/NotificationSystem';
import { TimerProvider } from './contexts/TimerContext';
import { GoogleAuthSimple } from './components/auth/GoogleAuthSimple';
import { AuthStatusIndicator } from './components/AuthStatusIndicator';
import OAuthTestPage from './components/OAuthTestPage';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings' | 'oauth' | 'oauth-test';

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Handle authentication success
  const handleAuthSuccess = useCallback((user: any) => {
    console.log('✅ Authentication successful:', user);
    setUserInfo(user);
    setIsAuthenticated(true);
    // Redirect to dashboard after successful authentication
    setActiveModule('dashboard');
  }, []);

  // Handle authentication error
  const handleAuthError = useCallback((error: string) => {
    console.error('❌ Authentication error:', error);
  }, []);

  // Handle service disconnections with stable callbacks
  const handleGmailDisconnect = useCallback(() => {
    console.log('📧 Gmail disconnected from main app');
  }, []);

  const handleMotionDisconnect = useCallback(() => {
    console.log('🎯 Motion disconnected from main app');
  }, []);

  const handleGoogleDisconnect = useCallback(() => {
    console.log('📅 Google Calendar disconnected from main app');
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Global auth status check
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = authManager.getAuthStatus();
      console.log('🔐 Global auth status check:', authStatus);
    };

    checkAuthStatus();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'productivity_hub_auth') {
        checkAuthStatus();
      }
    };

    // Listen for tab activation to refresh components if needed
    const handleTabActivation = () => {
      console.log('🔄 Tab activated, checking component refresh needs...');
      window.dispatchEvent(new CustomEvent('tabActivated'));
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleTabActivation);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleTabActivation);
    };
  }, []);

  const handleDateRangeChange = useCallback((range: string) => {
    setDateRange(range);
  }, []);

  const handleExport = useCallback(() => {
    console.log('📊 Exporting dashboard data...');
  }, []);

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', id: 'dashboard' as ActiveModule },
    { icon: PenSquare, label: 'Journal', id: 'journal' as ActiveModule },
    { icon: CheckSquare, label: 'Tasks', id: 'tasks' as ActiveModule },
    { icon: Calendar, label: 'Calendar', id: 'calendar' as ActiveModule },
    { icon: Mail, label: 'Email', id: 'email' as ActiveModule },
    { icon: Users, label: 'Contacts', id: 'contacts' as ActiveModule },
    { icon: Shield, label: 'OAuth Test', id: 'oauth-test' as ActiveModule },
    { icon: Shield, label: 'OAuth', id: 'oauth' as ActiveModule },
    { icon: Settings, label: 'Settings', id: 'settings' as ActiveModule }
  ];

  // Memoize module rendering to prevent unnecessary re-renders
  const renderActiveModule = useCallback(() => {
    switch (activeModule) {
      case 'dashboard':
        return (
          <TimerProvider>
            <DashboardSimple />
          </TimerProvider>
        );
      case 'journal':
        return <JournalApp />;
      case 'tasks':
        return <TasksApp />;
      case 'calendar':
        return <CalendarApp />;
      case 'email':
        return <EmailApp />;
      case 'contacts':
        return <ContactsApp />;
      case 'oauth-test':
        return <OAuthTestPage />;
      case 'oauth':
        return (
          <div className="p-6">
            <GoogleAuthSimple
              onAuthSuccess={handleAuthSuccess}
              onAuthError={handleAuthError}
              serverUrl="http://localhost:3006"
            />
          </div>
        );
      case 'settings':
        return (
          <SettingsPanelStable
            onDateRangeChange={handleDateRangeChange}
            dateRange={dateRange}
            onExport={handleExport}
            onGmailDisconnect={handleGmailDisconnect}
            onMotionDisconnect={handleMotionDisconnect}
            onGoogleDisconnect={handleGoogleDisconnect}
            darkMode={darkMode}
            onToggleDarkMode={toggleDarkMode}
          />
        );
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Module Not Found</h2>
            <p className="text-gray-600">The requested module could not be loaded.</p>
          </div>
        );
    }
  }, [activeModule, handleAuthSuccess, handleAuthError, handleDateRangeChange, dateRange, handleExport, handleGmailDisconnect, handleMotionDisconnect, handleGoogleDisconnect, darkMode, toggleDarkMode]);

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-white border-r border-gray-200 transition-all duration-300 ease-in-out flex flex-col`}>
          {/* Logo/Brand */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              {sidebarOpen && (
                <span className="font-semibold text-gray-900">Productivity Hub</span>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {item.id === 'oauth' && (
                    <span className="ml-auto">
                      {isAuthenticated ? (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      ) : (
                        <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth Status */}
          {sidebarOpen && (
            <div className="p-4 border-t border-gray-200">
              <AuthStatusIndicator />
            </div>
          )}

          {/* Sidebar Toggle */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center px-3 py-2 text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
            >
              <X className={`w-5 h-5 transform transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white flex flex-col">
          {/* Welcome Header */}
          <header className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {isAuthenticated ? `Welcome back, ${userInfo?.name || 'User'}! 👋` : 'Welcome! 👋'}
                </h2>
                <p className="text-gray-500">
                  {activeModule === 'dashboard' && `Here's your productivity overview for last ${dateRange} days`}
                  {activeModule === 'journal' && 'Track your thoughts and emotions'}
                  {activeModule === 'tasks' && 'Manage your tasks and projects'}
                  {activeModule === 'calendar' && 'Schedule and organize your events'}
                  {activeModule === 'email' && 'Manage your communications'}
                  {activeModule === 'contacts' && 'Organize your network'}
                  {activeModule === 'oauth-test' && 'Test the OAuth 2.0 authentication system'}
                  {activeModule === 'oauth' && isAuthenticated ? 'Manage your Google account connections' : 'Connect your Google account'}
                  {activeModule === 'settings' && 'Configure your preferences'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Header Icons */}
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <Sun className="w-5 h-5" />
                </button>

                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* Module Content */}
          <div className="flex-1 overflow-y-auto">
            {renderActiveModule()}
          </div>
        </main>
      </div>
    </NotificationProvider>
  );
};

export default MainApp;