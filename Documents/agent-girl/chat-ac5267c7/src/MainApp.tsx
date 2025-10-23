import React, { useState, useEffect } from 'react';
import { Menu, X, Bell, Sun, Moon, User, Search } from 'lucide-react';
import DashboardSimple from './components/DashboardSimple';
import JournalApp from './JournalApp';
import TasksApp from './TasksApp';
import CalendarApp from './components/calendar/CalendarApp';
import EmailApp from './EmailApp';
import { SettingsPanel } from './components/Settings';
import { NotificationProvider } from './components/NotificationSystem';
import { TimerProvider } from './contexts/TimerContext';
import { OAuthSimpleConnect } from './components/OAuthSimpleConnect';

type ActiveModule = 'dashboard' | 'journal' | 'tasks' | 'calendar' | 'email' | 'contacts' | 'settings' | 'oauth';

const MainApp: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ActiveModule>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const navigationItems = [
    { icon: '📊', label: 'Dashboard', id: 'dashboard' as ActiveModule },
    { icon: '📝', label: 'Journal', id: 'journal' as ActiveModule },
    { icon: '✅', label: 'Tasks', id: 'tasks' as ActiveModule },
    { icon: '📅', label: 'Calendar', id: 'calendar' as ActiveModule },
    { icon: '📧', label: 'Email', id: 'email' as ActiveModule },
    { icon: '👥', label: 'Contacts', id: 'contacts' as ActiveModule },
    { icon: '🔐', label: 'OAuth', id: 'oauth' as ActiveModule },
    { icon: '⚙️', label: 'Settings', id: 'settings' as ActiveModule }
  ];

  const renderActiveModule = () => {
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
        return (
          <div className="glass-card rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Contacts Module</h2>
            <p className="text-gray-600 dark:text-gray-400">Contacts functionality coming soon...</p>
          </div>
        );
      case 'oauth':
        return <OAuthSimpleConnect />;
      case 'settings':
        return <SettingsPanel dateRange={dateRange} onDateRangeChange={setDateRange} onExport={() => {}} />;
      default:
        return <DashboardSimple />;
    }
  };

  return (
    <NotificationProvider>
      <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
        <div className="flex h-screen bg-gradient-to-br from-sage-50 via-dusty-blue-50 to-soft-lavender-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} glass-card m-4 rounded-2xl transition-all duration-300 overflow-hidden`}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h1 className={`font-bold text-xl text-gray-900 dark:text-white ${!sidebarOpen && 'hidden'}`}>
                  Productivity Hub
                </h1>
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

              {sidebarOpen && (
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveModule(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                        activeModule === item.id
                          ? 'bg-sage-500/20 text-sage-600 dark:text-sage-400 border border-sage-500/30'
                          : 'hover:bg-white/10 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </nav>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto">
            {/* Header */}
            <header className="glass-card m-4 rounded-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Welcome back! 👋
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300">
                      {activeModule === 'dashboard' && `Here's your productivity overview for the last ${dateRange} days`}
                      {activeModule === 'journal' && 'Track your thoughts and emotions'}
                      {activeModule === 'tasks' && 'Manage your tasks and projects'}
                      {activeModule === 'calendar' && 'Schedule and organize your events'}
                      {activeModule === 'email' && 'Manage your communications'}
                      {activeModule === 'contacts' && 'Organize your network'}
                      {activeModule === 'settings' && 'Configure your preferences'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 pr-4 py-2 rounded-xl glass-button text-sm focus:outline-none focus:ring-2 focus:ring-sage-500"
                      />
                    </div>

                    <button className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200 relative">
                      <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    <button
                      onClick={toggleDarkMode}
                      className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200"
                    >
                      {darkMode ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />}
                    </button>

                    <button className="p-2 rounded-xl hover:bg-white/10 dark:hover:bg-white/5 transition-colors duration-200">
                      <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* Module Content */}
            <div className="p-4">
              {renderActiveModule()}
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default MainApp;