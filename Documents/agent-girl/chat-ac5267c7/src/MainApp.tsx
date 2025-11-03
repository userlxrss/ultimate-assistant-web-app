import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, PenSquare, CheckSquare, Calendar, Mail, Users, Settings, X, Search, Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { authManager } from './utils/authManager';
import { userAuthManager } from './utils/userAuth';
import { userDataStorage } from './utils/userDataStorage';
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import ContactsApp from './components/contacts/ContactsApp';
import CleanSettingsPage from './components/CleanSettingsPage';
import { NotificationProvider } from './components/NotificationSystem';
// EMERGENCY: DISABLE TimerProvider and ThemeProvider to fix performance issues
// 
// 

// EMERGENCY CRITICAL FIXES
import {
  disableAppearanceStorage,
  performEmergencySignOut,
  clearAllTimers,
  forceThemeOverride
} from '../CRITICAL-FIXES';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings';

// Simplified theme management
const toggleTheme = () => {
  const isDark = document.documentElement.classList.contains('dark');
  if (isDark) {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  }
};

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // EMERGENCY: Add cleanup and performance fixes on mount
  useEffect(() => {
    console.log('🚨 EMERGENCY: Applying critical fixes on component mount...');

    // Apply emergency fixes immediately
    clearAllTimers();
    disableAppearanceStorage();
    forceThemeOverride('light');

    const checkAuth = async () => {
      try {
        const userSession = await userAuthManager.checkSession();
        if (userSession.isValid && userSession.user) {
          setIsAuthenticated(true);
          setUserInfo(userSession.user);
          userDataStorage.setCurrentUser(userSession.user);
        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
          userDataStorage.setCurrentUser(null);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserInfo(null);
      }
    };

    checkAuth();

    // EMERGENCY: Cleanup on unmount
    return () => {
      console.log('🧹 EMERGENCY: Cleaning up MainApp component...');
      clearAllTimers();
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          profileButtonRef.current && !profileButtonRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showProfileDropdown]);

  // Close dropdown on ESC key
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowProfileDropdown(false);
      }
    };

    if (showProfileDropdown) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [showProfileDropdown]);

  // SIMPLE profile click handler
  const handleProfileClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Profile clicked - toggling dropdown');
    setShowProfileDropdown(prev => !prev);
  }, []);

  // EMERGENCY: FIXED sign out handler
  // EMERGENCY OPTIMIZED SIGN OUT HANDLER
  const handleSignOut = useCallback(async () => {
    console.log("🚨 EMERGENCY SIGN OUT INITIATED");
    
    try {
      setShowProfileDropdown(false);
      
      // Clear all timers and intervals first
      const highestTimeoutId = setTimeout(() => {}, 0);
      for (let i = 1; i <= highestTimeoutId; i++) {
        clearTimeout(i);
        clearInterval(i);
      }
      
      // Clear local state
      setIsAuthenticated(false);
      setUserInfo(null);
      userDataStorage.setCurrentUser(null);
      
      // Attempt graceful logout
      try {
        await userAuthManager.logout();
      } catch (logoutError) {
        console.error("Graceful logout failed:", logoutError);
      }
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      console.log("✅ Sign out successful - redirecting");
      
      // Force redirect
      window.location.href = "/";
      
    } catch (error) {
      console.error("Sign out error:", error);
      
      // EMERGENCY FALLBACK: Force reload
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
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

  // EMERGENCY: FIXED renderActiveModule - DISABLED TimerProvider
  const renderActiveModule = useCallback(() => {
    console.log(`🚨 EMERGENCY: Loading module ${activeModule} with performance fixes`);

    switch (activeModule) {
      case 'dashboard':
        // EMERGENCY: DISABLE TimerProvider to prevent memory leaks
        return <DashboardSimple />;
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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Module Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400">The requested module could not be loaded.</p>
          </div>
        );
    }
  }, [activeModule]);

  const isDark = document.documentElement.classList.contains('dark');

  return (
    <NotificationProvider>
      {/* EMERGENCY: Apply performance fixes and stable theme */}
      <div className={`flex h-screen bg-gray-50`}>
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-r transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              {sidebarOpen && (
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Productivity Hub</span>
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
                  className={`w-full flex items-center ${sidebarOpen ? 'space-x-3' : 'justify-center'} px-3 py-3 rounded-lg transition-colors ${
                    isActive
                      ? isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-50 text-blue-600'
                      : isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Toggle */}
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`w-full flex items-center justify-center px-3 py-3 rounded-lg transition-colors ${
                isDark ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <X className={`w-5 h-5 transform transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'} flex flex-col`}>
          {/* Header */}
          <header className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {isAuthenticated ? `Welcome back, ${userInfo?.name || 'User'}! 👋` : 'Welcome! 👋'}
                </h2>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {activeModule === 'dashboard' && 'Here\'s your productivity overview'}
                  {activeModule === 'journal' && 'Track your thoughts and emotions'}
                  {activeModule === 'tasks' && 'Manage your tasks and projects'}
                  {activeModule === 'calendar' && 'Schedule and organize your events'}
                  {activeModule === 'email' && 'Manage your communications'}
                  {activeModule === 'contacts' && 'Organize your network'}
                  {activeModule === 'settings' && 'Manage your settings'}
                </p>
              </div>

              <div className="flex items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark
                        ? 'border-gray-600 bg-gray-800 text-white placeholder-gray-500'
                        : 'border-gray-300 bg-white text-gray-900 placeholder-gray-500'
                    }`}
                  />
                </div>

                {/* Notifications */}
                <button className={`p-2 rounded-lg transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'}`}>
                  <Bell className="w-5 h-5" />
                </button>

                {/* Profile Button */}
                <div className="relative">
                  <button
                    ref={profileButtonRef}
                    onClick={handleProfileClick}
                    className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-400 hover:bg-gray-100'
                    } ${showProfileDropdown ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : ''}`}
                    aria-label="Profile menu"
                  >
                    <User className="w-5 h-5" />
                  </button>

                  {/* Profile Dropdown */}
                  {showProfileDropdown && (
                    <div
                      ref={dropdownRef}
                      className={`absolute right-0 mt-2 w-72 rounded-lg shadow-lg border z-50 ${
                        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                      }`}
                    >
                      {/* Profile Header */}
                      <div className={`p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {isAuthenticated ? userInfo?.name?.charAt(0) || 'U' : 'U'}
                          </div>
                          <div>
                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {isAuthenticated ? userInfo?.name || 'User' : 'Guest User'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {isAuthenticated ? userInfo?.email || 'user@example.com' : 'Not signed in'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Options */}
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setActiveModule('settings');
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <User className="w-4 h-4" />
                          <span>Settings</span>
                        </button>

                        <button
                          onClick={() => {
                            toggleTheme();
                            setShowProfileDropdown(false);
                          }}
                          className={`w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors ${
                            isDark ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                          <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        <div className={`my-2 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}></div>

                        <button
                          onClick={handleSignOut}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="w-4 h-4" />
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

export default MainApp;