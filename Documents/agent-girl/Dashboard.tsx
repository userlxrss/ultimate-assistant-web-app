import React, { useState, useEffect } from 'react';
import { ThemeProvider, useTheme, ThemeToggle } from './index';
import { UserProvider } from './UserContext';
import { Sidebar } from './components/components/Sidebar';
import { Header } from './components/components/Header';
import { DashboardGrid } from './components/components/DashboardGrid';
import { ConnectionStatusBadge } from './components/components/ConnectionStatusBadge';
import './styles/index.css';

// Main Dashboard Application
export const DashboardApp: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive design
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <div className="dashboard-app">
        {/* Connection Status Badge - Global */}
        <ConnectionStatusBadge />

        <div className="dashboard-layout">
          {/* Sidebar */}
          <Sidebar
            isOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
            isMobile={isMobile}
          />

          {/* Main Content Area */}
          <div className={`dashboard-main ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            {/* Header */}
            <Header
              onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
              isMobile={isMobile}
            />

            {/* Dashboard Content */}
            <main className="dashboard-content">
              <DashboardGrid />
            </main>
          </div>
        </div>
      </div>
      </UserProvider>
    </ThemeProvider>
  );
};

export default DashboardApp;