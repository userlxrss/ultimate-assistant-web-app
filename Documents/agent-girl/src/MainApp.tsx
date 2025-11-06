import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BarChart3, PenSquare, CheckSquare, Calendar, Mail, Users, Settings, X, Search, Bell, User, LogOut, Sun, Moon } from 'lucide-react';
import { authManager } from './utils/authManager';
import { userAuthManager } from './utils/userAuth';
import { userDataStorage } from './utils/userDataStorage';
import { getCurrentUser, onAuthStateChange, signOut } from './supabase';
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import ContactsApp from './components/contacts/ContactsApp';
import CleanSettingsPage from './components/CleanSettingsPage';
import { NotificationProvider } from './components/NotificationSystem';
import { SecureUserJournalStorage } from './utils/secureUserJournalStorage';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings';

// Global theme management - unified with settings page
const GLOBAL_THEME_KEY = 'app-theme';

const getStoredTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem(GLOBAL_THEME_KEY);
  const fallback = localStorage.getItem('theme'); // Check old key for compatibility
  const theme = stored || fallback || 'light';

  // Migrate old theme key to new unified key
  if (fallback && !stored) {
    localStorage.setItem(GLOBAL_THEME_KEY, theme);
    localStorage.removeItem('theme');
  }

  return theme === 'light' || theme === 'dark' ? theme : 'light';
};

const setGlobalTheme = (theme: 'light' | 'dark') => {
  const htmlElement = document.documentElement;
  const bodyElement = document.body;

  // Force theme removal first
  htmlElement.classList.remove('dark', 'light');
  bodyElement.classList.remove('dark', 'light');
  htmlElement.removeAttribute('data-theme');
  bodyElement.removeAttribute('data-theme');

  if (theme === 'dark') {
    htmlElement.classList.add('dark');
    bodyElement.classList.add('dark');
    htmlElement.setAttribute('data-theme', 'dark');
    bodyElement.setAttribute('data-theme', 'dark');
  } else {
    htmlElement.classList.add('light');
    bodyElement.classList.add('light');
    htmlElement.setAttribute('data-theme', 'light');
    bodyElement.setAttribute('data-theme', 'light');
  }

  // Save to both keys for compatibility
  localStorage.setItem(GLOBAL_THEME_KEY, theme);
  localStorage.setItem('theme', theme);

  window.dispatchEvent(new CustomEvent('global-theme-changed', {
    detail: { theme }
  }));
};

