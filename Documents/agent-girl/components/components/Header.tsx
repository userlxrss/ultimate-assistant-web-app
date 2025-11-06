import React, { useState } from 'react';
import { useTheme, ThemeToggle } from '../../index';
import { useUser } from '../../UserContext';

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile }) => {
  const { theme } = useTheme();
  const { currentUser, setCurrentUser } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle clicking outside the dropdown to close it
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dropdown = document.querySelector('[data-profile-dropdown]');

      if (dropdown && !dropdown.contains(target)) {
        // Check if click was on the Sign Out button
        const signOutButton = target.closest('[data-sign-out-button]');
        if (!signOutButton) {
          setIsProfileOpen(false);
        }
      }
    };

    if (isProfileOpen) {
      // Use click instead of mousedown to avoid interfering with button events
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isProfileOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
    // Implement search functionality
  };

  const handleSignOut = (event?: React.MouseEvent | React.KeyboardEvent) => {
    // Prevent duplicate calls
    if (isSigningOut) {
      console.log('🚫 Sign out already in progress, ignoring duplicate call');
      return;
    }

    console.log('🚪 Sign out initiated');
    if (event) {
      console.log('🖱️ Sign Out button event:', event.type);
    }

    // Prevent event bubbling and default behavior immediately
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    setIsSigningOut(true);

    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to sign out?');

    if (confirmed) {
      console.log('✅ User confirmed sign out');

      // Clear user data
      setCurrentUser(null);

      // Clear any stored auth data
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');

      console.log('🗑️ Cleared user data and storage');

      // Close dropdown AFTER sign out logic is complete
      setIsProfileOpen(false);

      // Small delay to ensure state updates complete
      setTimeout(() => {
        // Redirect to login page (you can adjust this as needed)
        console.log('🔄 Redirecting to login page...');
        window.location.href = '/login';
      }, 100);
    } else {
      console.log('❌ User cancelled sign out');
      // Just close the dropdown
      setIsProfileOpen(false);
      setIsSigningOut(false);
    }
  };

  // Simplified and reliable event handlers
  const handleSignOutInteraction = (e: React.MouseEvent | React.KeyboardEvent) => {
    console.log(`🖱️ Sign Out button ${e.type}`);
    e.preventDefault();
    e.stopPropagation();

    // Close dropdown immediately
    setIsProfileOpen(false);

    // Trigger sign out with a small delay to ensure dropdown is closed
    setTimeout(() => {
      handleSignOut(e);
    }, 10);
  };

  const handleSignOutClick = (e: React.MouseEvent) => {
    console.log('🖱️ Sign Out button click');
    handleSignOutInteraction(e);
  };

  const handleSignOutKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      console.log('⌨️ Sign Out button keyDown');
      handleSignOutInteraction(e);
    }
  };

  return (
    <header className="glass glass-blur-16 glass-shadow-lg border-bottom border-light sticky top-0 z-40">
      <div className="header-content">
        {/* Left side - Menu button and Logo */}
        <div className="header-left">
          {isMobile && (
            <button
              onClick={onMenuClick}
              className="glass-button glass-button-secondary p-2 mr-3"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}

          <div className="logo">
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Dashboard
            </h1>
          </div>
        </div>

        {/* Center - Search Bar */}
        <div className="header-center">
          <form onSubmit={handleSearch} className="search-container">
            <div className="glass-input-group">
              <div className="glass-input-icon">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search dashboard..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="glass-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="glass-input-clear"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right side - Theme Toggle and User Profile */}
        <div className="header-right">
          {/* Theme Toggle */}
          <div className="mr-3">
            <ThemeToggle />
          </div>

          {/* Notifications */}
          <button className="glass-button glass-button-secondary p-2 mr-3 relative">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="notification-badge">3</span>
          </button>

          {/* User Profile */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="glass-profile-button"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </button>

            {isProfileOpen && (
              <div
                className="glass glass-blur-16 glass-shadow-lg absolute right-0 mt-2 w-48 rounded-lg border border-light overflow-hidden"
                data-profile-dropdown="true"
              >
                <div className="p-3 border-b border-light">
                  <p className="font-semibold">{currentUser?.name || 'User'}</p>
                  <p className="text-sm opacity-70">{currentUser?.email || 'user@example.com'}</p>
                </div>
                <div className="py-1">
                  <button className="glass-dropdown-item w-full text-left px-3 py-2 hover:bg-hover-bg">
                    Profile Settings
                  </button>
                  <button className="glass-dropdown-item w-full text-left px-3 py-2 hover:bg-hover-bg">
                    Preferences
                  </button>
                  <button
                    data-sign-out-button="true"
                    onClick={handleSignOutClick}
                    onKeyDown={handleSignOutKeyDown}
                    className="glass-dropdown-item w-full text-left px-3 py-2 hover:bg-hover-bg text-error"
                    style={{ cursor: 'pointer' }}
                    type="button"
                    role="button"
                    tabIndex={0}
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};