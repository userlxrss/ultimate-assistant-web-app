import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle2, Link, Palette, User, Camera } from 'lucide-react';
import { motionAPI } from '../utils/motionApi';
import { realGmailAPI } from '../utils/realGmailAPI';
import { AppearanceStorage, FontSize } from '../utils/appearanceStorage';
import { getCurrentUser, supabase, uploadAvatar, deleteAvatar, updateUserAvatar } from '../supabase';

interface AppConnection {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  iconColor: string;
  isConnected: boolean;
  lastSync?: Date;
  status?: string;
  targetTab: string;
}

// GLOBAL THEME MANAGEMENT - Single source of truth
const GLOBAL_THEME_KEY = 'app-theme';

const getStoredTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem(GLOBAL_THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'light';
};

const setGlobalTheme = (theme: 'light' | 'dark') => {
  // Apply to both html and body elements for maximum compatibility
  const htmlElement = document.documentElement;
  const bodyElement = document.body;

  if (theme === 'dark') {
    htmlElement.classList.add('dark');
    bodyElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
    bodyElement.classList.remove('dark');
  }

  // Save to localStorage
  localStorage.setItem(GLOBAL_THEME_KEY, theme);

  // Dispatch global theme change event
  window.dispatchEvent(new CustomEvent('global-theme-changed', {
    detail: { theme }
  }));

  console.log(`🌙 Global theme changed to ${theme}`);
};

const getCurrentTheme = (): 'light' | 'dark' => {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
};

const initializeTheme = () => {
  const theme = getStoredTheme();
  setGlobalTheme(theme);
};