const toggleTheme = () => {
  // Use unified theme manager if available, otherwise fallback
  if (typeof window !== 'undefined' && window.toggleTheme) {
    window.toggleTheme();
  } else {
    const currentTheme = getStoredTheme();
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setGlobalTheme(newTheme);
  }
};

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const profileButtonRef = useRef<HTMLButtonElement>(null);

  // DISABLED: Emergency fixes that break React events
  useEffect(() => {
    console.log('✅ React event system protection: Emergency fixes disabled');

    const checkAuth = async () => {
      try {
        // Try to get current Supabase user first, fallback to userAuthManager
        let user = null;
        try {
          user = await getCurrentUser();
          if (user) {
            console.log('✅ Using Supabase user:', user);
            const userData = {
              id: user.id,
              email: user.email,
              name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
              username: user.user_metadata?.username || '',
              picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || user.email?.split('@')[0] || 'User')}&background=random`,
              provider: 'supabase'
            };
            user = userData;
          }
        } catch (supabaseError) {
          console.log('⚠️ Supabase auth failed, using fallback');
          user = userAuthManager.getCurrentUser();
        }
        if (user) {
          setIsAuthenticated(true);
          setUserInfo(user);

          // Set avatar URL from user metadata if available
          if (user.user_metadata?.avatar_url) {
            setAvatarUrl(user.user_metadata.avatar_url);
            console.log('🖼️ MainApp loaded avatar from metadata:', user.user_metadata.avatar_url);
          }

          userDataStorage.setData('currentUser', user);
          // Initialize secure journal storage for authenticated user
          try {
            SecureUserJournalStorage.initializeStorage();
          } catch (storageError) {
            console.error("Failed to initialize secure journal storage:", storageError);
          }        } else {
          setIsAuthenticated(false);
          setUserInfo(null);
          setAvatarUrl(null);
          userDataStorage.removeData('currentUser');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        setUserInfo(null);
        setAvatarUrl(null);
      }
    };

    checkAuth();

    // Initialize global theme on app startup
    const currentTheme = getStoredTheme();
    if (document.documentElement.classList.contains('dark') !== (currentTheme === 'dark')) {
      setGlobalTheme(currentTheme);
    }

    // Listen for global theme changes from Settings page
    const handleGlobalThemeChange = (e: CustomEvent) => {
      console.log('🌙 MainApp received global theme change:', e.detail);
      // Force re-render to update UI elements that depend on theme
      setUserInfo(prev => prev ? {...prev} : null);
    };

    window.addEventListener('global-theme-changed', handleGlobalThemeChange as EventListener);

    // Normal cleanup without breaking React events
    return () => {
      console.log('🧹 Normal MainApp component cleanup');
      window.removeEventListener('global-theme-changed', handleGlobalThemeChange as EventListener);
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

  // Listen for profile updates from Settings page
  useEffect(() => {
    const handleProfileUpdate = (event: CustomEvent) => {
      console.log('🔄 MainApp received profile update:', event.detail);

      // Update userInfo with new profile data
      setUserInfo(prev => ({
        ...prev,
        name: event.detail.displayName,
        username: event.detail.displayName.toLowerCase().replace(/\s+/g, '_'),
        email: event.detail.email,
        user_metadata: {
          ...prev?.user_metadata,
          avatar_url: event.detail.avatar_url
        }
      }));

      // Update avatar URL if provided
      if (event.detail.avatar_url) {
        setAvatarUrl(event.detail.avatar_url);
        console.log('🖼️ MainApp received new avatar:', event.detail.avatar_url);
      }

      // Update userDataStorage
      userDataStorage.setData('currentUser', {
        ...userInfo,
        name: event.detail.displayName,
        username: event.detail.displayName.toLowerCase().replace(/\s+/g, '_'),
        email: event.detail.email,
        user_metadata: {
          ...userInfo?.user_metadata,
          avatar_url: event.detail.avatar_url
        }
      });
    };

    window.addEventListener('profileUpdated', handleProfileUpdate as EventListener);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate as EventListener);
  }, [userInfo]);

  // SIMPLE profile click handler
  const handleProfileClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔵 PROFILE BUTTON CLICKED - dropdown should toggle');
    setShowProfileDropdown(prev => !prev);
  }, []);

  // EMERGENCY: FIXED sign out handler
  const handleSignOut = useCallback(async () => {
    console.log("🚨 SIGN OUT BUTTON CLICKED - handleSignOut function called");

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
      setAvatarUrl(null); // Clear avatar URL on sign out
      userDataStorage.removeData('currentUser');

      // Attempt graceful logout with Supabase
      // Handle secure journal storage cleanup
      try {
        SecureUserJournalStorage.handleLogout();
      } catch (cleanupError) {
        console.error("Failed to cleanup secure journal storage:", cleanupError);
      }
      try {
        await signOut();
      } catch (logoutError) {
        console.error("Supabase logout failed:", logoutError);
        // Fallback to userAuthManager
        await userAuthManager.logout();
      }

      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      console.log("✅ Sign out successful - redirecting");

      // Force redirect to premium React login page
      window.location.href = "/";

    } catch (error) {
      console.error("Sign out error:", error);

      // EMERGENCY FALLBACK: Force redirect to premium React login page
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = "/";
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
      {/* Apply global theme classes */}
      <div className="flex h-screen theme-bg-primary">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} theme-bg-card theme-border-primary border-r transition-all duration-300 flex flex-col`}>
          {/* Logo */}
          <div className="p-4 border-b theme-border-primary">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">P</span>
              </div>
              {sidebarOpen && (
                <span className="font-semibold theme-text-primary">Productivity Hub</span>
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
          <div className="p-4 border-t theme-border-primary">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full flex items-center justify-center px-3 py-3 rounded-lg transition-colors theme-text-secondary hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            >
              <X className={`w-5 h-5 transform transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 theme-bg-primary flex flex-col">
          {/* Header */}
          <header className="p-6 border-b theme-border-primary theme-bg-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold theme-text-primary">
                  {isAuthenticated ? `Welcome back, ${userInfo?.name || 'User'}! 👋` : 'Welcome! 👋'}
                </h2>
                <p className="theme-text-secondary">
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

                  {/* Profile Dropdown - SIMPLIFIED */}
                  {showProfileDropdown && (
                    <div className="absolute top-16 right-4 w-64 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg z-50">
                      {/* User Info */}
                      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center overflow-hidden">
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt="Profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  console.log('❌ Avatar failed to load, falling back to letter');
                                  setAvatarUrl(null);
                                }}
                              />
                            ) : (
                              <span className="text-purple-600 dark:text-purple-300 font-semibold">
                                {userInfo?.name?.[0]?.toUpperCase() || userInfo?.email?.[0]?.toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">
                              {userInfo?.name || 'Guest User'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {userInfo?.username ? `@${userInfo?.username}` : userInfo?.email || 'Not signed in'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="p-2">
                        <button
                          onClick={() => {
                            setActiveModule('settings');
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Settings</span>
                        </button>
                        <button
                          onClick={() => {
                            toggleTheme();
                            setShowProfileDropdown(false);
                          }}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          <Moon className="w-4 h-4" />
                          <span>Dark Mode</span>
                        </button>

                        {/* SIGN OUT BUTTON - SIMPLIFIED */}
                        <button
                          onMouseDown={async (e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            // Close dropdown immediately
                            setShowProfileDropdown(false);

                            // Clear everything
                            setIsAuthenticated(false);
                            setUserInfo(null);
                            setAvatarUrl(null);
                            localStorage.clear();
                            sessionStorage.clear();

                            // Force redirect to premium React login page
                            window.location.href = "/";
                          }}
                          className="w-full px-4 py-2 flex items-center space-x-3 text-sm transition-colors text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded"
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