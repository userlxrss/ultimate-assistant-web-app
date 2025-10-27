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
import { OAuthSimpleConnect } from './components/OAuthSimpleConnect';
import { AuthStatusIndicator } from './components/AuthStatusIndicator';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings' | 'oauth';

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('contacts');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  // Handle service disconnections with stable callbacks
  const handleGmailDisconnect = useCallback(() => {
    console.log('📧 Gmail disconnected from main app');
    // Could trigger a refresh of the email component or update state
  }, []);

  const handleMotionDisconnect = useCallback(() => {
    console.log('🎯 Motion disconnected from main app');
    // Could trigger a refresh of the tasks component or update state
  }, []);

  const handleGoogleDisconnect = useCallback(() => {
    console.log('📅 Google Calendar disconnected from main app');
    // Could trigger a refresh of the calendar component or update state
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);

  // Global auth status check
  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = authManager.getAuthStatus();
      console.log('🔐 Global auth status check:', authStatus);
      // This will trigger re-renders in child components
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

      // Trigger a custom event that components can listen to
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
    // Implement export functionality
  }, []);

  const navigationItems = [
    { icon: BarChart3, label: 'Dashboard', id: 'dashboard' as ActiveModule },
    { icon: PenSquare, label: 'Journal', id: 'journal' as ActiveModule },
    { icon: CheckSquare, label: 'Tasks', id: 'tasks' as ActiveModule, badge: 'green' },
    { icon: Calendar, label: 'Calendar', id: 'calendar' as ActiveModule, badge: 'red' },
    { icon: Mail, label: 'Email', id: 'email' as ActiveModule },
    { icon: Users, label: 'Contacts', id: 'contacts' as ActiveModule },
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
      case 'oauth':
        return <OAuthSimpleConnect />;
      case 'settings':
        return (
          <SettingsPanelStable
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            onExport={handleExport}
          />
        );
      default:
        return <ContactsApp />;
    }
  }, [activeModule, dateRange, handleDateRangeChange, handleExport]);

  return (
    <NotificationProvider>
      <div className="flex h-screen bg-white">
        {/* Left Sidebar - EXACTLY like your screenshot */}
        <aside className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="font-bold text-xl text-gray-900">Productivity Hub</h1>
              <button className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveModule(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {item.badge === 'green' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                      {item.badge === 'red' && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      )}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 bg-white flex flex-col">
          {/* Welcome Header */}
          <header className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Welcome back! 👋
                </h2>
                <p className="text-gray-500">
                  {activeModule === 'dashboard' && `Here's your productivity overview for last ${dateRange} days`}
                  {activeModule === 'journal' && 'Track your thoughts and emotions'}
                  {activeModule === 'tasks' && 'Manage your tasks and projects'}
                  {activeModule === 'calendar' && 'Schedule and organize your events'}
                  {activeModule === 'email' && 'Manage your communications'}
                  {activeModule === 'contacts' && 'Organize your network'}
                  {activeModule === 'oauth' && 'Connect your services'}
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