const CleanSettingsPage: React.FC = () => {
  // Use direct theme state instead of context
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => getCurrentTheme());

  // User data state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // Sync theme state with DOM on mount and storage changes
  useEffect(() => {
    // Initialize global theme on mount
    initializeTheme();
    setThemeState(getCurrentTheme());

    // Listen for global theme changes
    const handleGlobalThemeChange = (e: CustomEvent) => {
      console.log('🌙 Settings received global theme change:', e.detail);
      setThemeState(e.detail.theme);
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === GLOBAL_THEME_KEY) {
        const newTheme = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : 'light';
        setGlobalTheme(newTheme);
        setThemeState(newTheme);
      }
    };

    window.addEventListener('global-theme-changed', handleGlobalThemeChange as EventListener);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('global-theme-changed', handleGlobalThemeChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load current user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoadingUser(true);
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUserData();
  }, []);

  // Theme toggle function
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setGlobalTheme(newTheme);
    setThemeState(newTheme);
  };

  // Font size management
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    return AppearanceStorage.getFontSize();
  });

  const updateFontSize = (newSize: FontSize) => {
    setFontSize(newSize);
    AppearanceStorage.setFontSize(newSize);
  };

  // App connections state
  const [connections, setConnections] = useState<AppConnection[]>([
    {
      id: 'gmail',
      name: 'Gmail',
      description: 'Email integration',
      icon: <Mail className="w-5 h-5" />,
      iconColor: 'text-red-500',
      isConnected: true,
      lastSync: new Date(),
      status: 'connected',
      targetTab: 'email'
    },
    {
      id: 'motion',
      name: 'Motion',
      description: 'Calendar & tasks',
      icon: <CheckCircle2 className="w-5 h-5" />,
      iconColor: 'text-blue-500',
      isConnected: false,
      targetTab: 'tasks'
    },
    {
      id: 'google-drive',
      name: 'Google Drive',
      description: 'File storage',
      icon: <Link className="w-5 h-5" />,
      iconColor: 'text-green-500',
      isConnected: false,
      targetTab: 'files'
    }
  ]);

  // Avatar upload state
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setUploadingAvatar(true);

      // Upload avatar
      const publicUrl = await uploadAvatar(file, currentUser.id);

      if (publicUrl) {
        // Update user profile
        await updateUserAvatar(currentUser.id, publicUrl);

        // Update local state
        setCurrentUser(prev => ({
          ...prev,
          avatar_url: publicUrl
        }));

        setAvatarPreview(publicUrl);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle avatar removal
  const handleRemoveAvatar = async () => {
    if (!currentUser || !currentUser.avatar_url) return;

    try {
      setUploadingAvatar(true);

      // Delete avatar from storage
      await deleteAvatar(currentUser.avatar_url);

      // Update user profile
      await updateUserAvatar(currentUser.id, null);

      // Update local state
      setCurrentUser(prev => ({
        ...prev,
        avatar_url: null
      }));

      setAvatarPreview('');

      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle app connection
  const handleConnectionToggle = async (connectionId: string) => {
    const connection = connections.find(c => c.id === connectionId);
    if (!connection) return;

    try {
      if (connection.id === 'gmail') {
        if (connection.isConnected) {
          // Disconnect Gmail
          await realGmailAPI.signOut();
          setConnections(prev => prev.map(c =>
            c.id === connectionId
              ? { ...c, isConnected: false, lastSync: undefined, status: 'disconnected' }
              : c
          ));
        } else {
          // Connect Gmail
          await realGmailAPI.signIn();
          setConnections(prev => prev.map(c =>
            c.id === connectionId
              ? { ...c, isConnected: true, lastSync: new Date(), status: 'connected' }
              : c
          ));
        }
      } else if (connection.id === 'motion') {
        if (connection.isConnected) {
          // Disconnect Motion
          await motionAPI.disconnect();
          setConnections(prev => prev.map(c =>
            c.id === connectionId
              ? { ...c, isConnected: false, lastSync: undefined, status: 'disconnected' }
              : c
          ));
        } else {
          // Connect Motion
          await motionAPI.connect();
          setConnections(prev => prev.map(c =>
            c.id === connectionId
              ? { ...c, isConnected: true, lastSync: new Date(), status: 'connected' }
              : c
          ));
        }
      }
    } catch (error) {
      console.error(`Error toggling ${connection.name} connection:`, error);
    }
  };

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <style>{`
        .settings-page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background-color: #ffffff;
          color: #1f2937;
          transition: background-color 0.3s ease, color 0.3s ease;
        }

        .dark .settings-page {
          background-color: #0f172a;
          color: #f1f5f9;
        }

        .settings-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .settings-title {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .settings-subtitle {
          font-size: 16px;
          color: #6b7280;
        }

        .dark .settings-subtitle {
          color: #9ca3af;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .settings-section {
          background: #ffffff;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .settings-section:hover {
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .dark .settings-section {
          background: #1e293b;
          border-color: #334155;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #1f2937;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dark .section-title {
          color: #f1f5f9;
        }

        .section-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 20px;
        }

        .dark .section-subtitle {
          color: #9ca3af;
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f3f4f6;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .theme-toggle:hover {
          background: #e5e7eb;
        }

        .dark .theme-toggle {
          background: #334155;
        }

        .dark .theme-toggle:hover {
          background: #475569;
        }

        .theme-icon {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 14px;
        }

        .dark .theme-icon {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
        }

        .theme-text {
          flex: 1;
        }

        .theme-label {
          font-weight: 500;
          color: #1f2937;
        }

        .dark .theme-label {
          color: #f1f5f9;
        }

        .theme-description {
          font-size: 12px;
          color: #6b7280;
        }

        .dark .theme-description {
          color: #9ca3af;
        }

        .theme-switch {
          width: 48px;
          height: 24px;
          background: #d1d5db;
          border-radius: 12px;
          position: relative;
          transition: background-color 0.3s ease;
        }

        .dark .theme-switch {
          background: #4b5563;
        }

        .theme-switch-handle {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 0.3s ease;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .dark .theme-switch-handle {
          transform: translateX(24px);
        }

        .font-size-options {
          display: flex;
          gap: 8px;
        }

        .font-size-btn {
          flex: 1;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 14px;
          text-align: center;
        }

        .font-size-btn:hover {
          background: #f3f4f6;
        }

        .font-size-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .dark .font-size-btn {
          background: #374151;
          border-color: #4b5563;
          color: #f1f5f9;
        }

        .dark .font-size-btn:hover {
          background: #4b5563;
        }

        .dark .font-size-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .avatar-section {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar-container {
          position: relative;
        }

        .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
          font-size: 24px;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }

        .avatar-container:hover .avatar-overlay {
          opacity: 1;
        }

        .avatar-info {
          flex: 1;
        }

        .avatar-name {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .dark .avatar-name {
          color: #f1f5f9;
        }

        .avatar-email {
          font-size: 14px;
          color: #6b7280;
        }

        .dark .avatar-email {
          color: #9ca3af;
        }

        .avatar-actions {
          display: flex;
          gap: 8px;
        }

        .avatar-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .avatar-btn:hover {
          background: #f3f4f6;
        }

        .dark .avatar-btn {
          background: #374151;
          border-color: #4b5563;
          color: #f1f5f9;
        }

        .dark .avatar-btn:hover {
          background: #4b5563;
        }

        .integrations-container {
          max-width: 900px;
          margin: 0 auto;
        }

        /* Security Notice - FIXED: Removed inner dark backgrounds */
        .security-notice {
          display: flex;
          gap: 14px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
          border: 1px solid #BFDBFE;
          border-radius: 12px;
          margin-bottom: 24px;
        }

        .dark .security-notice {
          background: linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%);
          border-color: rgba(139, 92, 246, 0.3);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
        }

        .notice-icon {
          font-size: 24px;
          flex-shrink: 0;
          filter: brightness(0) invert(1); /* Makes the lock icon white on dark gradient */
        }

        .dark .notice-icon {
          filter: brightness(0) invert(1) brightness(1.2); /* Ensures white icon on gradient */
        }

        .notice-content {
          flex: 1;
        }

        .notice-content h4 {
          font-size: 14px;
          font-weight: 700;
          color: #1E40AF;
          margin-bottom: 4px;
        }

        .dark .notice-content h4 {
          color: #FFFFFF !important; /* White text directly on gradient */
          font-weight: 700;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .notice-content p {
          font-size: 13px;
          color: #3730A3;
          line-height: 1.5;
          margin: 0;
        }

        .dark .notice-content p {
          color: #FFFFFF !important; /* White text directly on gradient */
          opacity: 0.9;
        }

        .integrations-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 16px;
        }

        .integration-item {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          transition: all 0.3s ease;
        }

        .integration-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .dark .integration-item {
          background: #374151;
          border-color: #4b5563;
        }

        .integration-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }

        .integration-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f3f4f6;
        }

        .dark .integration-icon {
          background: #4b5563;
        }

        .gmail-icon {
          background: #ea4335;
          color: white;
        }

        .integration-details h3 {
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .dark .integration-details h3 {
          color: #f1f5f9;
        }

        .integration-details p {
          font-size: 14px;
          color: #6b7280;
        }

        .dark .integration-details p {
          color: #9ca3af;
        }

        .integration-status {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-badge.connected {
          background: #d1fae5;
          color: #065f46;
        }

        .dark .status-badge.connected {
          background: #065f46;
          color: #d1fae5;
        }

        .status-badge.disconnected {
          background: #fee2e2;
          color: #991b1b;
        }

        .dark .status-badge.disconnected {
          background: #991b1b;
          color: #fee2e2;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
        }

        .connect-btn {
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          background: #ffffff;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .connect-btn:hover {
          background: #f3f4f6;
        }

        .connect-btn.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .connect-btn.primary:hover {
          background: #2563eb;
        }

        .dark .connect-btn {
          background: #374151;
          border-color: #4b5563;
          color: #f1f5f9;
        }

        .dark .connect-btn:hover {
          background: #4b5563;
        }

        .dark .connect-btn.primary {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .dark .connect-btn.primary:hover {
          background: #2563eb;
        }

        .quick-settings {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
        }

        .quick-setting-btn {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          text-align: left;
        }

        .quick-setting-btn:hover {
          background: #f3f4f6;
          transform: translateY(-1px);
        }

        .dark .quick-setting-btn {
          background: #374151;
          border-color: #4b5563;
          color: #f1f5f9;
        }

        .dark .quick-setting-btn:hover {
          background: #4b5563;
        }

        .quick-setting-title {
          font-weight: 500;
          margin-bottom: 4px;
          color: #1f2937;
        }

        .dark .quick-setting-title {
          color: #f1f5f9;
        }

        .quick-setting-description {
          font-size: 12px;
          color: #6b7280;
        }

        .dark .quick-setting-description {
          color: #9ca3af;
        }
      `}</style>

      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your preferences and account settings</p>
      </div>

      <div className="settings-grid">
        {/* Profile Section */}
        <div className="settings-section">
          <h2 className="section-title">
            <User className="w-5 h-5" />
            Profile
          </h2>
          <p className="section-subtitle">Manage your profile information</p>

          <div className="avatar-section">
            <div className="avatar-container">
              {currentUser?.avatar_url ? (
                <div className="avatar">
                  <img src={currentUser.avatar_url} alt="Profile" />
                </div>
              ) : (
                <div className="avatar">
                  {currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="avatar-overlay" onClick={() => fileInputRef.current?.click()}>
                <Camera className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="avatar-info">
              <div className="avatar-name">{currentUser?.user_metadata?.name || 'User'}</div>
              <div className="avatar-email">{currentUser?.email || 'user@example.com'}</div>
            </div>
            <div className="avatar-actions">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                style={{ display: 'none' }}
              />
              <button
                className="avatar-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
              >
                {uploadingAvatar ? 'Uploading...' : 'Change'}
              </button>
              {currentUser?.avatar_url && (
                <button
                  className="avatar-btn"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <h2 className="section-title">
            <Palette className="w-5 h-5" />
            Appearance
          </h2>
          <p className="section-subtitle">Customize your interface</p>

          <div className="theme-toggle" onClick={toggleTheme}>
            <div className="theme-icon">
              {theme === 'light' ? '☀️' : '🌙'}
            </div>
            <div className="theme-text">
              <div className="theme-label">
                {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </div>
              <div className="theme-description">
                {theme === 'light' ? 'Bright and clean interface' : 'Easy on the eyes'}
              </div>
            </div>
            <div className="theme-switch">
              <div className="theme-switch-handle"></div>
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <div style={{ fontWeight: 500, marginBottom: '8px', color: theme === 'dark' ? '#f1f5f9' : '#1f2937' }}>
              Font Size
            </div>
            <div className="font-size-options">
              <button
                className={`font-size-btn ${fontSize === 'small' ? 'active' : ''}`}
                onClick={() => updateFontSize('small')}
              >
                Small
              </button>
              <button
                className={`font-size-btn ${fontSize === 'medium' ? 'active' : ''}`}
                onClick={() => updateFontSize('medium')}
              >
                Medium
              </button>
              <button
                className={`font-size-btn ${fontSize === 'large' ? 'active' : ''}`}
                onClick={() => updateFontSize('large')}
              >
                Large
              </button>
            </div>
          </div>
        </div>

        {/* Connected Apps Section */}
        <div className="settings-section" style={{ gridColumn: '1 / -1' }}>
          <h2 className="section-title">Connected Apps</h2>
          <p className="section-subtitle">Manage integrations with your productivity tools</p>

          <div className="integrations-container">
            {/* Security Notice - FIXED: Clean gradient banner with white text */}
            <div className="security-notice">
              <div className="notice-icon">🔒</div>
              <div className="notice-content">
                <h4>Your data is secure</h4>
                <p>All connections use OAuth authentication. We never store passwords and only request necessary permissions.</p>
              </div>
            </div>

            {/* Connected Apps Grid */}
            <div className="integrations-grid">
              {connections.map((connection) => (
                <div key={connection.id} className="integration-item">
                  <div className="integration-header">
                    <div className={`integration-icon ${connection.id === 'gmail' ? 'gmail-icon' : ''}`}>
                      {connection.icon}
                    </div>
                    <div className="integration-details">
                      <h3>{connection.name}</h3>
                      <p>{connection.description}</p>
                    </div>
                  </div>
                  <div className="integration-status">
                    <span className={`status-badge ${connection.isConnected ? 'connected' : 'disconnected'}`}>
                      {connection.isConnected && <span className="status-dot"></span>}
                      {connection.isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                    <button
                      className={`connect-btn ${connection.isConnected ? '' : 'primary'}`}
                      onClick={() => handleConnectionToggle(connection.id)}
                    >
                      {connection.isConnected ? 'Disconnect' : 'Connect'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Settings */}
        <div className="settings-section" style={{ gridColumn: '1 / -1' }}>
          <h2 className="section-title">Quick Settings</h2>
          <p className="section-subtitle">Common settings and actions</p>

          <div className="quick-settings">
            <button className="quick-setting-btn">
              <div className="quick-setting-title">Export Data</div>
              <div className="quick-setting-description">Download your data</div>
            </button>
            <button className="quick-setting-btn">
              <div className="quick-setting-title">Notifications</div>
              <div className="quick-setting-description">Manage alerts and updates</div>
            </button>
            <button className="quick-setting-btn">
              <div className="quick-setting-title">Privacy</div>
              <div className="quick-setting-description">Control your data</div>
            </button>
            <button className="quick-setting-btn">
              <div className="quick-setting-title">Help & Support</div>
              <div className="quick-setting-description">Get help and contact us</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CleanSettingsPage;