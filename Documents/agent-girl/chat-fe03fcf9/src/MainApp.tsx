import React, { useState, useCallback } from 'react';
import { BarChart3, PenSquare, CheckSquare, Calendar, Mail, Users, Shield, Settings, X, Search, Bell, Sun, Moon, User } from 'lucide-react';
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import { SettingsPanelStable } from './components/SettingsStable';
import { NotificationProvider } from './components/NotificationSystem';
import { TimerProvider } from './contexts/TimerContext';
import { OAuthSimpleConnect } from './components/OAuthSimpleConnect';
import { AuthStatusIndicator } from './components/AuthStatusIndicator';
import ContactsApp from './components/ContactsApp';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings' | 'oauth';

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('contacts');
  const [searchQuery, setSearchQuery] = useState('');

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
            dateRange="30"
            onDateRangeChange={() => {}}
            onExport={() => {}}
          />
        );
      default:
        return <ContactsApp />;
    }
  }, [activeModule]);

  const getModuleDescription = useCallback(() => {
    switch (activeModule) {
      case 'dashboard': return 'Here\'s your productivity overview';
      case 'journal': return 'Track your thoughts and emotions';
      case 'tasks': return 'Manage your tasks and projects';
      case 'calendar': return 'Schedule and organize your events';
      case 'email': return 'Manage your communications';
      case 'contacts': return 'Organize your network';
      case 'oauth': return 'Connect your services';
      case 'settings': return 'Configure your preferences';
      default: return 'Organize your network';
    }
  }, [activeModule]);

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
                  {getModuleDescription()}
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