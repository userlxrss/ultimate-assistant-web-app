import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, PenSquare, CheckSquare, Calendar, Mail, Users, Shield, Settings, X, Search, Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { authManager } from './utils/authManager';
import './utils/authUtils'; // This adds debugging tools to window
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import ContactsApp from './components/contacts/ContactsApp';
import CleanSettingsPage from './components/CleanSettingsPage';
import { NotificationProvider } from './components/NotificationSystem';
import { TimerProvider } from './contexts/TimerContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { GoogleAuthSimple } from './components/auth/GoogleAuthSimple';
import { AuthStatusIndicator } from './components/AuthStatusIndicator';
import OAuthTestPage from './components/OAuthTestPage';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings';

const MainAppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);

  // Profile dropdown state
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // Profile dropdown handlers
  const handleProfileClick = useCallback(() => {
    setShowProfileDropdown(prev => !prev);
  }, []);

  const handleSignOut = useCallback(() => {
    console.log('🚪 Signing out...');
    setIsAuthenticated(false);
    setUserInfo(null);
    setShowProfileDropdown(false);
    // Clear auth data
    localStorage.removeItem('productivity_hub_auth');
  }, []);

  const handleMenuNavigation = useCallback((destination: string) => {
    setShowProfileDropdown(false);

    switch (destination) {
      case 'profile':
        setActiveModule('settings');
        // You could add state management to navigate to specific settings tab
        break;
      case 'appearance':
        toggleTheme();
        break;
      default:
        break;
    }
  }, [toggleTheme]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => document.removeEventListener('keydown', handleEscapeKey);
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
      case 'settings':
        return <CleanSettingsPage />;
      default:
        return (
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Module Not Found</h2>
            <p className="text-gray-600">The requested module could not be loaded.</p>
          </div>
        );
    }
  }, [activeModule, handleDateRangeChange, dateRange, handleExport, handleGmailDisconnect, handleMotionDisconnect, handleGoogleDisconnect]);

  return (
    <NotificationProvider>
      <div className={`flex h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar - Enhanced with Premium Polish */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 ease-in-out flex flex-col shadow-lg`}>
          {/* Logo/Brand - Enhanced */}
          <div className={`p-4 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md transform transition-transform hover:scale-105">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              {sidebarOpen && (
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Productivity Hub</span>
              )}
            </div>
          </div>

          {/* Navigation - Enhanced with Premium Effects */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} px-3 py-3 rounded-xl transition-all duration-200 relative group ${
                    isActive
                      ? theme === "dark"
                        ? 'bg-gradient-to-r from-blue-900/30 to-indigo-900/30 text-blue-400 shadow-md border border-blue-600/50'
                        : 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 shadow-md border border-blue-200'
                      : theme === "dark"
                        ? 'text-gray-400 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:text-gray-200 hover:shadow-sm hover:border hover:border-gray-600'
                        : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:text-gray-900 hover:shadow-sm hover:border hover:border-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                  {sidebarOpen && (
                    <span className="font-medium">{item.label}</span>
                  )}
                  {/* Premium glow effect for active items */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-sm -z-10"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Auth Status - REMOVED */}
          {/* {sidebarOpen && (
            <div className={`p-4 border-t ${theme === "dark" ? 'border-gray-700' : 'border-gray-200'}`}>
              <AuthStatusIndicator />
            </div>
          )} */}

          {/* Sidebar Toggle - Enhanced */}
          <div className={`p-4 border-t ${theme === "dark" ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-full flex items-center justify-center px-3 py-3 ${
                theme === "dark"
                  ? 'text-gray-400 hover:bg-gradient-to-r hover:from-gray-800/50 hover:to-gray-700/50 hover:text-gray-200 hover:border-gray-600'
                  : 'text-gray-600 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white hover:text-gray-900 hover:border-gray-200'
              } rounded-xl transition-all duration-200 border border-transparent hover:shadow-sm group`}
            >
              <X className={`w-5 h-5 transform transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''} group-hover:scale-110`} />
            </button>
          </div>
        </aside>

        {/* Main Content Area - Enhanced with Premium Polish */}
        <main className={`flex-1 ${theme === "dark" ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-white to-gray-50'} flex flex-col`}>
          {/* Welcome Header - Enhanced */}
          <header className={`p-6 border-b ${theme === "dark" ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'} backdrop-blur-sm`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold mb-1 bg-gradient-to-r ${
                  theme === "dark"
                    ? 'from-gray-100 to-gray-300 text-transparent bg-clip-text'
                    : 'from-gray-900 to-gray-700 text-transparent bg-clip-text'
                }`}>
                  {isAuthenticated ? `Welcome back, ${userInfo?.name || 'User'}! 👋` : 'Welcome! 👋'}
                </h2>
                <p className={theme === "dark" ? 'text-gray-400' : 'text-gray-500'}>
                  {activeModule === 'dashboard' && `Here's your productivity overview for last ${dateRange} days`}
                  {activeModule === 'journal' && 'Track your thoughts and emotions'}
                  {activeModule === 'tasks' && 'Manage your tasks and projects'}
                  {activeModule === 'calendar' && 'Schedule and organize your events'}
                  {activeModule === 'email' && 'Manage your communications'}
                  {activeModule === 'contacts' && 'Organize your network'}
                  {activeModule === 'settings' && 'Manage your integrations'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search Bar - Enhanced */}
                <div className="relative group">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                    theme === "dark" ? 'text-gray-500 group-hover:text-blue-400' : 'text-gray-400 group-hover:text-blue-500'
                  } transition-colors`} />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:shadow-lg transition-all duration-200 backdrop-blur-sm ${
                      theme === "dark"
                        ? 'border-gray-600 bg-gray-800/70 text-gray-100 placeholder-gray-500 focus:ring-blue-500/50 focus:border-transparent'
                        : 'border-gray-300 bg-white/70 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>

                {/* Header Icons - Enhanced */}
                <button className={`p-3 transition-all duration-200 relative group rounded-xl ${
                  theme === "dark"
                    ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}>
                  <Bell className="w-5 h-5 transform transition-transform group-hover:scale-110" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                </button>

                
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={handleProfileClick}
                    className={`p-3 transition-all duration-200 group rounded-xl relative ${
                      theme === "dark"
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                    } ${showProfileDropdown ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 profile-button-active' : ''}`}
                  >
                    <User className={`w-5 h-5 transform transition-all ${showProfileDropdown ? 'scale-110' : 'group-hover:scale-110'}`} />
                    {showProfileDropdown && (
                      <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    )}
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div className="absolute top-full right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden profile-dropdown-enter">
                      {/* Dropdown Arrow */}
                      <div className="absolute top-0 right-6 transform -translate-y-1/2 rotate-45 w-2 h-2 bg-white dark:bg-gray-800 border-l border-t border-gray-200 dark:border-gray-700"></div>

                      {/* Profile Header */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md">
                            {isAuthenticated ? userInfo?.name?.charAt(0) || 'U' : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                              {isAuthenticated ? userInfo?.name || 'User' : 'Guest User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {isAuthenticated ? userInfo?.email || 'user@example.com' : 'Not signed in'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="py-2">
                        <button
                          onClick={() => handleMenuNavigation('profile')}
                          className={`profile-dropdown-item w-full px-4 py-3 flex items-center space-x-3 text-sm transition-all duration-150 ${
                            theme === "dark"
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-white hover:translate-x-1'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1'
                          }`}
                        >
                          <User className="w-4 h-4 flex-shrink-0" />
                          <span>Profile Settings</span>
                        </button>

                        <button
                          onClick={() => handleMenuNavigation('appearance')}
                          className={`profile-dropdown-item w-full px-4 py-3 flex items-center space-x-3 text-sm transition-all duration-150 ${
                            theme === "dark"
                              ? 'text-gray-300 hover:bg-gray-700 hover:text-white hover:translate-x-1'
                              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900 hover:translate-x-1'
                          }`}
                        >
                          {theme === "dark" ? <Sun className="w-4 h-4 flex-shrink-0" /> : <Moon className="w-4 h-4 flex-shrink-0" />}
                          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                        </button>

                        {/* Divider */}
                        <div className="my-2 border-t border-gray-200 dark:border-gray-700"></div>

                        <button
                          onClick={handleSignOut}
                          className="profile-dropdown-item w-full px-4 py-3 flex items-center space-x-3 text-sm text-red-600 dark:text-red-400 transition-all duration-150 hover:bg-red-50 dark:hover:bg-red-900/20 hover:translate-x-1"
                        >
                          <LogOut className="w-4 h-4 flex-shrink-0" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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

// Main wrapper component that includes ThemeProvider
const MainApp: React.FC = () => {
  return (
    <ThemeProvider>
      <MainAppContent />
    </ThemeProvider>
  );
};

export default MainApp;